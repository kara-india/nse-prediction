# Scripts

## Directory Structure

- `ingest_daily.py` — Daily data ingestion pipeline (TODO)
- `backfill_history.py` — Backfill historical OHLCV data (TODO)
- `train_model.py` — Model training script (TODO)
- `evaluate_model.py` — Walk-forward evaluation (TODO)
- `resolve_predictions.py` — Compare predictions vs actuals (TODO)
- `export_features.py` — Export feature dataset for analysis (TODO)

## Running (Python required)

```bash
# Install Python dependencies
pip install -r ml/requirements.txt

# Run daily pipeline
python scripts/ingest_daily.py --date 2024-01-15

# Backfill
python scripts/backfill_history.py --symbol RELIANCE --exchange NSE --from 2015-01-01
```
