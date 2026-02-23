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

CREATE_TABLE_USER_MESSAGES = """
    CREATE TABLE IF NOT EXISTS user_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255),
        email VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
"""

CREATE_TABLE_POLLUTION_REPORTS = """
    CREATE TABLE IF NOT EXISTS pollution_reports (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        lat         FLOAT NOT NULL,
        lon         FLOAT NOT NULL,
        image_url   TEXT,
        image_key   TEXT,
        image_size  INTEGER,
        mime_type   VARCHAR(100),
        status      VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
"""

CREATE_TABLE_USER_HEALTH_PROFILES = """
    CREATE TABLE IF NOT EXISTS user_health_profiles (
        id                    SERIAL PRIMARY KEY,
        user_id               INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        -- Respiratory conditions
        has_asthma            BOOLEAN DEFAULT FALSE,
        has_copd              BOOLEAN DEFAULT FALSE,
        has_allergies         BOOLEAN DEFAULT FALSE,
        -- Cardiovascular
        has_heart_condition   BOOLEAN DEFAULT FALSE,
        -- Special conditions
        is_pregnant           BOOLEAN DEFAULT FALSE,
        takes_inhaler         BOOLEAN DEFAULT FALSE,
        -- Lifestyle
        smoking_status        VARCHAR(20) DEFAULT 'Never',
        fitness_level         VARCHAR(20) DEFAULT 'Moderate',
        outdoor_exposure      VARCHAR(20) DEFAULT 'Medium',
        -- Breathing difficulty frequency
        breathing_difficulty  VARCHAR(20) DEFAULT 'Never',
        -- Free-text notes
        custom_notes          TEXT,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
"""

SCHEMA_LIST = [
    CREATE_TYPE_GENDER_ENUM,
    CREATE_TABLE_USERS,
    CREATE_TABLE_TOKEN_BLOCKLIST,
    CREATE_TABLE_AIR_QUALITY_DATA,
    CREATE_TABLE_USER_MESSAGES,
    CREATE_TABLE_POLLUTION_REPORTS,
    CREATE_TABLE_USER_HEALTH_PROFILES,
]