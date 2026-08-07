FROM python:3.12-slim

WORKDIR /app

# Copy backend requirements & code
COPY backend/pyproject.toml backend/README.md ./
RUN pip install --no-cache-dir fastapi uvicorn pydantic mcp structlog

COPY backend/src /app/src
COPY mcp/server.py /app/server.py
COPY data /app/data

ENV PYTHONPATH=/app

CMD ["python", "server.py"]
