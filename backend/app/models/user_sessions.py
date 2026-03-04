from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class UserSessions:
    """
    Manages active user sessions in the `user_sessions` collection.
    Each user has at most ONE active session (single-device policy).
    
    Document schema:
    {
        "user_id": str,
        "access_jti": str,
        "refresh_jti": str,
        "device_id": str,
        "device_name": str,
        "access_expires_at": datetime,
        "refresh_expires_at": datetime,
        "created_at": datetime,
        "last_used_at": datetime
    }
    """

    @staticmethod
    def ensure_indexes(mongo):
        """Create indexes on startup. Safe to call multiple times."""
        mongo.db.user_sessions.create_index("user_id", unique=True)
        mongo.db.user_sessions.create_index("access_jti")
        mongo.db.user_sessions.create_index("refresh_jti")
        mongo.db.token_blacklist.create_index(
            "created_at", expireAfterSeconds=30 * 24 * 3600
        )

    @staticmethod
    def create_session(
        mongo, user_id, access_jti, refresh_jti,
        device_id, device_name, access_expires_at, refresh_expires_at
    ):
        """Insert a new session. Caller must revoke old sessions first."""
        now = datetime.utcnow()
        return mongo.db.user_sessions.insert_one({
            "user_id": user_id,
            "access_jti": access_jti,
            "refresh_jti": refresh_jti,
            "device_id": device_id,
            "device_name": device_name,
            "access_expires_at": access_expires_at,
            "refresh_expires_at": refresh_expires_at,
            "created_at": now,
            "last_used_at": now,
        })

    @staticmethod
    def revoke_all_sessions(mongo, user_id):
        """
        Blacklist every JTI tied to the user and delete their sessions.
        Returns the number of sessions removed.
        """
        sessions = list(mongo.db.user_sessions.find({"user_id": user_id}))
        if not sessions:
            return 0

        now = datetime.utcnow()
        blacklist_docs = []
        for s in sessions:
            blacklist_docs.append({"jti": s["access_jti"], "created_at": now})
            blacklist_docs.append({"jti": s["refresh_jti"], "created_at": now})

        mongo.db.token_blacklist.insert_many(blacklist_docs)
        result = mongo.db.user_sessions.delete_many({"user_id": user_id})
        logger.info(
            "Revoked %d session(s) for user %s (%d JTIs blacklisted)",
            result.deleted_count, user_id, len(blacklist_docs),
        )
        return result.deleted_count

    @staticmethod
    def find_session_by_access_jti(mongo, jti):
        return mongo.db.user_sessions.find_one({"access_jti": jti})

    @staticmethod
    def find_session_by_refresh_jti(mongo, jti):
        return mongo.db.user_sessions.find_one({"refresh_jti": jti})

    @staticmethod
    def find_session_by_user(mongo, user_id):
        return mongo.db.user_sessions.find_one({"user_id": user_id})

    @staticmethod
    def update_access_token(mongo, refresh_jti, new_access_jti, new_access_expires_at):
        """Rotate the access token within an existing session."""
        return mongo.db.user_sessions.update_one(
            {"refresh_jti": refresh_jti},
            {"$set": {
                "access_jti": new_access_jti,
                "access_expires_at": new_access_expires_at,
                "last_used_at": datetime.utcnow(),
            }},
        )

    @staticmethod
    def update_last_used(mongo, jti):
        """Bump last_used_at for the session owning this access JTI."""
        return mongo.db.user_sessions.update_one(
            {"access_jti": jti},
            {"$set": {"last_used_at": datetime.utcnow()}},
        )

    @staticmethod
    def delete_session(mongo, user_id):
        """Remove the session document (caller should blacklist JTIs separately)."""
        return mongo.db.user_sessions.delete_many({"user_id": user_id})
