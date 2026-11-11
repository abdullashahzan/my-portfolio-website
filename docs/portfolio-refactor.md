# Portfolio database refactor (2026-11-11)

## Root causes and fixes

1. Navigation: space-between centered links between unequal side items. A three-column 1fr auto 1fr grid now centers the link group on the container.
2. About: a block-wide reveal range, smoothing and stale line measurements delayed illumination. Lines now measure after fonts, rebuild on resize/persona changes and reveal independently from top 88% to top 58%, with scrub true and no easing. Debug markers were removed after inspection. Word spacing is preserved when rebuilding lines.
3. Research actions: adjacent inline status/link content had no dependable gap. Flex rows now provide wrapping, responsive column gaps, 12px row gaps and 44px link targets; related metadata uses gap-based layout.
4. Missing content: content.js and its exported editorial_content.json overrode SQLite with 29 fabricated certificate entries and achievement placeholders; the previous certificate query also applied the CV-only display flag. These content files and generators are removed. Existing rows now drive the homepage, publication controls and counts. Empty sections and their navigation links are omitted.
5. Admin changes did not control the whole page because browser copy and persona persistence lived in JS/localStorage. SiteSettings, PersonaContent, FocusPhrase, SocialLink and SectionHeading now supply the page; initial HTML is server rendered using URL, cookie, then database default. Cookie lifetime is one year with SameSite=Lax. Both persona views are passed through json_script.
6. Certificates: fixed plates and fixed column-based animation groups ignored original dimensions. Stored image dimensions, justified flex rows and offsetTop row grouping preserve natural proportions. Uploads generate WebP thumbnails; PDFs retain their original and gain a page-one preview.

## Data audit and preservation

Local source tables: main_me (1), main_research (4), main_topproject (4), main_achievement (28 certificates), main_achievementcategory (8), main_experience (7 milestones), main_workexperience (2), main_education (1). Six milestone rows appear as achievements; one is already linked to employment. Eight certificate rows had display=True, twenty had display=False. That flag remains unchanged for the CV.

No bracket-prefixed placeholder rows were found in the database; none were deleted. Placeholder files were removed. Existing descriptions are copied into persona records when tailored descriptions are empty. Existing titles, URLs and all source rows are retained. The supplied email is retained. Authored em dashes are replaced by commas in migration 0041, including the research summary after 62.31% accuracy.

The primary local SQLite database was not migrated or overwritten. SQLite backup API created timestamped backups under portfolio/backups before migrating copies. Latest verification: db-20261111T153131917233Z.sqlite3 and migration-check-20261111T153131917233Z.sqlite3. All seven content-table row counts matched after migration and SQLite integrity_check returned ok. Production may have different rows; verify its database path and counts separately. Deployment now backs up and tests migrations on a server-side copy before migrating the active database.

## Files and migrations

- Models/admin: portfolio/main/models.py, admin.py.
- Database rendering: portfolio/main/phosphene.py, templates/main/phosphene.html, editorial_body.html, editorial_switch.html, editorial_label.html, editorial_assets.html and templatetags/editorial.py.
- Media: certificate_media.py, management/commands/backfill_certificates.py, requirements.txt and portfolio/portfolio/settings.py.
- Frontend: phosphene/src.js, style.css, index.html, package.json, README.md and generated portfolio/main/static/main/phosphene assets.
- Build/deploy: scripts/build_phosphene.py, verify_migrations.py, deploy.sh and .gitignore.
- Tests: portfolio/main/tests.py and tests_editorial.py.
- Removed: phosphene/content.js, certificate-media.json, placeholder certificate README files, portfolio/main/editorial_content.json, scripts/export_editorial.mjs and prepare_certificates.py.
- 0040_sectionheading_certificate_featuredachievement_and_more: schema, publication fields, media dimensions and proxy admin models reusing existing tables.
- 0041_restore_editorial_database: preserves/copies existing content into editable settings/personas, seeds headings and labels, normalizes authored punctuation.

## Verification

46 Django tests pass, including server-rendered persona precedence, cookie attributes, immediate admin changes, publication visibility independent of CV eligibility, relevance ordering, escaped heading formatting, accent validation, portrait thumbnail dimensions and PDF original retention. Django check, production check --deploy --fail-level WARNING, makemigrations --check and the Vite build pass.

Browser verification used DEBUG=False and a migrated copy. Navigation center difference was 0px at 1280, 1366, 1440 and 1920px with hidden/visible switches in earlier checks, and again with the final assets for the engineer view. Both personas and switching render real content without placeholder strings. A mid-scroll switch preserved position. About fixtures of 40, 70 and 120 words were inspected with markers; after the final line-splitting correction, 70/120-word lines reaching 58% were fully lit. Final marker count is zero. Certificate fixtures covered 29 mixed (about 60/40), all landscape, five portrait and one landscape; measured within-row heights matched, with negligible ratio rounding error and no overflow.

Limits: a full 29-item all-portrait visual run and true OS reduced-motion emulation were not completed. Reduced-motion branches remain implemented. Touch swipe and production certificate originals were not reverified. External Imgur thumbnail backfill returned HTTP 429 for all 28 local certificate URLs; originals were preserved. Until successfully imported or uploaded, externally hosted images retain natural proportions but do not have stored thumbnail dimensions for justified sizing.

## Admin and PythonAnywhere

No existing content needs re-entry. Edit the two Persona contents to supply genuinely distinct descriptions; both initially preserve the existing biography where tailored fields were blank. Fill optional certificate issuer/date/credential metadata and milestone year/event/region only when known. Upload original certificate images/PDFs if the remote service continues blocking imports.

In PythonAnywhere Web tab, configure /media/ to /home/MyPortfolioShahzan/my-portfolio-website/portfolio/media/ and /static/ to /home/MyPortfolioShahzan/my-portfolio-website/portfolio/staticfiles/. Do not use Django to serve production media.

Run in a PythonAnywhere Bash console:

```sh
cd /home/MyPortfolioShahzan/my-portfolio-website
git pull --ff-only origin main
source /home/MyPortfolioShahzan/venv/bin/activate
python -m pip install -r requirements.txt
cd portfolio
python manage.py check --deploy --fail-level WARNING
python ../scripts/verify_migrations.py
python manage.py migrate --noinput
python manage.py collectstatic --clear --noinput
python manage.py backfill_certificates --fetch-remote
touch /var/www/myportfolioshahzan_pythonanywhere_com_wsgi.py
```

If remote backfill reports 429, retain the URLs, upload originals via Certificates admin, and reload; do not replace or delete the records. The automatic deploy runs local-media backfill only to avoid making deployment depend on Imgur availability.

Verify the active server database:

```sh
python manage.py shell -c "from django.conf import settings; from main.models import Certificate; print(settings.DATABASES['default']['NAME']); print(Certificate.objects.count())"
```
