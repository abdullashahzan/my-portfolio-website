#!/usr/bin/env bash
# Run on PythonAnywhere; keep credentials and uploaded media outside Git.
set -Eeuo pipefail
trap 'echo "Deployment failed at line $LINENO; check the output above." >&2' ERR

cd /home/MyPortfolioShahzan/my-portfolio-website
# Do not silently stash server edits. Resolve tracked changes before deployment.
git pull --ff-only origin main
source /home/MyPortfolioShahzan/venv/bin/activate
python -m pip install -r requirements.txt
cd portfolio
python manage.py check --deploy --fail-level WARNING
python ../scripts/verify_migrations.py
python manage.py migrate --noinput
python manage.py backfill_certificates
# STATIC_ROOT contains generated assets only. Rebuild rather than trust mtimes.
python manage.py collectstatic --clear --noinput
python - <<'PY'
from pathlib import Path
for name in ('style.css', 'script.js', 'adventure.css', 'adventure.js', 'exhibit.css', 'exhibit.js', 'journey.js', 'journey.css', 'world.css', 'world.js', 'cv.css'):
    source = Path('main/static/main') / name
    collected = Path('staticfiles/main') / name
    if source.read_bytes() != collected.read_bytes():
        raise SystemExit(f'Static verification failed: {name}')
print('Static assets verified against source.')
PY
touch /var/www/myportfolioshahzan_pythonanywhere_com_wsgi.py
echo 'DONE!'
