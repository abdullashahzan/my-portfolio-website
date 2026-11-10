# Phosphene Django homepage

The production homepage is served by Django using `main/phosphene.py` and `main/phosphene.html`. Research, projects, profile, work and education come from existing admin-managed records. No migrations or Node runtime are required on the deployed server. The previous interactive portfolio remains at `/explore/`; CV routes remain unchanged.

To rebuild the committed browser assets after editing `src.js` or `style.css`:

```sh
cd phosphene
npm ci
npm run build
cd ..
python3 scripts/build_phosphene.py
python3 portfolio/manage.py test main
```

Commit the generated template and `portfolio/main/static/main/phosphene/` assets along with source changes. Existing deployment collects static assets normally. `content.js` retains the original design reference; production copy comes from Django. Project year and email are placeholders because the existing models have no fields for them. Creation timestamps are not represented as project dates.

The template includes server-rendered content for search engines and visitors without JavaScript. Reduced motion disables continuous animation. Browser visual checks and Lighthouse scores have not been verified.

## Alter egos and archive

Use `?ego=research` or `?ego=engineering` to select a shareable alter ego; Research is the default. Edit each description and tagline on the profile in Django admin. Blank fields use factual introductory copy. Projects follow their existing Research / Job roles / Both audience setting. Certificates remain available in both modes.

The certificate archive includes records marked for display and supports search and category filtering. Existing non-work Experience records populate the achievements section. Mark an Achievement as `featured` and optionally add a summary to include it there too. No achievements or certificates are invented or seeded.

Deployments must run `python portfolio/manage.py migrate` before serving this version. The existing `scripts/deploy.sh` runs migrations. Project hover previews have been removed.
