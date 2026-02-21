import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv
from schema import SCHEMA_LIST
from contextlib import contextmanager

load_dotenv()

postgreSQL_pool = None

def initialize_connection_pool():
    """
    Create connection pool, appending SSL mode directly to DSN to avoid keyword conflicts.
    Priority 1: DATABASE_URL (Production/Render/Supabase Pooler)
    Priority 2: Individual Params (Local Development)
    """
    global postgreSQL_pool
    
    is_prod = os.getenv("FLASK_ENV") == "production"
    ssl_config = "require" if is_prod else "disable"

    pool_kwargs = {
        "minconn": 1,
        "maxconn": 20,
    }

    if os.getenv('DATABASE_URL'):
        database_url = os.getenv('DATABASE_URL')
        
        if '?' in database_url:
            final_dsn = f"{database_url}&sslmode={ssl_config}"
        else:
            final_dsn = f"{database_url}?sslmode={ssl_config}"
            
        print(f"Initializing pool using DSN (SSL: {ssl_config})...")
        pool_kwargs["dsn"] = final_dsn

    elif os.getenv('PG_HOST'):
        print(f"Initializing pool using PG_HOST variables (SSL: {ssl_config})...")
        pool_kwargs["host"] = os.getenv('PG_HOST')
        pool_kwargs["database"] = os.getenv('PG_DB')
        pool_kwargs["user"] = os.getenv('PG_USER')
        pool_kwargs["password"] = os.getenv('PG_PASSWORD')
        pool_kwargs["port"] = os.getenv('PG_PORT')
        pool_kwargs["sslmode"] = ssl_config  
    
    else:
        print("CRITICAL ERROR: No database configuration found in environment variables.")
        return

    try:
        postgreSQL_pool = pool.ThreadedConnectionPool(**pool_kwargs)
        print("Connection pool created successfully")
    except psycopg2.Error as e:
        print(f"Error initializing connection pool: {e}")

@contextmanager
def get_db_connection():
    """Context manager for database connections with safety check"""
    if postgreSQL_pool is None:
        raise RuntimeError("Database connection pool is not initialized.")

    conn = postgreSQL_pool.getconn()
    try:
        yield conn
    finally:
        postgreSQL_pool.putconn(conn=conn)

def initialize_database_and_create_tables():
    """Create all tables on startup"""
    try:
        with get_db_connection() as conn:
            cur = conn.cursor()
            try:
                for create_table in SCHEMA_LIST:
                    cur.execute(create_table)
                conn.commit()
                print("Tables check completed.")
            except psycopg2.Error as e:
                print(f"Database Schema Error: {e}")
                conn.rollback()
            finally:
                cur.close()
    except RuntimeError as e:
        print(f"Skipping table creation: {e}")