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
