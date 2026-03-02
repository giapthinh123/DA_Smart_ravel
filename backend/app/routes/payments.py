"""
Payment API Routes
Handles payment creation, status updates, and retrieval
"""

from flask import Blueprint, jsonify, request, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
import logging
import hashlib
import hmac
import urllib.parse
from datetime import datetime, timezone, timedelta
from ..extensions import mongo
from ..models.payments import Payments
from ..models.users import Users
from ..models.pending_registrations import PendingRegistrations
from ..models.itinerary_models import TourItinerary
from ..config import Config

logger = logging.getLogger(__name__)

VN_TZ = timezone(timedelta(hours=7))


def _vnpay_hmac_sha512(secret_key: str, data: str) -> str:
    return hmac.new(
        secret_key.encode("utf-8"),
        data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()


def _vnpay_build_payment_url(params: dict) -> str:
    """
    Build VNPAY payment URL following the official Python demo:
    - Sort params alphabetically
    - Build hash string with quote_plus-encoded VALUES (keys kept raw)
    - Build query string with quote_plus-encoded keys AND values
    - Append vnp_SecureHash at the end
    """
    sorted_params = sorted(params.items())
    # Hash data: keys raw, values quote_plus encoded (matches VNPAY Python library standard)
    hash_data = "&".join(
        f"{k}={urllib.parse.quote_plus(str(v))}"
        for k, v in sorted_params
    )
    secure_hash = _vnpay_hmac_sha512(Config.VNPAY_HASH_SECRET, hash_data)
    query_string = "&".join(
        f"{urllib.parse.quote_plus(str(k))}={urllib.parse.quote_plus(str(v))}"
        for k, v in sorted_params
    )
    return f"{Config.VNPAY_URL}?{query_string}&vnp_SecureHash={secure_hash}"


def _vnpay_verify_return(params: dict) -> bool:
    """
    Verify VNPAY return signature.
    Flask already URL-decodes request.args, so re-encode values with quote_plus
    to match the same hash format used when building the payment URL.
    """
    received_hash = params.pop("vnp_SecureHash", None)
    params.pop("vnp_SecureHashType", None)
    # Only include vnp_* params, sorted alphabetically
    sorted_params = sorted(
        (k, v) for k, v in params.items() if str(k).startswith("vnp_")
    )
    hash_data = "&".join(
        f"{k}={urllib.parse.quote_plus(str(v))}"
        for k, v in sorted_params
    )
    expected_hash = _vnpay_hmac_sha512(Config.VNPAY_HASH_SECRET, hash_data)
    return received_hash == expected_hash

payments_bp = Blueprint("payments", __name__)


@payments_bp.route("/create", methods=["POST"])
@jwt_required()
def create_payment():
    """
    Create a new payment record

    Request body:
    {
        "tour_id": "itin_xxx",
        "payment_type": "tour_booking",
        "amount": 1217.28,
        "currency": "USD",
        "payment_method": "credit_card",
        "payment_gateway": "stripe",
        "payment_details": {
            "itinerary_summary": {...},
            "flight_cost": 429.28,
            "daily_costs": [...]
        }
    }
    """
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity
        data = request.get_json() or {}

        # Validate required fields
        tour_id = data.get("tour_id")
        if not tour_id:
            return jsonify({"error": "tour_id is required"}), 400

        amount = data.get("amount")
        if amount is None or float(amount) <= 0:
            return jsonify({"error": "Valid amount is required"}), 400

        # Build payment data
        payment_data = {
            "user_id": user_id,
            "tour_id": tour_id,
            "payment_type": data.get("payment_type", "tour_booking"),
            "amount": float(amount),
            "currency": data.get("currency", "USD"),
            "payment_method": data.get("payment_method", "credit_card"),
            "payment_status": "pending",
            "payment_gateway": data.get("payment_gateway", "manual"),
            "payment_details": data.get("payment_details", {}),
        }

        payment = Payments.create(payment_data, mongo)

        # Remove MongoDB ObjectId for JSON serialization
        payment.pop("_id", None)

        logger.info(f"Payment created: {payment['payment_id']} for user {user_id}")

        return jsonify({
            "message": "Payment created successfully",
            "payment": Payments._serialize(payment),
        }), 201

    except Exception as e:
        logger.error(f"Error creating payment: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/confirm/<payment_id>", methods=["PUT"])
@jwt_required()
def confirm_payment(payment_id):
    """
    Confirm/complete a payment (simulate payment gateway callback)

    Request body (optional):
    {
        "transaction_id": "txn_xxx",
        "payment_status": "completed"
    }
    """
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity
        data = request.get_json() or {}

        # Verify payment exists and belongs to user
        payment = Payments.find_by_payment_id(mongo, payment_id)
        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        if payment["user_id"] != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        new_status = data.get("payment_status", "completed")
        transaction_id = data.get("transaction_id", f"txn_{payment_id}")

        success = Payments.update_status(
            mongo, payment_id, new_status, transaction_id
        )

        if success:
            updated = Payments.find_by_payment_id(mongo, payment_id)
            logger.info(f"Payment {payment_id} confirmed: {new_status}")
            mongo.db.itineraries.update_one(
                {"itinerary_id": payment["tour_id"]},
                {"$set": {"status": "payed", "updated_at": datetime.now()}}
            )
            return jsonify({
                "message": f"Payment {new_status}",
                "payment": updated,
            }), 200
        else:
            return jsonify({"error": "Failed to update payment"}), 500

    except Exception as e:
        logger.error(f"Error confirming payment: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/<payment_id>", methods=["GET"])
@jwt_required()
def get_payment(payment_id):
    """Get a specific payment by payment_id"""
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity

        payment = Payments.find_by_payment_id(mongo, payment_id)
        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        # Only allow user to see their own payments (unless admin)
        user_role = identity.get("role", "user") if isinstance(identity, dict) else "user"
        if payment["user_id"] != user_id and user_role != "admin":
            return jsonify({"error": "Unauthorized"}), 403

        return jsonify({"payment": payment}), 200

    except Exception as e:
        logger.error(f"Error getting payment: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/user", methods=["GET"])
@jwt_required()
def get_user_payments():
    """
    Get all payments for the current user

    Query params:
        - limit: number of results (default 50)
        - skip: pagination offset (default 0)
    """
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity

        limit = int(request.args.get("limit", 50))
        skip = int(request.args.get("skip", 0))

        payments = Payments.find_by_user_id(mongo, user_id, limit=limit, skip=skip)
        total = Payments.count_by_user(mongo, user_id)

        return jsonify({
            "count": len(payments),
            "total": total,
            "payments": payments,
        }), 200

    except Exception as e:
        logger.error(f"Error getting user payments: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/tour/<tour_id>", methods=["GET"])
@jwt_required()
def get_tour_payments(tour_id):
    """Get all payments for a specific tour/itinerary"""
    try:
        payments = Payments.find_by_tour_id(mongo, tour_id)
        return jsonify({
            "count": len(payments),
            "payments": payments,
        }), 200

    except Exception as e:
        logger.error(f"Error getting tour payments: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_payment_stats():
    """Get payment statistics for current user"""
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity

        total_payments = Payments.count_by_user(mongo, user_id)
        total_spent = Payments.get_total_spent(mongo, user_id)

        return jsonify({
            "total_payments": total_payments,
            "total_spent": round(total_spent, 2),
        }), 200

    except Exception as e:
        logger.error(f"Error getting payment stats: {e}")
        return jsonify({"error": str(e)}), 500


# ========== VNPAY routes ==========


@payments_bp.route("/vnpay/create-payment-url", methods=["POST"])
@jwt_required()
def vnpay_create_payment_url():
    """
    Create a VNPAY payment URL for an itinerary.

    Request body:
    {
        "itinerary_id": "itin_xxx",
        "amount_usd": 500.0,
        "order_info": "Thanh toan tour du lich",
        "language": "vn"  // optional, default "vn"
    }
    Returns:
    {
        "payment_url": "https://sandbox.vnpayment.vn/...",
        "payment_id": "pay_xxx",
        "txn_ref": "pay_xxx"
    }
    """
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity
        data = request.get_json() or {}

        itinerary_id = data.get("itinerary_id")
        if not itinerary_id:
            return jsonify({"error": "itinerary_id is required"}), 400

        amount_usd = float(data.get("amount_usd", 0))
        if amount_usd <= 0:
            return jsonify({"error": "Valid amount_usd is required"}), 400

        amount_vnd = int(amount_usd * Config.USD_TO_VND_RATE)

        order_info_raw = data.get("order_info", f"Thanh toan tour {itinerary_id}")
        import unicodedata
        order_info = unicodedata.normalize("NFD", order_info_raw)
        order_info = "".join(c for c in order_info if unicodedata.category(c) != "Mn")
        order_info = order_info[:255]

        payment_data = {
            "user_id": user_id,
            "tour_id": itinerary_id,
            "payment_type": "tour_booking",
            "amount": amount_usd,
            "currency": "USD",
            "payment_method": "vnpay",
            "payment_status": "pending",
            "payment_gateway": "vnpay",
            "payment_details": {
                "amount_vnd": amount_vnd,
                "order_info": order_info,
            },
        }
        payment = Payments.create(payment_data, mongo)
        payment.pop("_id", None)
        payment_id = payment["payment_id"]

        now_vn = datetime.now(VN_TZ)
        create_date = now_vn.strftime("%Y%m%d%H%M%S")
        expire_date = (now_vn + timedelta(minutes=15)).strftime("%Y%m%d%H%M%S")

        ip_addr = (
            request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
        )
        ip_addr = ip_addr.split(",")[0].strip()

        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": Config.VNPAY_TMN_CODE,
            "vnp_Amount": str(amount_vnd * 100),
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": payment_id,
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": data.get("language", "vn"),
            "vnp_ReturnUrl": Config.VNPAY_RETURN_URL,
            "vnp_IpAddr": ip_addr,
            "vnp_CreateDate": create_date,
            "vnp_ExpireDate": expire_date,
        }

        payment_url = _vnpay_build_payment_url(vnp_params)

        logger.info(f"VNPAY URL created for payment {payment_id}, itinerary {itinerary_id}")

        return jsonify({
            "payment_url": payment_url,
            "payment_id": payment_id,
            "txn_ref": payment_id,
            "amount_vnd": amount_vnd,
        }), 200

    except Exception as e:
        logger.error(f"Error creating VNPAY payment URL: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/vnpay/return", methods=["GET"])
def vnpay_return():
    """
    Handle VNPAY return callback (IPN / ReturnUrl).
    VNPAY calls this via redirect after payment.
    Returns payment result as JSON for the frontend to consume.
    """
    try:
        params = dict(request.args)
        response_code = params.get("vnp_ResponseCode", "")
        txn_ref = params.get("vnp_TxnRef", "")
        transaction_no = params.get("vnp_TransactionNo", "")
        amount_str = params.get("vnp_Amount", "0")
        bank_code = params.get("vnp_BankCode", "")
        pay_date = params.get("vnp_PayDate", "")

        params_copy = dict(params)
        is_valid = _vnpay_verify_return(params_copy)

        if not is_valid:
            logger.warning(f"VNPAY return: invalid checksum for txn {txn_ref}")
            return jsonify({"code": "97", "message": "Invalid checksum"}), 400

        if response_code == "00":
            new_status = "completed"
        elif response_code == "24":
            new_status = "cancelled"
        else:
            new_status = "failed"

        if txn_ref:
            Payments.update_status(mongo, txn_ref, new_status, transaction_no)
            if new_status == "completed":
                payment = Payments.find_by_payment_id(mongo, txn_ref)
                if payment:
                    mongo.db.itineraries.update_one(
                        {"itinerary_id": payment.get("tour_id")},
                        {"$set": {"status": "payed", "updated_at": datetime.now()}},
                    )

        logger.info(f"VNPAY return: txn={txn_ref}, code={response_code}, status={new_status}")

        return jsonify({
            "code": response_code,
            "message": "Payment successful" if response_code == "00" else "Payment failed",
            "payment_id": txn_ref,
            "transaction_no": transaction_no,
            "amount_vnd": int(amount_str) // 100 if amount_str else 0,
            "bank_code": bank_code,
            "pay_date": pay_date,
            "status": new_status,
        }), 200

    except Exception as e:
        logger.error(f"Error handling VNPAY return: {e}")
        return jsonify({"error": str(e)}), 500


# ========== Admin routes ==========


@payments_bp.route("/admin/all", methods=["GET"])
@jwt_required()
@Users.roles_required("admin")
def get_all_payments():
    """Get all payments (admin only)"""
    try:
        limit = int(request.args.get("limit", 100))
        skip = int(request.args.get("skip", 0))
        status = request.args.get("status")

        payments = Payments.get_all_payments(
            mongo, limit=limit, skip=skip, status=status
        )

        return jsonify({
            "count": len(payments),
            "payments": payments,
        }), 200

    except Exception as e:
        logger.error(f"Error getting all payments: {e}")
        return jsonify({"error": str(e)}), 500


# ========== REGISTRATION PAYMENT ROUTES ==========


@payments_bp.route("/vnpay/create-payment-url-register", methods=["POST"])
def vnpay_create_payment_url_register():
    """
    Create a VNPAY payment URL for user registration.
    No JWT required - this is for new users registering.

    Request body:
    {
        "email": "user@example.com",
        "password": "password123",
        "fullname": "John Doe",
        "phone": "+84123456789",
        "plan_id": "yearly",
        "order_info": "Thanh toan dang ky tai khoan premium"
    }
    Returns:
    {
        "payment_url": "https://sandbox.vnpayment.vn/...",
        "registration_id": "reg_xxx",
        "payment_id": "pay_xxx"
    }
    """
    try:
        data = request.get_json() or {}

        email = data.get("email")
        password = data.get("password")
        fullname = data.get("fullname")
        phone = data.get("phone")
        plan_id = data.get("plan_id")

        if not all([email, password, fullname, phone, plan_id]):
            return jsonify({"error": "Missing required fields"}), 400

        if plan_id not in Config.REGISTRATION_PLANS:
            return jsonify({"error": "Invalid plan_id"}), 400

        existing_user = Users.find_user_by_email(mongo, email)
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400

        plan = Config.REGISTRATION_PLANS[plan_id]
        amount_usd = plan["price_usd"]
        amount_vnd = int(amount_usd * Config.USD_TO_VND_RATE)

        password_hash = generate_password_hash(password)

        payment_data = {
            "user_id": "pending",
            "tour_id": "registration",
            "payment_type": "registration",
            "amount": amount_usd,
            "currency": "USD",
            "payment_method": "vnpay",
            "payment_status": "pending",
            "payment_gateway": "vnpay",
            "payment_details": {
                "amount_vnd": amount_vnd,
                "plan_id": plan_id,
                "plan_name": plan["name"],
                "email": email,
            },
        }
        payment = Payments.create(payment_data, mongo)
        payment.pop("_id", None)
        payment_id = payment["payment_id"]

        registration_data = {
            "email": email,
            "password_hash": password_hash,
            "fullname": fullname,
            "phone": phone,
            "plan_id": plan_id,
            "amount_usd": amount_usd,
            "payment_id": payment_id,
        }
        pending_reg = PendingRegistrations.create(registration_data, mongo)
        registration_id = pending_reg["registration_id"]

        order_info_raw = data.get("order_info", f"Thanh toan dang ky tai khoan premium - {plan['name']}")
        import unicodedata
        order_info = unicodedata.normalize("NFD", order_info_raw)
        order_info = "".join(c for c in order_info if unicodedata.category(c) != "Mn")
        order_info = order_info[:255]

        now_vn = datetime.now(VN_TZ)
        create_date = now_vn.strftime("%Y%m%d%H%M%S")
        expire_date = (now_vn + timedelta(minutes=15)).strftime("%Y%m%d%H%M%S")

        ip_addr = (
            request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
        )
        ip_addr = ip_addr.split(",")[0].strip()

        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": Config.VNPAY_TMN_CODE,
            "vnp_Amount": str(amount_vnd * 100),
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": payment_id,
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": data.get("language", "vn"),
            "vnp_ReturnUrl": Config.VNPAY_RETURN_URL_REGISTER,
            "vnp_IpAddr": ip_addr,
            "vnp_CreateDate": create_date,
            "vnp_ExpireDate": expire_date,
        }

        payment_url = _vnpay_build_payment_url(vnp_params)

        logger.info(f"VNPAY registration payment URL created: payment_id={payment_id}, email={email}, plan={plan_id}")

        return jsonify({
            "payment_url": payment_url,
            "registration_id": registration_id,
            "payment_id": payment_id,
            "amount_vnd": amount_vnd,
        }), 200

    except Exception as e:
        logger.error(f"Error creating VNPAY registration payment URL: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/vnpay/return-register", methods=["GET"])
def vnpay_return_register():
    """
    Handle VNPAY return callback for registration payments.
    This endpoint is called by VNPAY after user completes payment.
    Creates the user account if payment is successful.
    """
    try:
        params = dict(request.args)
        response_code = params.get("vnp_ResponseCode", "")
        txn_ref = params.get("vnp_TxnRef", "")
        transaction_no = params.get("vnp_TransactionNo", "")
        amount_str = params.get("vnp_Amount", "0")
        bank_code = params.get("vnp_BankCode", "")
        pay_date = params.get("vnp_PayDate", "")

        params_copy = dict(params)
        is_valid = _vnpay_verify_return(params_copy)

        if not is_valid:
            logger.warning(f"VNPAY registration return: invalid checksum for txn {txn_ref}")
            return redirect(f"{Config.VNPAY_RETURN_URL.replace('/vnpay-return', '')}/register/payment/success?status=error&message=invalid_signature")

        payment_id = txn_ref
        pending_reg = PendingRegistrations.find_by_payment_id(mongo, payment_id)

        if not pending_reg:
            logger.warning(f"VNPAY registration return: pending registration not found for payment {payment_id}")
            return redirect(f"{Config.VNPAY_RETURN_URL.replace('/vnpay-return', '')}/register/payment/success?status=error&message=registration_not_found")

        if response_code == "00":
            new_status = "completed"
            
            expiry_date = Users.calculate_expiry_date(pending_reg["plan_id"])
            
            # Insert user directly to avoid double-hashing
            # (password_hash is already hashed in create-payment-url-register)
            import uuid
            user_doc = {
                "id": str(uuid.uuid4()),
                "email": pending_reg["email"],
                "password": pending_reg["password_hash"],  # Already hashed
                "fullname": pending_reg.get("fullname", ""),
                "phone": pending_reg.get("phone", ""),
                "address": "",
                "role": "user",
                "status": "active",
                "premium_plan": pending_reg["plan_id"],
                "premium_status": "active",
                "premium_expiry_date": expiry_date,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
            
            mongo.db.users.insert_one(user_doc)
            logger.info(f"User account created: email={pending_reg['email']}, plan={pending_reg['plan_id']}")
            
            Payments.update_status(mongo, payment_id, new_status, transaction_no)
            
            PendingRegistrations.delete_by_payment_id(mongo, payment_id)
            
            frontend_base = Config.VNPAY_RETURN_URL.replace('/vnpay-return', '')
            return redirect(f"{frontend_base}/register/payment/success?status=success&payment_id={payment_id}&plan={pending_reg['plan_id']}")
        
        elif response_code == "24":
            new_status = "cancelled"
            Payments.update_status(mongo, payment_id, new_status, transaction_no)
            PendingRegistrations.delete_by_payment_id(mongo, payment_id)
            
            frontend_base = Config.VNPAY_RETURN_URL.replace('/vnpay-return', '')
            return redirect(f"{frontend_base}/register/payment/success?status=cancelled&message=payment_cancelled")
        
        else:
            new_status = "failed"
            Payments.update_status(mongo, payment_id, new_status, transaction_no)
            
            frontend_base = Config.VNPAY_RETURN_URL.replace('/vnpay-return', '')
            return redirect(f"{frontend_base}/register/payment/success?status=failed&message=payment_failed&code={response_code}")

    except Exception as e:
        logger.error(f"Error handling VNPAY registration return: {e}")
        frontend_base = Config.VNPAY_RETURN_URL.replace('/vnpay-return', '')
        return redirect(f"{frontend_base}/register/payment/success?status=error&message=server_error")
