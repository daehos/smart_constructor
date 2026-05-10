"""
Image preprocessing helpers for receipt OCR.

Pipeline: decode -> downscale -> grayscale -> denoise -> sharpen -> threshold -> deskew
"""
import math

import cv2
import numpy as np


MAX_DIMENSION = 2000


def preprocess(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Cannot decode image bytes")

    img = _downscale(img)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    sharpened = _sharpen(denoised)
    deskewed = _deskew(sharpened)
    _, thresh = cv2.threshold(deskewed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh


def _downscale(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    max_dim = max(h, w)
    if max_dim <= MAX_DIMENSION:
        return img
    scale = MAX_DIMENSION / max_dim
    new_w = int(w * scale)
    new_h = int(h * scale)
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def _sharpen(gray: np.ndarray) -> np.ndarray:
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    return cv2.filter2D(gray, -1, kernel)


def _deskew(gray: np.ndarray) -> np.ndarray:
    coords = np.column_stack(np.where(gray < 128))
    if len(coords) < 10:
        return gray
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = 90 + angle
    if abs(angle) < 0.5:
        return gray
    h, w = gray.shape
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
