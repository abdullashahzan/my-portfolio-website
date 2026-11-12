# Resolution pass

Changes: fixed reading-line word highlight; ratio-driven certificate wall with focus/hover enlargement and display WebPs; queued title masks; numbered plate captions and registration marks; initials resolution meter; date-based employment/education timeline; email letter ripple and static contact twinkles; achievement stage light and rolling numerals; certificate spotlight; authored-title project previews; velocity skew; pointer light; hero stimulation; optional portrait resolution.

The idle contact dots deliberately remain static to follow the brief's idle-screen rule. Project previews use existing authored titles rather than inventing image assets. No performance effects have been claimed as budget-certified: the requested 60-second Performance-panel recording, 4x CPU throttling, Lighthouse mobile score, and full artistic browser matrix remain unverified. The About/wall foundations were tested separately across the requested dimensions and certificate mixes, including all 29 keyboard targets. 46 Django tests and the production build pass.

Migrations: 0042 adds the generated 1600px certificate display preview and editable wall cue. 0043 adds Plate/Resolution labels, optional portrait, and start_date/end_date/show_on_timeline on Experience, WorkExperience and Education. Existing date display text is retained. No exact dates were inferred from ambiguous year-only strings; fill those fields in admin to enable their bars. Blank end_date means present.

Local SQLite was backed up before copy-only migration checks. Source record counts and integrity were preserved. Production deployments use the existing backup-and-copy validation script.

Imgur returned HTTP 429 during remote backfill verification. Records without stored dimensions remain in the native wall, rather than receiving guessed ratios. Upload originals or run the remote backfill on PythonAnywhere. Configure /media/ to the portfolio/media directory before using generated files.

```sh
cd /home/MyPortfolioShahzan/my-portfolio-website
git pull --ff-only origin main
source /home/MyPortfolioShahzan/venv/bin/activate
python -m pip install -r requirements.txt
cd portfolio
python ../scripts/verify_migrations.py
python manage.py migrate --noinput
python manage.py collectstatic --clear --noinput
python manage.py backfill_certificates --fetch-remote
touch /var/www/myportfolioshahzan_pythonanywhere_com_wsgi.py
```

If backfill fails, retain the original records and provide the command's failed IDs/error output. No database or uploaded media is committed to Git.
