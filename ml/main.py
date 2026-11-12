"""Minimal HTTP surface for the private ML service."""

from fastapi import FastAPI

app = FastAPI(title="NSE Prediction ML Service", version="0.1.0")


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    """Report process readiness without exposing configuration or credentials."""
    return {"service": "ml", "status": "ok"}
