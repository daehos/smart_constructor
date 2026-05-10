# syntax=docker/dockerfile:1
#
# Use the official Paddle CPU image: installing paddlepaddle+paddleocr on python:slim
# often hits missing libgomp and/or OpenCV native crashes (multiple cv2 .so).
# See: https://www.paddlepaddle.org.cn/documentation/docs/en/install/docker/linux-docker_en.html
#
# Tag aligns with paddlepaddle==2.6.2 in requirements.txt (local installs).
FROM paddlepaddle/paddle:2.6.2

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.docker.txt .
# Do not uninstall/reinstall OpenCV on this base image: that can leave a broken `cv2`
# (e.g. AttributeError: module 'cv2' has no attribute 'INTER_LINEAR').
RUN pip install --no-cache-dir -r requirements.docker.txt

COPY app/ ./app/

EXPOSE 8100

# Reduce thread oversubscription on small VPS CPUs
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

# Models download on first POST /ocr (lazy init). GET /health stays fast for Docker.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100", "--workers", "1"]
