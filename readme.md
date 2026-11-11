Current homepage and deployment instructions: [Portfolio refactor](docs/portfolio-refactor.md). The feature descriptions below also cover the preserved legacy archive.

# Abdulla Shahzan — Portfolio

Personal portfolio website built with **Django 5.2** — featuring an interactive journey timeline, AI chat assistant, research publications, project showcase, certification management, and a dynamically generated CV/Resume with PDF download.

## Features

### 🏠 Homepage
- **Hero with Particle Canvas** — Full-screen animated particle network background with mouse interaction (particles repel from cursor), grid overlay, and staggered entrance animations
- **Dynamic Content** — Name, title, subtitle, GPA, and paper count all pulled live from the database
- **About Section** — Bio with `|safe` HTML rendering and stat cards (GPA, published research, year of study)
- **Video Dividers** — Full-width grayscale autoplay videos separating sections with overlay text
- **Scroll-Triggered Reveal Animations** — IntersectionObserver-based fade-up/slide-in for sections, project cards, skill boxes, and certificate cards with staggered delays

### 🎢 Journey Timeline
- **Scroll-Locked Full-Screen Carousel** — Each `Experience` model entry becomes a slide; page scroll locks when section enters viewport
- **Alternating Layout** — Image/text side flips on every slide (`divisibleby:2`)
- **Multi-Input Navigation** — Mouse wheel, arrow keys, Space/PageUp/PageDown, and touch swipe (40px threshold)
- **Entrance Animations** — Media slides in from left/right, text fades up with delay
- **Cooldown Mechanism** — Prevents re-lock after exiting the section (800ms)

### 🔬 Research Publications
- **Status Badges** — Red "Published" / gray "In Progress" indicators with distinct styling
- **Paper Cards** — Numbered labels, title, description, optional GitHub link
- **Hover Effect** — Shadow expansion on card hover

### 🧩 Projects Showcase
- **Two-Column Responsive Grid** — Project cards with icons, descriptions, and tag lists
- **Hover Animations** — Icon rotates/scales; tags get red border on hover
- **Alternate Slide-In** — Cards enter from alternating directions on scroll

### 🛠️ Skills Display
- **Auto-Fill Grid** — `minmax(115px, 1fr)` responsive layout
- **Red Drop Shadow Cards** — Shadow intensifies on hover; text turns white
- **Staggered Reveal** — Four delay tiers based on position

### 🏆 Achievements & Certifications
- **Accordion Categories** — Single-open collapsible rows with category name and certificate count
- **Certificate Image Grid** — Per-category auto-fill grid with grayscale-to-color hover
- **Lightbox Viewer** — Full-screen overlay with prev/next arrows, keyboard navigation (ArrowLeft, ArrowRight, Escape), image counter, and category-based grouping
- **Staggered Entrance** — Certificate cards animate in with column-index-based delay

### 🤖 AI Chat Assistant (Okabe Rintarou)
- **Groq-Powered** — Uses `openai/gpt-oss-120b` with temperature 0.65
- **Portfolio-Aware** — System prompt dynamically assembled from database: bio, skills, projects, published research, experience, achievements
- **Custom Persona** — Confident, witty, professional with specific response rules (2-4 sentences, redirects unknown questions to contact, provides CV download link)
- **Animated Chat Modal** — Fade/slide-up entrance, typing indicator (three animated dots), user/bot message styling
- **Error Handling** — Fallback messages on network or API failure
- **Two Entry Points** — Hero section and contact section both trigger the chat

### 📄 CV / Resume Page
- **Standalone CV Page** — Two-column layout (30% sidebar / 70% main) with all resume content
- **Loading Overlay** — Dark-themed (`#090C08`) splash with spinner, "Generating CV..." (Prata font), tech description, and 3-second minimum display
- **Dynamic Content** — Research, experience, education, projects, skills, certifications — all live from the database
- **Filtered Certifications** — Only `Achievement.display=True` entries shown
- **PDF Download** — Server-side WeasyPrint generation from `cv_pdf.html` (table-based for print reliability)
- **Fixed Download Button** — Red pill button fixed to bottom-right corner with PDF icon
- **Print Stylesheet** — A4-optimized with reduced font sizes and hidden UI chrome
- **Bootstrap Icons** — Filled red icons on all section headings and links

### 📬 Contact Section
- **Styled Buttons** — GitHub, LinkedIn, "Talk with me ✦" with red shadow hover effect

### 🧭 Navigation
- **Fixed Navbar** — Transparent initially, dark background + border appears on scroll (>60px)
- **Active Page Highlighting** — Red underline on current page
- **Mobile Hamburger** — Animated X transition, full-screen overlay drawer with staggered item entrance
- **Body Scroll Lock** — Prevented while drawer is open

### 🖱️ Custom Cursor
- **Two-Element Cursor** — Red dot (instant follow) + bordered ring (lerp-smoothed)
- **Interactive Expansion** — Ring grows on hover over links, buttons, skill/project/paper cards
- **Touch Device Detection** — Automatically hidden on touch devices

### 🎨 Design System
- **Dark Aesthetic** — `#090C08` background with coral red `#EF5D60` accent
- **Four-Typeface System** — Italiana (display), Prata (serif), STIX Two Text (body), Courier New (mono/numbers)
- **Red Drop Shadow Language** — Consistent 3px/4px/6px offset red shadows on cards, buttons, skill boxes
- **Section Header Pattern** — Mono number + animated expanding line + serif title
- **Custom Scrollbar** — Thin dark scrollbar with red hover state
- **Keyframe Animation Library** — fadeUp, scrollPulse, slideIn variants, drawer items, lightbox transitions, chat modal entrances, loader spin

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5.2, Python 3.12 |
| AI | Groq API (openai/gpt-oss-120b) |
| PDF Generation | WeasyPrint 67.0 |
| Frontend | Vanilla JavaScript, CSS3, HTML5 |
| Database | SQLite (dev) |
| Icons | Bootstrap Icons 1.13.1 |
| Fonts | Google Fonts (Italiana, Prata, STIX Two Text) |
| CI/CD | GitHub Actions → PythonAnywhere |
| Auth | Django admin (for content management) |

## Setup

```bash
# Clone the repository
git clone https://github.com/abdullashahzan/my-portfolio-website.git
cd my-portfolio-website

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env   # Add your GROQ_API_KEY

# Run migrations and start the server
python portfolio/manage.py migrate
python portfolio/manage.py runserver
```

### Environment Variables

Create a `.env` file inside `portfolio/main/`:

```env
GROQ_API_KEY=gsk_your_key_here
```

## Project Structure

```
my-portfolio-website/
├── portfolio/
│   ├── main/
│   │   ├── static/main/         # CSS, JS, images
│   │   ├── templates/main/      # Django templates
│   │   ├── models.py            # Content models (9 models)
│   │   ├── views.py             # Page views + chat API + CV generator
│   │   ├── admin.py             # Admin configuration
│   │   ├── urls.py              # App routes
│   │   └── .env                 # Environment variables
│   ├── portfolio/               # Django project settings
│   │   ├── settings.py          # Project config
│   │   ├── urls.py              # Root URL config
│   │   └── wsgi.py              # WSGI application
│   └── manage.py
├── .github/workflows/deploy.yml # CI/CD pipeline
├── deploy.sh                    # Deployment validation script
├── requirements.txt
└── readme.md
```

## Content Management

All site content is managed through Django admin (`/admin/`). The following models are available:

| Model | Fields | Admin Features |
|---|---|---|
| **Me** | Name, title, bio, GPA, LinkedIn, GitHub, website | List display |
| **TopProject** | Name, description, icon, tags (M2M) | `filter_horizontal` for tags |
| **Research** | Name, description, status (Published/In Progress), GitHub link | Filter by status |
| **Experience** | Title, description, image/video URL | — |
| **Education** | Institution, degree, field, years, GPA, order | Ordered listing |
| **Skill** | Name (unique) | Alphabetically ordered |
| **AchievementCategory** | Name (unique) | Groups certificates |
| **Achievement** | Title, category, display toggle, image, date earned | `list_editable` display toggle, filterable by category/display |
| **Tag** | Name (unique) | — |

## API

### `POST /chat-api/`

AI chat endpoint. Accepts JSON with a `message` field and returns the assistant's response.

**Request:**
```json
{ "message": "Tell me about your research" }
```

**Response:**
```json
{ "response": "Abdulla has published research on..." }
```

## Deployment

```bash
# Collect static files for production
python portfolio/manage.py collectstatic

# Set DEBUG=False and configure ALLOWED_HOSTS in settings.py
```

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to PythonAnywhere on pushes to `main`.

## License

All rights reserved — content and design belong to Abdulla Shahzan.

## Production static-file deployment

Only `portfolio/main/static/` contains source assets. The generated
`portfolio/staticfiles/` directory must not be committed: Git can give stale
collected files newer timestamps than their source, causing `collectstatic` to
skip updates.

The PythonAnywhere Web tab must map `/static/` to:
`/home/MyPortfolioShahzan/my-portfolio-website/portfolio/staticfiles`

Use `bash scripts/deploy.sh` on the server. The script stops on failures, uses a
fast-forward pull without silently stashing edits, rebuilds collected files with
`--clear`, and verifies the three application assets before reloading.
`STATIC_ROOT` must contain generated assets only, never uploads.

If `/update-website/` calls the ignored root `deploy.sh`, replace that server-only
file with this wrapper so it uses the versioned script:

```bash
#!/usr/bin/env bash
set -euo pipefail
exec bash /home/MyPortfolioShahzan/my-portfolio-website/scripts/deploy.sh
```

## Interactive field guide (Nori)

The homepage remains rendered from the existing Django models. Its map, research
filters, searchable certificate collections, and project-matching game use the
same admin-managed data. The dot puzzle is an illustrative game, not a medical
simulation. A quick-reading mode, motion toggle, keyboard dialogs and text clue
are included. No audio is played.

- **Nori:** Uses the existing `GROQ_API_KEY`; optional `GROQ_MODEL` overrides the
  default `openai/gpt-oss-120b` model. Remove any retired Llama model override
  from the production environment. GPT-OSS uses low reasoning effort and returns
  only its final answer. Edit the `nori` entry in **Chat Configurations** for personality
  notes. The previous `default` character entry is preserved. Portfolio facts are
  assembled automatically, and Nori receives the visitor's selected route,
  current section, discoveries, and at most eight recent messages.
- **Progress:** Discoveries and game completions stay in browser local storage.
  Reset controls clear those discoveries without inflating visitor totals.
- **Visitor counts:** `ExplorerSession` counts each server session once after an
  explicit path choice. These are self-selected visits, not verified recruiters,
  unique people, or historical totals. Counts begin with this feature's launch.
  Anonymous records can be inspected in admin; no names, raw IP addresses or
  chat transcripts are saved in this model.
- **AI limits:** 40 requests per session per day, bounded message/history sizes,
  a short cached burst limit, CSRF protection, and a provider timeout. Automatic
  reactions are capped at eight AI calls per page; local guide reactions and
  games remain available without a working provider. The cache burst limit is
  process-local with Django's default cache; use a shared cache for a shared
  multi-worker burst limit. Cookie resets can bypass anonymous session budgets.
- **Deployment:** Apply migrations `0026` and `0027`, collect static files, then
  reload, in that order. Existing deployment scripts already run migrations.
  Never replace the production database with a local preview copy.

### Travelling guide, work records, and saved companions

Apply migrations `0028` and `0029` before reloading the app. They add
`WorkExperience` and `NoriProfile` and seed two editable work entries: Huawei
online internship and Saudi Cast IT Network Technician. The original Saudi Cast
record is retained as a source, but excluded from the achievements/community list
to avoid duplication. No dates or Huawei internship syllabus were inferred.
Select the appropriate internship certificate(s) in the Work Experience admin;
the separate Huawei competition award remains in achievements. Work entries also
appear in the CV/PDF and Nori's factual context.

The same seven-place map now shows role-specific numbered routes, three highlighted
stops, and distinct quest checklists. Nori introduces sections from a central spotlight, then accompanies visitors
from alternating corners with pointer-following expressions. Explicit travel controls scroll to destinations;
manual scrolling is never hijacked. Animation respects reduced-motion settings,
the pause button, and quick reading mode. The constellation memory game, evidence trail,
interactive skill highlighting, and unlockable rooftop complement the existing
signal and project games.

Visitors can save one outfit and nickname per browser. A signed HttpOnly,
SameSite=Lax cookie restores it for up to one year (Secure in production). Public
sharing is unchecked by default; only opted-in, unmoderated creations appear in
the paginated neighbourhood and public count. Nicknames aren't verified identities.
Visitors can edit, unpublish, or delete their own creation. Clearing the ownership
cookie loses self-service access; the owner can remove records through Django
admin. Nicknames are not added to Groq prompts. Progress and quest memory remain
browser-local; no chat transcript is stored.

Nori Profile admin supports hiding public entries without deleting their owners'
companions. CSRF, bounded plain-text nicknames, fixed outfit/accessory options,
non-public ownership IDs, and write limits protect the gallery. The write limits
use Django's cache (8 saves/minute and 3 new companions/day per salted address
digest); with the default local-memory cache they are per worker and reset on
restart. Use a shared cache if stronger cross-worker abuse limits are needed.
No visitor IP addresses are saved in the profile database.

Milestones are the first section after the hero. Nori gives a welcome and a
short section introduction, with Next controls. Visitors can skip introductions
while keeping the playground available. Quick reading and reduced motion bypass
the spotlight. Chat remains available through its dedicated controls.

The certificate exhibit reads the existing admin-managed cards, supports collection
filters and search, and opens the original image viewer. Without JavaScript, the
original expandable collections remain available. Constellation Recall has three
rounds of 3, 4, and 5 stars, replay, a persistent visible-clue option, keyboard
buttons, and no response timer. Reduced motion enables the visible clue.

Static deployment verification includes `adventure.css`, `adventure.js`,
`exhibit.css`, and `exhibit.js`.


### Guided routes, proof passports, and tailored résumés

Nori introduces the first visited section with a welcome and a Next button, then
introduces each subsequent section once per page visit. Each introduction can be
skipped, and Quick mode or reduced motion bypasses the spotlight. Nori shrinks to
alternating corners, follows the pointer with her eyes, smiles on a click, and
sends hearts after three quick clicks. Decorative layers and milestone images
use scroll parallax; motion controls pause it.

Hiring hides the research section and research-only projects; research hides work
and internships. The end-of-route invitation opens the other side. Projects have
an Audience field in admin; existing Noor and Phosphene Simulator records are
classified as research. The workshop supports search, technology filters, four
cards at a time, and a draggable/keyboard-accessible project universe.

In Studio → Achievements, edit **Order** (lower first), **Show research**, and
**Show job** directly in the list. Both route flags default to enabled to preserve
existing content; the owner can curate them. Other visitors see every certificate.
The existing **Display** checkbox still controls CV eligibility independently.

Collect proof buttons unlock red (research), blue (hiring), or gold (everything)
passports. Progress is browser-local; the selected cosmetic passport is saved with
the signed-cookie-owned Nori profile. Passports are playful cosmetics, not verified
credentials. Eight outfits and eight accessories are available. No new public
creations are seeded. Image links open in portfolio dialogs.

The CV page asks for a target role and focus. The tailored HTML and PDF use the
same deterministic relevance ranking of existing records, without sending the
role to an AI provider or inventing qualifications. Research/job filters also
apply to résumé projects and certificates; the full CV remains available. The
new PDF is a readable single-column document with selectable text. No acceptance
or ATS-score guarantees are made.

Deploy migrations 0030 and 0031 and collect static assets, including journey.js and
journey.css. The existing deployment workflow performs these steps.
