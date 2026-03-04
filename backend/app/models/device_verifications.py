"""
Device Verifications Model
Temporary storage for device verification codes sent via email
"""

import uuid
import random
import string
from datetime import datetime, timedelta


class DeviceVerifications:
    @staticmethod
    def generate_code():
        """Generate 6-digit code (numbers only)"""
        return ''.join(random.choice(string.digits) for _ in range(6))
    
    @staticmethod
    def create(email, device_id, mongo):
        """Create verification code for device"""
        import logging
        logger = logging.getLogger(__name__)
        
        code = DeviceVerifications.generate_code()
        
        logger.info(f"Creating verification code for email: {email}")
        logger.info(f"Generated code: {code}")
        logger.info(f"Device ID: {device_id}")
        
        verification = {
            "verification_id": str(uuid.uuid4()),
            "email": email,
            "device_id": device_id,
            "code": code,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=15),
            "verified": False
        }
        
        # Delete old verifications for this email
        mongo.db.device_verifications.delete_many({"email": email})
        
        result = mongo.db.device_verifications.insert_one(verification)
        logger.info(f"Verification code saved to database with ID: {verification['verification_id']}")
        
        return code
    
    @staticmethod
    def verify_code(email, code, mongo):
        """Verify code and return device_id if valid"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Normalize code - strip whitespace and ensure string
        code_normalized = str(code).strip()
        
        logger.info(f"========== VERIFY CODE DEBUG ==========")
        logger.info(f"Email: {email}")
        logger.info(f"Input code (raw): '{code}'")
        logger.info(f"Input code (normalized): '{code_normalized}'")
        logger.info(f"Input code length: {len(code_normalized)}")
        
        # Find verification record
        verification = mongo.db.device_verifications.find_one({
            "email": email,
            "verified": False,
            "expires_at": {"$gt": datetime.now()}
        })
        
        if not verification:
            logger.warning(f"❌ No active verification found for email: {email}")
            # Check if there's any verification (even expired)
            any_verification = mongo.db.device_verifications.find_one({"email": email})
            if any_verification:
                logger.info(f"Found expired/verified record: verified={any_verification.get('verified')}, expires_at={any_verification.get('expires_at')}")
            return None
        
        stored_code = str(verification['code']).strip()
        logger.info(f"Stored code in DB: '{stored_code}'")
        logger.info(f"Stored code length: {len(stored_code)}")
        logger.info(f"Expires at: {verification['expires_at']}")
        logger.info(f"Current time: {datetime.now()}")
        logger.info(f"Is expired: {verification['expires_at'] < datetime.now()}")
        
        # Compare codes
        if stored_code != code_normalized:
            logger.warning(f"❌ Code mismatch!")
            logger.warning(f"   Expected: '{stored_code}' (type: {type(stored_code)})")
            logger.warning(f"   Got:      '{code_normalized}' (type: {type(code_normalized)})")
            logger.warning(f"   Byte comparison: {stored_code.encode()} vs {code_normalized.encode()}")
            return None
        
        # Mark as verified
        mongo.db.device_verifications.update_one(
            {"verification_id": verification["verification_id"]},
            {"$set": {"verified": True}}
        )
        
        logger.info(f"✅ Code verified successfully for email: {email}")
        logger.info(f"========================================")
        return verification["device_id"]
    
    @staticmethod
    def cleanup_expired(mongo):
        """Delete expired verifications"""
        result = mongo.db.device_verifications.delete_many({
            "expires_at": {"$lt": datetime.now()}
        })
        return result.deleted_count
