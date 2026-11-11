# Portfolio frontend

Django server-renders the initial persona from `?as=`, the one-year SameSite=Lax cookie, then SiteSettings.default_persona. Both views come from the database. Edit Site settings, Persona contents, Section headings, Research, Projects, Featured achievements, Certificates, Work experience and Education in Django admin. No content file or localStorage overrides database records.

Existing certificate records reuse the Achievement table. The legacy Display field controls the CV only; Is published controls this homepage. Featured achievements reuse Experience records, excluding records already linked to WorkExperience. Authored order is retained within persona relevance groups.

Build with Node 20.19+:

```sh
cd phosphene
npm ci
npm run build
cd ..
python scripts/build_phosphene.py
```

Commit the generated static assets and editorial_assets.html with source changes. The build does not replace Django's content templates. PythonAnywhere does not need Node.

Certificate uploads generate dimensions and 640px WebP thumbnails using Pillow. PDF uploads use PyMuPDF to render page one and retain the original PDF. Existing external URLs are imported only with the explicit `backfill_certificates --fetch-remote` command. Failed imports preserve the original URL. Configure production /media/ mapping; Django must not serve uploaded files in production.

See ../docs/portfolio-refactor.md for the data audit, verification and deployment instructions.
