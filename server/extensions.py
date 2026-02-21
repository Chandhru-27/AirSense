from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from cryptography.fernet import Fernet
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

load_dotenv()

# global bcrypt instance 
bcrypt = Bcrypt()

# Global fernet instance — fall back to a generated key when missing (development)
_fernet_key = os.getenv('FERNET_KEY')
if _fernet_key is None:
    # generate a key for development if not provided
    _generated_key = Fernet.generate_key()
    fernet = Fernet(_generated_key)
else:
    fernet = Fernet(_fernet_key)

# Global rate limiter config
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["15 per minute"],
)