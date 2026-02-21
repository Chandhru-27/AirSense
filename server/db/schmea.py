"""python file to hold database schema"""

CREATE_TYPE_GENDER_ENUM = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
    END IF;
END$$;
"""


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
CREATE_TABLE_AIR_QUALITY_DATA = """
    CREATE TABLE IF NOT EXISTS air_quality_data (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    node_id int,
    timestamp timestamptz,
    lat float,
    lon float,
    pm25 float,
    no2 float,
    o3 float,
    wind_speed float,
    wind_direction float,
    temperature float,
    humidity float,
    traffic_density int,
    traffic_current_speed float,
    traffic_free_flow_speed float,
    traffic_confidence float,
    risk_score int,
    risk_level text
    );
"""

SCHEMA_LIST = [
    CREATE_TYPE_GENDER_ENUM,
    CREATE_TABLE_USERS, 
    CREATE_TABLE_TOKEN_BLOCKLIST,
    CREATE_TABLE_AIR_QUALITY_DATA
]