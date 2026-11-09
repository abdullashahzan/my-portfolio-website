# Living field guide redesign

## 1. Design rationale

A paper field guide with a small game interface. Professional content remains server-rendered and readable without JavaScript; optional discoveries reward exploring it. Existing path ordering and curation remain authoritative. No frontend framework, animation library, Node build, or replacement hosting service is introduced.

Tokens: ivory #f5f2e9, ink #2b2731, lavender #b8a5ed, coral #ef8c62, sage #c4d6a2; accent #6c489f. Night paper #211c29, panel #302737, text #f5f2e9, muted #c5bdcf, accent #d5baff. Existing DM Sans and Space Grotesk remain, with the existing serif. Hero type uses clamp(3.3rem,7.4vw,7.5rem), with a mobile override. Spacing token clamp(20px,4vw,64px), radius 18px, offset shadow 5px 6px, fast motion 160ms, slow motion 600ms, easing cubic-bezier(.22,1,.36,1).

Components: session start dialog, explorer HUD, native modal sticker book, searchable command menu, quest dossier, map marker, progress trail, mascot dialogue, optional audio, neuron spark game, chibi export/share controls, currently note, and stable certificate anchors.

The loading bar indicates ready content, not invented network progress. Audio is synthesized through Web Audio, enabled only by a visitor click. The existing SVG chibi is reused for the introduction and map. The visitor studio remains separate. Badges use an inline SVG star, with earned state conveyed by text as well as shape.

## 2. File-by-file implementation

- `portfolio/main/static/main/world.css`: theme tokens, editorial treatment, HUD/dialogs, responsive and motion rules.
- `portfolio/main/static/main/world.js`: discoveries, command search, audio, quests, navigation enhancements, mini-game, chibi exports and local preferences.
- `portfolio/main/templates/main/partials/world.html`: native accessible dialog and HUD markup.
- `portfolio/main/templates/main/layout.html`: loads the enhancement assets and restores theme before paint.
- `portfolio/main/templates/main/home.html`: optional currently note and sound-default copy.
- `portfolio/main/templates/main/sections/projects.html`: optional quest metadata from the database.
- `portfolio/main/templates/main/sections/achievements.html`: stable database certificate IDs.
- `portfolio/main/templates/main/partials/adventure.html`: clarifies visitor character ownership.
- `portfolio/main/templates/main/partials/resume_form.html`: professional profile builder copy. PDF document styling is unchanged.
- `portfolio/main/static/main/script.js`: persists manual motion preference.
- `portfolio/main/static/main/exhibit.js`: constellation combo/best counter.
- `portfolio/main/models.py`: adds optional presentation `currently` and project `difficulty`/`quest_status` fields.
- `portfolio/main/migrations/0036_portfoliopresentation_currently.py`: additive schema migration. Existing admin registrations expose these fields automatically; no context processor is needed because existing presentation/project querysets already deliver them.
- `portfolio/main/tests.py`: tests dynamic new content, escaping and stable certificate IDs.

The files in the checkout are the complete implementation, rather than snippets to paste over the existing project. Existing URLs, fields, records, route selectors, PDF generation and admin controls are retained.

## 3. PythonAnywhere deployment checklist

1. Back up the database and media; review the changes before uploading.
2. Upload the changed application source, templates and migration. Do not upload temporary QA files or replace the production database.
3. Activate the site's Python environment and install the existing `requirements.txt` if needed.
4. From the directory containing `manage.py`, run:

   ```sh
   python manage.py check
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

5. Verify `/static/` maps to the configured `STATIC_ROOT` in PythonAnywhere's Web tab. Preserve the existing `/media/` mapping.
6. Reload the existing WSGI application. No Node command is required.
7. Open all three routes, the admin presentation/project forms, the résumé builder and PDF download. Check that `world.css` and `world.js` return HTTP 200.
8. Fill in Currently and quest metadata only with accurate content. Blank values intentionally remain absent.

This session did not deploy to PythonAnywhere or alter the production database. The preview uses a temporary copy of the local database.

## 4. QA and remaining acceptance work

Completed: Django system checks, migration consistency, existing regression suite, JavaScript syntax checks, and desktop browser verification of the start screen, theme/XP update, command filtering and quest dialog. Additional backend checks cover escaped admin copy and stable certificate IDs.

Before release:

- [ ] Test widths 360, 390, 768, 1024, 1440, and 200% text zoom; check HUD/header overlap and studio controls.
- [ ] Complete keyboard-only and screen-reader passes, including every modal, game, search and reset action.
- [ ] Test system reduced motion and persisted manual pause, including preference changes while open.
- [ ] Measure contrast across every day/night component, including legacy panels with fixed background colors.
- [ ] Test chibi PNG exports for every accessory and pose; verify shared styles against restored saved profiles.
- [ ] Test certificate deep links, keyboard arrows and touch swipes with actual media.
- [ ] Run mobile Lighthouse for performance/accessibility/best practices/SEO, each target 90+. Scores are not yet measured.
- [ ] Optimize existing externally hosted certificate/media assets to WebP/AVIF where appropriate, and self-host/preload selected fonts. Existing image URLs were preserved.

Scope still short of the full art-direction brief: distinct happy/thinking/surprised/sleepy mascot drawings, a fully illustrated walking map trail, a true branching skill tree, additional wardrobe artwork beyond existing outfits/accessories, a hand-lettered accent font, and the richer manga transitions/parallax are not complete. Current poses are gentle rotations of the existing character; the map marker moves directly between stops. Page transitions are browser-native progressive enhancements and do not yet cover the standalone résumé documents. The first visual layer preserves much of the existing composition rather than replacing every section.

These limitations and unverified checks mean this is an implementation pass for review, not a claim that every requirement in the original brief is finished.
