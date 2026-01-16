FROM python:3.11

WORKDIR /app

# Install uv
RUN pip install uv

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 appuser
USER appuser
WORKDIR /home/appuser/app

# Copy project files
COPY pyproject.toml .

# Install dependencies with uv
RUN uv sync

# Copy application code
COPY app.py .

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PATH="/home/appuser/app/.venv/bin:$PATH"

# Run the application
CMD ["python", "app.py"]