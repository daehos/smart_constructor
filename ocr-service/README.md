# ocr — Receipt OCR Service

FastAPI service that accepts an image URL, downloads the image, and returns
structured OCR results using PaddleOCR.

## Stack

- Python 3.11
- FastAPI + Uvicorn
- PaddleOCR (lazy-loaded on first request)
- OpenCV for pre-processing

## Environment variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `FETCH_TIMEOUT_SECONDS` | `15` | HTTP timeout when fetching images |

## Local development

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Docker

```bash
# Build
docker build -t smart-constructor-ocr .

# Run
docker run -p 8001:8001 smart-constructor-ocr
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/ocr` | Run OCR on `{ "image_url": "..." }` |

The `/health` endpoint responds immediately (before models are downloaded).
The first `/ocr` request triggers model download (~1–3 min on cold start).
