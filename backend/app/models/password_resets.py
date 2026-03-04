"""
Password Resets Model
Temporary storage for password reset codes sent via email
"""

import uuid
import random
import string
from datetime import datetime, timedelta


class PasswordResets:
    @staticmethod
    def generate_code():
        """Generate 6-digit code (numbers only)"""
        return ''.join(random.choice(string.digits) for _ in range(6))

    @staticmethod
    def create(email, mongo):
        """Create password reset code for email"""
        import logging
        logger = logging.getLogger(__name__)

        code = PasswordResets.generate_code()

        logger.info(f"Creating password reset code for email: {email}")
        logger.info(f"Generated code: {code}")

        reset = {
            "reset_id": str(uuid.uuid4()),
            "email": email,
            "code": code,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=15),
            "verified": False,
        }

        # Delete old reset codes for this email
        mongo.db.password_resets.delete_many({"email": email})

        mongo.db.password_resets.insert_one(reset)
        logger.info(f"Password reset code saved to database with ID: {reset['reset_id']}")

        return code

    @staticmethod
    def verify_code(email, code, mongo):
        """Verify code and return True if valid"""
        import logging
        logger = logging.getLogger(__name__)

        code_normalized = str(code).strip()

        logger.info(f"========== VERIFY PASSWORD RESET CODE ==========")
        logger.info(f"Email: {email}")
        logger.info(f"Input code (normalized): '{code_normalized}'")

        # Find reset record
        reset = mongo.db.password_resets.find_one({
            "email": email,
            "verified": False,
            "expires_at": {"$gt": datetime.now()},
        })

        if not reset:
            logger.warning(f"No active password reset found for email: {email}")
            return False

        stored_code = str(reset["code"]).strip()
        logger.info(f"Stored code in DB: '{stored_code}'")

        if stored_code != code_normalized:
            logger.warning(f"Code mismatch!")
            return False

        # Mark as verified
        mongo.db.password_resets.update_one(
            {"reset_id": reset["reset_id"]},
            {"$set": {"verified": True}},
        )

        logger.info(f"Password reset code verified successfully for email: {email}")
        logger.info(f"================================================")
        return True

    @staticmethod
    def cleanup_expired(mongo):
        """Delete expired reset codes"""
        result = mongo.db.password_resets.delete_many({
            "expires_at": {"$lt": datetime.now()}
        })
        return result.deleted_count

    @staticmethod
    def delete_by_email(mongo, email):
        """Delete all reset codes for a given email."""
        return mongo.db.password_resets.delete_many({"email": email})

