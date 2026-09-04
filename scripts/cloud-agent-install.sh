#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing Node dependencies"
npm ci --prefer-offline --no-audit --no-fund

echo "==> Installing Python dependencies"
pip install --user -r requirements.txt --quiet

echo "==> Install complete"
