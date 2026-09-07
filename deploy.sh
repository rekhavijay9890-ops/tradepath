#!/usr/bin/env bash
# Deploy latest app to GitHub. Run in Codespace:
#   bash deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "=== Quant App Deploy v5 ==="

python3 install_app.py

echo ""
echo "Verifying files..."
grep -q "_kpi_card" app.py || { echo "ERROR: app.py missing KPI cards"; exit 1; }
grep -q "total_trades" backtest_engine.py || { echo "ERROR: backtest_engine missing new metrics"; exit 1; }
grep -q "k1.metric" app.py && { echo "ERROR: app.py still has old st.metric KPIs"; exit 1; }
grep -q "cagr_pct" app.py || { echo "ERROR: app.py missing CAGR KPI"; exit 1; }

echo "All checks passed."
echo ""

git add -A
git status

if git diff --cached --quiet; then
  echo "Nothing to commit — files may already match."
else
  git commit -m "Deploy v5: HTML KPI cards + advanced backtest metrics"
fi

echo ""
echo "Pushing to GitHub..."
git pull origin main --no-rebase || true
git push origin main

echo ""
echo "Done! Reboot your app at share.streamlit.io"
