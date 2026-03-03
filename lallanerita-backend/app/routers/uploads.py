import os
import uuid
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from PIL import Image
from app.utils.auth import get_admin_user

router = APIRouter(prefix="/uploads", tags=["Archivos"])

UPLOAD_DIR = "/data/uploads" if os.path.exists("/data") else "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_DIMENSION = 800


def compress_image(content: bytes, ext: str) -> tuple[bytes, str]:
    """Compress and resize image to max 800px, convert to WebP for best compression."""
    try:
        img = Image.open(io.BytesIO(content))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

        w, h = img.size
        if w > MAX_DIMENSION or h > MAX_DIMENSION:
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

        output = io.BytesIO()
        img.save(output, format="WEBP", quality=80, method=4)
        return output.getvalue(), "webp"
    except Exception:
        return content, ext


@router.post("")
async def upload_file(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No se proporciono archivo")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Extension no permitida. Permitidas: {', '.join(ALLOWED_EXTENSIONS)}")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo muy grande. Maximo 5MB")

    compressed, final_ext = compress_image(content, ext)

    filename = f"{uuid.uuid4().hex}.{final_ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(compressed)
    return {"url": f"/uploads/files/{filename}", "filename": filename}


@router.get("/files/{filename}")
async def get_file(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(
        filepath,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
