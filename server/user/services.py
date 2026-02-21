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
