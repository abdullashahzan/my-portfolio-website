"""Back up the selected SQLite database and migrate a separate copy first."""
import os, sys, sqlite3, subprocess
from pathlib import Path
from datetime import datetime, timezone
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'portfolio'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','portfolio.settings')
import django
django.setup()
from django.conf import settings
source=Path(settings.DATABASES['default']['NAME']).resolve()
if not source.is_file():raise SystemExit(f'Database not found: {source}')
folder=source.parent/'backups';folder.mkdir(exist_ok=True)
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
backup=folder/f'db-{stamp}.sqlite3';check=folder/f'migration-check-{stamp}.sqlite3'
with sqlite3.connect(source) as src:
    for target in [backup,check]:
        with sqlite3.connect(target) as dst:src.backup(dst)
    tables=['main_me','main_research','main_topproject','main_achievement','main_experience','main_workexperience','main_education']
    counts={t:src.execute(f'SELECT count(*) FROM {t}').fetchone()[0] for t in tables}
env={**os.environ,'PORTFOLIO_DB_PATH':str(check)}
subprocess.run([sys.executable,str(root/'portfolio/manage.py'),'migrate','--noinput'],env=env,check=True)
with sqlite3.connect(check) as conn:
    assert conn.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    for table,count in counts.items():
        if conn.execute(f'SELECT count(*) FROM {table}').fetchone()[0]!=count:raise SystemExit(f'Row count changed: {table}')
print(f'Original database: {source}\nBackup: {backup}\nValidated copy: {check}\nPreserved rows: {counts}')
