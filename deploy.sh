#!/usr/bin/env bash
# Deploy latest app to GitHub. Run in Codespace (no Cursor remote needed):
#   bash deploy.sh
#   git push origin main
set -euo pipefail
cd "$(dirname "$0")"

echo "=== Quant App Deploy v6 ==="

python3 install_app.py

echo ""
echo "Verifying files..."
grep -q "_kpi_card" app.py || { echo "ERROR: app.py missing KPI cards"; exit 1; }
grep -q "bt_results" app.py || { echo "ERROR: app.py missing bt_results session fix"; exit 1; }
grep -q 'APP_VERSION = "v6.1"' app.py || { echo "ERROR: app.py missing version tag"; exit 1; }
grep -q "Out-of-Sample KPIs" app.py || { echo "ERROR: app.py missing OOS KPI section"; exit 1; }
grep -q "build_benchmark_comparison" backtest_engine.py || { echo "ERROR: backtest_engine missing benchmark"; exit 1; }
grep -q "classify_market_regime" backtest_engine.py || { echo "ERROR: backtest_engine missing regime"; exit 1; }
grep -q 'start: str | None = None' data_engine.py || { echo "ERROR: data_engine missing date range"; exit 1; }
grep -q "k1.metric" app.py && { echo "ERROR: app.py still has old st.metric KPIs"; exit 1; }
test -f streamlit_app/app.py || { echo "ERROR: streamlit_app/app.py missing"; exit 1; }

echo "All checks passed."
echo ""

git add -A
git status

if git diff --cached --quiet; then
  echo "Nothing new to commit — files already up to date."
else
  git commit -m "Deploy v6: date range, train/test split, regime, OOS KPIs, benchmark"
fi

echo ""
echo "Next: git push origin main"
echo "Then reboot your app at share.streamlit.io"
