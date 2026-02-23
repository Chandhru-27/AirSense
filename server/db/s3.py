"""Supabase S3 file upload utility for pollution report images."""

import os
import uuid
from pathlib import PurePosixPath

import boto3
from botocore.exceptions import ClientError

# ── Supabase S3-compatible storage configuration ──────────────────────────────
# Add these to your .env file:
#   SUPABASE_S3_ENDPOINT  e.g. https://<project-ref>.supabase.co/storage/v1/s3
#   SUPABASE_S3_REGION    e.g. ap-southeast-1
#   SUPABASE_ACCESS_KEY   Supabase service role key (or S3 access key)
#   SUPABASE_SECRET_KEY   Supabase S3 secret key
#   SUPABASE_BUCKET       e.g. pollution-reports

ENDPOINT  = os.getenv("SUPABASE_S3_ENDPOINT")
REGION    = os.getenv("SUPABASE_S3_REGION", "ap-southeast-1")
ACCESS_KEY= os.getenv("SUPABASE_ACCESS_KEY")
SECRET_KEY= os.getenv("SUPABASE_SECRET_KEY")
BUCKET    = os.getenv("SUPABASE_BUCKET", "pollution-reports")

MAX_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB — matches Supabase bucket policy
ALLOWED_MIME_PREFIX = "image/"


def _get_s3_client():
    """Return a boto3 S3 client pointing at the Supabase S3 endpoint."""
    if not all([ENDPOINT, ACCESS_KEY, SECRET_KEY]):
        raise RuntimeError(
            "Supabase S3 credentials missing. "
            "Set SUPABASE_S3_ENDPOINT, SUPABASE_ACCESS_KEY, SUPABASE_SECRET_KEY in .env"
        )
    return boto3.client(
        "s3",
        endpoint_url=ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name=REGION,
    )


def upload_report_image(file_stream, filename: str, mime_type: str, size_bytes: int) -> dict:
    """
    Validate and upload an image file to the Supabase S3 bucket.

    Parameters
    ----------
    file_stream : file-like object (from flask request.files)
    filename    : original filename from the client
    mime_type   : MIME type declared by the client (e.g. 'image/jpeg')
    size_bytes  : byte length of the file

    Returns
    -------
    dict with keys:
        image_key  — S3 object key
        image_url  — public URL
        image_size — file size in bytes
        mime_type  — validated MIME type
    """
    # ── Validation ────────────────────────────────────────────────────────────
    if not mime_type.startswith(ALLOWED_MIME_PREFIX):
        raise ValueError(f"Only image/* files are allowed. Got: {mime_type}")

    if size_bytes > MAX_SIZE_BYTES:
        raise ValueError(f"File exceeds 5 MB limit ({size_bytes} bytes).")

    # ── Build a collision-free object key ─────────────────────────────────────
    ext = PurePosixPath(filename).suffix.lower() or ".jpg"
    object_key = f"reports/{uuid.uuid4().hex}{ext}"

    # ── Upload ────────────────────────────────────────────────────────────────
    client = _get_s3_client()
    try:
        client.upload_fileobj(
            file_stream,
            BUCKET,
            object_key,
            ExtraArgs={
                "ContentType": mime_type,
                "ACL": "public-read",
            },
        )
    except ClientError as exc:
        raise RuntimeError(f"S3 upload failed: {exc}") from exc

    # Supabase public URL pattern
    public_url = f"{ENDPOINT.rstrip('/')}/object/public/{BUCKET}/{object_key}"

    return {
        "image_key":  object_key,
        "image_url":  public_url,
        "image_size": size_bytes,
        "mime_type":  mime_type,
    }


def delete_report_image(object_key: str) -> None:
    """Remove an object from the Supabase S3 bucket (used on report deletion)."""
    client = _get_s3_client()
    try:
        client.delete_object(Bucket=BUCKET, Key=object_key)
    except ClientError as exc:
        raise RuntimeError(f"S3 delete failed: {exc}") from exc
