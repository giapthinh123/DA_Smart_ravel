"""
Admin API Routes
Handles admin-specific operations like dashboard statistics
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
import calendar
from dateutil.relativedelta import relativedelta
import logging
from ..extensions import mongo
from ..models.users import Users
from ..models.itineraries import Itineraries
from ..models.payments import Payments

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/stats", methods=["GET"])
# @jwt_required()
# @Users.roles_required("admin")
def get_admin_stats():
    """
    Get admin dashboard statistics for a specific month
    Query params:
        - month: int (1-12), defaults to current month
        - year: int, defaults to current year
    
    Returns:
        - month: int
        - year: int
        - tours_created: int (tours created in the month)
        - new_users: int (users registered in the month)
        - revenue: float (total revenue from completed payments)
        - paid_tours_count: int (number of completed payments)
    """
    try:
        now = datetime.now()
        month = int(request.args.get("month", now.month))
        year = int(request.args.get("year", now.year))
        
        if month < 1 or month > 12:
            return jsonify({"error": "Month must be between 1 and 12"}), 400
        
        # Format month with leading zero for regex matching
        month_str = f"{year:04d}-{month:02d}"
        
        # Calculate date range for the month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        # Count tours created in the month
        # db.itineraries stores created_at as Python datetime object (BSON datetime)
        tours_created = Itineraries.count_by_date_range(mongo, start_date, end_date)
        
        # Count new users registered in the month
        # db.users stores created_at as string "YYYY-MM-DD HH:MM:SS" (with space, not T)
        # Need to match format like "2026-03-03 20:39:22"
        new_users = Users.count_by_created_at_regex(mongo, f"^{month_str}")
        
        # Calculate revenue and paid tours count from completed payments
        # db.payments stores created_at as Python datetime object (BSON datetime)
        
        # Aggregate payments to get revenue and count
        pipeline = [
            {
                "$match": {
                    "payment_status": "completed",
                    "created_at": {
                        "$gte": start_date,
                        "$lt": end_date
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        result = Payments.aggregate_by_date_range(mongo, pipeline)
        
        if result:
            revenue = round(result[0]["total_revenue"], 2)
            paid_tours_count = result[0]["count"]
        else:
            revenue = 0.0
            paid_tours_count = 0
        print(tours_created, new_users, revenue, paid_tours_count)
        return jsonify({
            "month": month,
            "year": year,
            "tours_created": tours_created,
            "new_users": new_users,
            "revenue": revenue,
            "paid_tours_count": paid_tours_count
        }), 200
        
    except ValueError as e:
        logger.error(f"Invalid month/year parameter: {e}")
        return jsonify({"error": "Invalid month or year parameter"}), 400
    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/growth-chart", methods=["GET"])
@jwt_required()
@Users.roles_required("admin")
def get_growth_chart():
    """
    Get growth chart data for bookings and users over multiple months
    Query params:
        - months: int (default 6) - number of months to retrieve
    
    Returns:
        - data: array of monthly statistics
          [
            {
              "month": "2025-10",
              "month_name": "Oct 2025",
              "bookings": 45,
              "users": 23
            },
            ...
          ]
    """
    try:
        months_count = int(request.args.get("months", 6))
        
        if months_count < 1 or months_count > 24:
            return jsonify({"error": "Months must be between 1 and 24"}), 400
        
        now = datetime.now()
        chart_data = []
        
        # Get data for each month going backwards
        for i in range(months_count - 1, -1, -1):
            # Calculate the target month
            target_date = now - relativedelta(months=i)
            year = target_date.year
            month = target_date.month
            
            # Calculate date range for the month
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
            
            month_str = f"{year:04d}-{month:02d}"
            
            # Count bookings (completed payments)
            tours = Itineraries.count_by_date_range(mongo, start_date, end_date)
            
            # Count new users
            users = Users.count_by_created_at_regex(mongo, f"^{month_str}")
            
            # Format month name
            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            month_name = f"{month_names[month - 1]} {year}"
            
            chart_data.append({
                "month": month_str,
                "month_name": month_name,
                "bookings": tours,
                "users": users
            })
        
        return jsonify({"data": chart_data}), 200
        
    except ValueError as e:
        logger.error(f"Invalid months parameter: {e}")
        return jsonify({"error": "Invalid months parameter"}), 400
    except Exception as e:
        logger.error(f"Error getting growth chart data: {e}")
        return jsonify({"error": str(e)}), 500


# ========== Helper functions for report ==========

def _get_date_range(report_type, year, month=None, quarter=None):
    """Return (start_date, end_date) for the given report period."""
    if report_type == "month":
        m = month or datetime.now().month
        start = datetime(year, m, 1)
        end = start + relativedelta(months=1)
        return start, end
    elif report_type == "quarter":
        q = quarter or 1
        start_month = (q - 1) * 3 + 1
        start = datetime(year, start_month, 1)
        end = start + relativedelta(months=3)
        return start, end
    else:  # year
        start = datetime(year, 1, 1)
        end = datetime(year + 1, 1, 1)
        return start, end


def _get_period_label(report_type, year, month=None, quarter=None):
    """Return a human-readable label for the period."""
    if report_type == "month":
        m = month or datetime.now().month
        return f"{m:02d}/{year}"
    elif report_type == "quarter":
        q = quarter or 1
        return f"Q{q}/{year}"
    else:
        return str(year)


def _aggregate_for_range(start_date, end_date):
    """Aggregate stats for a single date range."""
    month_str_start = start_date.strftime("%Y-%m-%d")
    month_str_end = end_date.strftime("%Y-%m-%d")

    # Revenue & payment counts
    pay_pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date, "$lt": end_date}
            }
        },
        {
            "$group": {
                "_id": "$payment_status",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }
        }
    ]
    pay_results = Payments.aggregate_by_date_range(mongo, pay_pipeline)

    revenue = 0.0
    completed = 0
    pending = 0
    failed = 0
    total_payments = 0
    for r in pay_results:
        total_payments += r["count"]
        if r["_id"] == "completed":
            revenue = round(r["total"], 2)
            completed = r["count"]
        elif r["_id"] == "pending":
            pending = r["count"]
        elif r["_id"] in ("failed", "cancelled"):
            failed += r["count"]

    # Users – created_at is a string "YYYY-MM-DD HH:MM:SS"
    # Build regex patterns for each day in the range
    users = 0
    current = start_date
    while current < end_date:
        day_str = current.strftime("%Y-%m-%d")
        users += Users.count_by_created_at_regex(mongo, f"^{day_str}")
        current += timedelta(days=1)

    # Tours (itineraries) – created_at is datetime
    tours = Itineraries.count_by_date_range(mongo, start_date, end_date)

    return {
        "total_revenue": revenue,
        "total_payments": total_payments,
        "completed_payments": completed,
        "pending_payments": pending,
        "failed_payments": failed,
        "new_users": users,
        "tours_created": tours
    }


def _users_in_month(year, month):
    """Count users registered in a specific month using regex."""
    month_str = f"{year:04d}-{month:02d}"
    return Users.count_by_created_at_regex(mongo, f"^{month_str}")


@admin_bp.route("/report", methods=["GET"])
@jwt_required()
@Users.roles_required("admin")
def get_admin_report():
    """
    Comprehensive report endpoint.
    Query params:
        - type: month | quarter | year (default: month)
        - month: int (1-12), used when type=month
        - quarter: int (1-4), used when type=quarter
        - year: int
    """
    try:
        now = datetime.now()
        report_type = request.args.get("type", "month")
        year = int(request.args.get("year", now.year))
        month = int(request.args.get("month", now.month))
        quarter = int(request.args.get("quarter", (now.month - 1) // 3 + 1))

        if report_type not in ("month", "quarter", "year"):
            return jsonify({"error": "Type must be month, quarter, or year"}), 400

        start_date, end_date = _get_date_range(report_type, year, month, quarter)

        # --- Summary ---
        summary = _aggregate_for_range(start_date, end_date)

        # --- Chart data (granular time slices) ---
        chart_data = []

        if report_type == "month":
            # Per-day data points
            days_in_month = calendar.monthrange(start_date.year, start_date.month)[1]
            for day in range(1, days_in_month + 1):
                day_start = datetime(start_date.year, start_date.month, day)
                day_end = day_start + timedelta(days=1)

                # Revenue for this day
                pay_pipe = [
                    {"$match": {
                        "payment_status": "completed",
                        "created_at": {"$gte": day_start, "$lt": day_end}
                    }},
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
                ]
                pay_res = Payments.aggregate_by_date_range(mongo, pay_pipe)
                day_revenue = round(pay_res[0]["total"], 2) if pay_res else 0.0
                day_payments = pay_res[0]["count"] if pay_res else 0

                day_str = day_start.strftime("%Y-%m-%d")
                day_users = Users.count_by_created_at_regex(mongo, f"^{day_str}")
                day_tours = Itineraries.count_by_date_range(mongo, day_start, day_end)

                chart_data.append({
                    "label": f"{day:02d}/{start_date.month:02d}",
                    "revenue": day_revenue,
                    "payments": day_payments,
                    "users": day_users,
                    "tours": day_tours,
                })

        else:
            # Per-month data points (for quarter or year)
            current = start_date
            while current < end_date:
                m_start = current
                m_end = m_start + relativedelta(months=1)

                pay_pipe = [
                    {"$match": {
                        "payment_status": "completed",
                        "created_at": {"$gte": m_start, "$lt": m_end}
                    }},
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
                ]
                pay_res = Payments.aggregate_by_date_range(mongo, pay_pipe)
                m_revenue = round(pay_res[0]["total"], 2) if pay_res else 0.0
                m_payments = pay_res[0]["count"] if pay_res else 0

                m_users = _users_in_month(m_start.year, m_start.month)

                m_tours = Itineraries.count_by_date_range(mongo, m_start, m_end)

                month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                chart_data.append({
                    "label": f"{month_names[m_start.month - 1]} {m_start.year}",
                    "revenue": m_revenue,
                    "payments": m_payments,
                    "users": m_users,
                    "tours": m_tours,
                })
                current = m_end

        # --- Period metadata ---
        period_info = {
            "type": report_type,
            "label": _get_period_label(report_type, year, month, quarter),
            "year": year,
        }
        if report_type == "month":
            period_info["month"] = month
        elif report_type == "quarter":
            period_info["quarter"] = quarter

        return jsonify({
            "period": period_info,
            "summary": summary,
            "chart_data": chart_data,
        }), 200

    except ValueError as e:
        logger.error(f"Invalid report parameter: {e}")
        return jsonify({"error": "Invalid parameter value"}), 400
    except Exception as e:
        logger.error(f"Error getting report data: {e}")
        return jsonify({"error": str(e)}), 500
