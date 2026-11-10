# Phosphene portfolio

Django still serves the homepage, profile, CV and legacy `/explore/` archive. Existing database records are retained. The browser layer uses the original tokens, Instrument Serif / Geist typography, GSAP, ScrollTrigger, Flip and Lenis.

## Editing content

`content.js` is the source for defaultPersona, both persona profiles, switchHint, featured editorial achievements and certificate plates. Django's nonempty persona description/tagline fields override the corresponding defaults. Other existing research, projects and employment records continue to come from Django. No projects are hidden by persona.

A list item can use `desc: {researcher: '...', engineer: '...'}` or a shared string. Projects, achievements and certificates support `for: 'researcher' | 'engineer' | 'both'`, then sort by date within relevance. Research and employment preserve their original order. The same section order is used in both personas.

The certificate sheet currently contains 29 explicitly bracketed entries as requested. Existing database certificates remain intact in the legacy archive and CV. Replace one entry in `content.certificates` to supply its real title, issuer, date, credentialId, image and verification URL. Add originals under `public/certificates/`. Do not invent metadata. A missing image produces a typographic plate; it does not load a broken URL.

## Build and Django integration

Requires Node 20.19+, Python with Pillow, and `pdftoppm` (Poppler) if PDFs are added.

```sh
cd phosphene
npm ci
npm run build
cd ..
python3 scripts/build_phosphene.py
python3 portfolio/manage.py test main
python3 portfolio/manage.py migrate
```

The prebuild prepares thumbnails (maximum 640px, WebP below 60KB), renders page one for PDFs, and exports the shared editorial content for Django's fallback. Originals load only in the lightbox; neighboring images preload after opening. The Django packaging step copies originals and thumbnails into the app's static directory. Commit generated assets, the generated Django template, and `main/editorial_content.json` with source changes. The deployed server does not need Node.

The pending email field and seed migrations from the previous change are retained. The local profile has the supplied email. Publication of the email-bearing migration was explicitly approved by the owner.

## Behavior and verification

Persona precedence: valid `?as=` parameter, saved browser choice, researcher default. Changes use replaceState without navigation. Radio controls support arrow keys and native Space/Enter. Reduced motion removes pinning, scrub, canvas and marquee animation. Native dialog contains keyboard focus, supports prev/next, arrow keys, Escape and touch swipes, stops Lenis while open and restores originating focus on close.

Verified in the local browser at 360, 768, 1280 and 1920px for both personas without horizontal overflow. Verified query selection, saved selection, ten switches, desktop pinning, 12/29 certificates, 2/8 achievements, a simulated reduced-motion JS path, lightbox arrows, Escape and focus return. No browser console errors were observed after corrections. Full per-section mid-scroll testing, real OS reduced-motion emulation, touch swipe, external original/PDF loading and Lighthouse 90+ remain unverified. No supplied certificate originals were available to test their visual quality.
