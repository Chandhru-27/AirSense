"""python file to hold database schema"""

CREATE_TABLE_USERS = """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        age INTEGER,
        gender gender_enum,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
"""

CREATE_TABLE_TOKEN_BLOCKLIST = """
    CREATE TABLE IF NOT EXISTS token_blocklist (
    jti TEXT PRIMARY KEY,
    token_type TEXT,
    user_id INTEGER,
    revoked_at TIMESTAMP DEFAULT now()
    );
"""

SCHEMA_LIST = [
    CREATE_TABLE_USERS, 
    CREATE_TABLE_TOKEN_BLOCKLIST,
]