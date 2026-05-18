# Abdulla Shahzan — Portfolio

Personal portfolio website built with **Django 5** featuring an interactive journey timeline, AI chat assistant, research publications, project showcase, and certification management.

## Features

- **Interactive Journey Section** — Scroll-locked full-screen timeline that walks through professional experiences one slide at a time, with animated media and text.
- **AI Chat Assistant (Okabe Rintarou)** — Real-time conversational assistant powered by Groq (Llama 3.3 70B). Portfolio-aware — it knows about projects, research, skills, and achievements from the database.
- **Research Publications** — Categorized display of published and in-progress research papers with GitHub links.
- **Certification Management** — Accordion-style achievement categories with a lightbox viewer for certificate images.
- **Admin CMS** — Django admin interface to manage all content (projects, skills, research, experiences, achievements, categories) without touching code.
- **Minimalist Dark Aesthetic** — Custom cursor, particle animation hero, scroll-triggered reveal animations, and video dividers.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5, Python 3.12 |
| AI | Groq API (llama-3.3-70b-versatile) |
| Frontend | Vanilla JS, CSS3, HTML5 |
| Database | SQLite (dev), PostgreSQL (prod-ready via Django ORM) |
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
│   │   ├── models.py            # Content models
│   │   ├── views.py             # Page views + chat API
│   │   └── admin.py             # Admin configuration
│   ├── portfolio/               # Django project settings
│   └── manage.py
├── requirements.txt
└── readme.md
```

## Content Management

All site content is managed through Django admin (`/admin/`). The following models are available:

- **Me** — Name, title, bio, GPA, social links
- **TopProject** — Showcase projects with tags and descriptions
- **Research** — Published/in-progress papers with GitHub links
- **Experience** — Journey timeline entries (title, description, image/video)
- **Skill** — Technical skills displayed in a grid
- **AchievementCategory** — Groups of certificates (e.g., "Huawei", "AI")
- **Achievement** — Individual certificates with image upload

## Deployment

```bash
# Collect static files for production
python portfolio/manage.py collectstatic

# Set DEBUG=False and configure ALLOWED_HOSTS in settings.py
```

Compatible with any Django-compatible hosting (PythonAnywhere, Railway, DigitalOcean, Huawei Cloud, etc.).

## License

All rights reserved — content and design belong to Abdulla Shahzan.
