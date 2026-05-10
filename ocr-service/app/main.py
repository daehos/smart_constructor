"""
OCR service — FastAPI + PaddleOCR.

Single Uvicorn worker + asyncio.Lock enforce concurrency-1 so only one image is
processed at a time on a constrained VPS. Callers must handle 503 when a job is
already running (or simply wait; the lock serialises them).

PaddleOCR is loaded lazily on the first POST /ocr so GET /health responds immediately
(Docker healthchecks would otherwise fail while models download for several minutes).
"""
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

import cv2
import httpx
import numpy as np
from fastapi import FastAPI, HTTPException
from paddleocr import PaddleOCR
from pydantic import BaseModel

from .parser import parse_receipt
from .preprocess import preprocess

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_ocr_engine: PaddleOCR | None = None
_ocr_lock = asyncio.Lock()
_ocr_init_lock = asyncio.Lock()


async def _ensure_ocr_engine() -> None:
    """Load Paddle once; heavy work runs in a thread pool so the event loop stays responsive."""
    global _ocr_engine
    if _ocr_engine is not None:
        return
    async with _ocr_init_lock:
        if _ocr_engine is not None:
            return
        logger.info("Loading PaddleOCR (first /ocr request; may download models)…")
        loop = asyncio.get_running_loop()
        _ocr_engine = await loop.run_in_executor(
            None,
            lambda: PaddleOCR(use_angle_cls=True, lang="en", show_log=False),
        )
        logger.info("PaddleOCR ready")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """No heavy startup: /health must stay fast for Docker."""
    yield
    global _ocr_engine
    _ocr_engine = None


app = FastAPI(title="OCR Service", lifespan=lifespan)


class OcrRequest(BaseModel):
    image_url: str


class OcrResponse(BaseModel):
    rawText: str
    lines: list[dict[str, Any]]
    parsed: dict[str, Any]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/ocr", response_model=OcrResponse)
async def run_ocr(req: OcrRequest):
    if _ocr_lock.locked():
        raise HTTPException(status_code=503, detail="OCR busy; retry shortly")

    async with _ocr_lock:
        await _ensure_ocr_engine()
        image_bytes = await _fetch_image(req.image_url)
        preprocessed = await asyncio.get_running_loop().run_in_executor(
            None, preprocess, image_bytes
        )
        lines = await asyncio.get_running_loop().run_in_executor(
            None, _run_paddle, preprocessed
        )

    raw_text = "\n".join(line["text"] for line in lines)
    parsed = parse_receipt(lines)

    return OcrResponse(rawText=raw_text, lines=lines, parsed=parsed)


async def _fetch_image(url: str) -> bytes:
    timeout = float(os.getenv("FETCH_TIMEOUT_SECONDS", "15"))
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.content
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {exc}")


def _run_paddle(preprocessed: np.ndarray) -> list[dict[str, Any]]:
    result = _ocr_engine.ocr(preprocessed, cls=True)
    lines: list[dict[str, Any]] = []
    if not result or not result[0]:
        return lines
    for item in result[0]:
        bbox, (text, confidence) = item
        lines.append({
            "text": text,
            "confidence": round(float(confidence), 4),
            "bbox": bbox,
        })
    return lines
