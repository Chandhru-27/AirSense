from db.db_setup import get_db_connection

def get_user_by_id(user_id):
    """Return a user dict for the given user_id or None if not found."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                "SELECT id, username, email, full_name, phone, age, gender, address, created_at, updated_at FROM users WHERE id=%s;",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return None
            keys = [
                "id",
                "username",
                "email",
                "full_name",
                "phone",
                "age",
                "gender",
                "address",
                "created_at",
                "updated_at",
            ]
            return dict(zip(keys, row))
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

def update_user(user_id, updates: dict):
    """Update allowed user fields and return the updated user dict or None.

    Allowed fields: full_name, phone, age, gender, address
    """
    allowed = ["full_name", "phone", "age", "gender", "address"]
    set_parts = []
    values = []
    for key in allowed:
        if key in updates:
            set_parts.append(f"{key} = %s")
            values.append(updates[key])

    if not set_parts:
        return get_user_by_id(user_id)

    set_clause = ", ".join(set_parts) + ", updated_at = CURRENT_TIMESTAMP"
    values.append(user_id)

    query = (
        f"UPDATE users SET {set_clause} WHERE id=%s RETURNING id, username, email, full_name, phone, age, gender, address, created_at, updated_at;"
    )

    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            conn.commit()
            if not row:
                return None
            keys = [
                "id",
                "username",
                "email",
                "full_name",
                "phone",
                "age",
                "gender",
                "address",
                "created_at",
                "updated_at",
            ]
            return dict(zip(keys, row))
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

def create_user_message(user_id, full_name, email, message):
    """Insert a new user message into the database map to the users table."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO user_messages (user_id, full_name, email, message) VALUES (%s, %s, %s, %s) RETURNING id;",
                (user_id, full_name, email, message)
            )
            msg_id = cur.fetchone()[0]
            conn.commit()
            return msg_id
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()


# ─── Pollution Report CRUD ────────────────────────────────────────────────────

REPORT_KEYS = [
    "id", "user_id", "description", "lat", "lon",
    "image_url", "image_key", "image_size", "mime_type",
    "status", "created_at",
]


def create_pollution_report(
    user_id: int,
    description: str,
    lat: float,
    lon: float,
    image_url: str | None = None,
    image_key: str | None = None,
    image_size: int | None = None,
    mime_type: str | None = None,
) -> dict:
    """Insert a new pollution report row and return the full record."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                INSERT INTO pollution_reports
                    (user_id, description, lat, lon,
                     image_url, image_key, image_size, mime_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, user_id, description, lat, lon,
                          image_url, image_key, image_size, mime_type,
                          status, created_at;
                """,
                (user_id, description, lat, lon,
                 image_url, image_key, image_size, mime_type),
            )
            row = cur.fetchone()
            conn.commit()
            return dict(zip(REPORT_KEYS, row))
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()


def get_reports_by_user(user_id: int, limit: int = 20, offset: int = 0) -> list[dict]:
    """Return a paginated list of pollution reports for a user, newest first."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                SELECT id, user_id, description, lat, lon,
                       image_url, image_key, image_size, mime_type,
                       status, created_at
                FROM pollution_reports
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s;
                """,
                (user_id, limit, offset),
            )
            rows = cur.fetchall()
            return [dict(zip(REPORT_KEYS, r)) for r in rows]
        finally:
            cur.close()


def get_all_reports(limit: int = 50, offset: int = 0) -> list[dict]:
    """Return all pollution reports (admin use), newest first."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                SELECT id, user_id, description, lat, lon,
                       image_url, image_key, image_size, mime_type,
                       status, created_at
                FROM pollution_reports
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s;
                """,
                (limit, offset),
            )
            rows = cur.fetchall()
            return [dict(zip(REPORT_KEYS, r)) for r in rows]
        finally:
            cur.close()


def delete_pollution_report(report_id: int, user_id: int) -> str | None:
    """
    Hard-delete a report owned by user_id.
    Returns the image_key so the caller can clean up S3, or None if not found.
    """
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                "DELETE FROM pollution_reports WHERE id=%s AND user_id=%s RETURNING image_key;",
                (report_id, user_id),
            )
            row = cur.fetchone()
            conn.commit()
            return row[0] if row else None
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()


# ─── Health Profile CRUD ──────────────────────────────────────────────────────

HEALTH_PROFILE_KEYS = [
    "id", "user_id",
    "has_asthma", "has_copd", "has_allergies",
    "has_heart_condition",
    "is_pregnant", "takes_inhaler",
    "smoking_status", "fitness_level", "outdoor_exposure",
    "breathing_difficulty", "custom_notes",
    "created_at", "updated_at",
]


def get_health_profile(user_id: int):
    """Return the health profile for a user or None if not yet created."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                SELECT id, user_id,
                       has_asthma, has_copd, has_allergies,
                       has_heart_condition,
                       is_pregnant, takes_inhaler,
                       smoking_status, fitness_level, outdoor_exposure,
                       breathing_difficulty, custom_notes,
                       created_at, updated_at
                FROM user_health_profiles
                WHERE user_id = %s;
                """,
                (user_id,),
            )
            row = cur.fetchone()
            return dict(zip(HEALTH_PROFILE_KEYS, row)) if row else None
        finally:
            cur.close()


def upsert_health_profile(user_id: int, data: dict) -> dict:
    """Insert or update the health profile for a user. Returns the saved profile."""
    allowed = [
        "has_asthma", "has_copd", "has_allergies",
        "has_heart_condition",
        "is_pregnant", "takes_inhaler",
        "smoking_status", "fitness_level", "outdoor_exposure",
        "breathing_difficulty", "custom_notes",
    ]
    fields = {k: data[k] for k in allowed if k in data}

    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            col_names = ", ".join(fields.keys())
            placeholders = ", ".join(["%s"] * len(fields))
            update_clause = ", ".join(f"{k} = EXCLUDED.{k}" for k in fields)
            values = [user_id] + list(fields.values())

            cur.execute(
                f"""
                INSERT INTO user_health_profiles (user_id, {col_names})
                VALUES (%s, {placeholders})
                ON CONFLICT (user_id) DO UPDATE
                SET {update_clause}, updated_at = CURRENT_TIMESTAMP
                RETURNING id, user_id,
                          has_asthma, has_copd, has_allergies,
                          has_heart_condition,
                          is_pregnant, takes_inhaler,
                          smoking_status, fitness_level, outdoor_exposure,
                          breathing_difficulty, custom_notes,
                          created_at, updated_at;
                """,
                values,
            )
            row = cur.fetchone()
            conn.commit()
            return dict(zip(HEALTH_PROFILE_KEYS, row))
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
