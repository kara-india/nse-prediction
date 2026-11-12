# ML service

This directory contains the private Python service and the research/model code.

## Vercel service

`main.py` exposes a minimal `/health` route so the `ml` service can be deployed
and reached through the `app` service binding. The Next.js route
`/api/ml/health` is a small integration check; it does not expose market data or
model predictions.

Vercel installs the small runtime dependency set from `requirements.txt`. The
broader local research stack is in `requirements-ml.txt` and is not required by
the HTTP service. Install it separately when working on model research:

```powershell
python -m pip install -r requirements-ml.txt
```

Run the whole service project locally from the repository root with
`vercel dev -L`. The binding URL is provided by Vercel; do not put
`ML_SERVICE_URL` in an env file.
