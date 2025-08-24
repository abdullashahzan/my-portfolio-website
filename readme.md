# 🌟 Personal Portfolio – Built with Django

This is my **personal developer portfolio** built using **Django**, showcasing my **projects, skills, achievements, and certifications**. 
It features **interactive UI elements**, **parallax scrolling effects**, and **dynamic content rendering** from the database.

---

## 🚀 Live Demo

🔗 [Visit Portfolio Website](https://your-portfolio-link.com)

[![Python](https://img.shields.io/badge/Python-3.11-green?logo=python)](https://www.python.org/) 
[![Django](https://img.shields.io/badge/Django-4.x-green?logo=django)](https://www.djangoproject.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple?logo=bootstrap)](https://getbootstrap.com/)

---

## 📑 Table of Contents

- [Appendix](#-appendix)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Optimizations](#-optimizations)
- [Roadmap](#-roadmap)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Authors](#-authors)

---

## 📎 Appendix
- All images and media assets are handled dynamically via models.
- Project supports video backgrounds for sections.
- Fully responsive design for mobile, tablet, and desktop devices.

---

## 📸 Screenshots

![Home Page](https://i.imgur.com/3R7SBIl.png)
![Projects Page](https://i.imgur.com/kq5Wqud.png)
![Achievements Page](https://i.imgur.com/9p58XKw.png)

---

## ⚡ Features
- Home, Projects, and Achievements pages.
- **Dynamic Content** – Add/update projects, achievements, certifications, and experiences easily from the admin panel.
- Carousel for showcasing about me section.
- Interactive video backgrounds.
- Dynamic fetching and rendering of GitHub README files for projects.
- Fullscreen overlay for viewing images and certificates.
- Parallax scrolling animations for a modern feel.
- Responsive masonry layout for project showcase.
- Reusable Layout – DRY structure using Django templates (`layout.html` as the base).
- **Responsive Design** – Mobile-first UI with Bootstrap + custom CSS.
- Smooth Animations – Interactive reveal effects, fullscreen image previews, and carousel components.
- Achievements Section – Categorized certifications & badges displayed dynamically.
- Projects Showcase – Click any project to view full details, tech stack, and GitHub README.

---

## 🧑‍💻 Admin Dashboard

Django Admin is used as a **content management system (CMS)**.
From here you can:

* Add new projects with descriptions, GitHub links, and images.
* Upload certifications and achievements under categories.
* Update About Me section and experiences.

![Admin Dashboard](https://i.imgur.com/McwyJiU.png)

---

## 🚀 Optimizations
- **Lazy loading** animations with Intersection Observer API.
- **Canvas-based background animation** for interactive visuals without blocking main content.
- Optimized CSS transitions for smoother animations.
- Efficient database queries using `prefetch_related` in achievements view.

---

## 🗺️ Roadmap
- Add blog section to share insights and tutorials.
- Implement dark/light mode toggle.
- Add filters and categories for projects.
- Optimize for SEO and faster load times.

---

## 🛠️ Tech Stack

**Frontend:**

* HTML5, CSS3 (Bootstrap, Animate.css)
* JavaScript (interactive image previews & animations)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) 
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3) 
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple?logo=bootstrap) 
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

**Backend:**

* Django 4.x (Python 3.11)
* SQLite (development) / Any SQL database (production-ready)

![Python](https://img.shields.io/badge/Python-3.11-green?logo=python) 
![Django](https://img.shields.io/badge/Django-4.x-green?logo=django) 
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite)

**Other Tools:**

* Git & GitHub
* Django Admin for CMS
* Responsive testing on multiple devices

![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white) 
![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white) 
![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?logo=visual-studio-code&logoColor=white)

---

## ⚙️ Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/abdullashahzan/portfolio.git
   ```

2. Navigate into the project folder:

   ```bash
   cd portfolio
   ```

3. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate      # For Linux/Mac
   venv\Scripts\activate         # For Windows
   ```
4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
5. Apply migrations:

   ```bash
   python manage.py migrate
   ```
6. Run the development server:

   ```bash
   python manage.py runserver
   ```

---

## 🖥️ Usage

* Visit `/` to access the home page.
* Browse `/Projects/` to see all projects.
* Click a project to see its detailed page with README fetched from GitHub.
* Visit `/Achievements/` to view certifications.

---

## 🗂️ Project Structure
```

portfolio/
│
├─ main/
│  ├─ migrations/
│  ├─ templates/main/
│  │  ├─ home.html
│  │  ├─ projects.html
│  │  ├─ view\_project.html
│  │  ├─ achievements.html
│  │  └─ layout.html
│  ├─ static/main/
│  │  ├─ style.css
│  │  └─ script.js
│  ├─ admin.py
│  ├─ models.py
│  ├─ views.py
│  └─ urls.py
│
├─ portfolio/
│  ├─ settings.py
│  ├─ urls.py
│  └─ wsgi.py
│
├─ manage.py
└─ README.md

````

---

## 💡 Why This Project Stands Out

This project is more than a static portfolio – it’s a **full-stack application**:

* Built with **Django best practices** (template inheritance, models, views).
* Professional **design and responsiveness**.
* Employer-ready to demonstrate **both backend + frontend skills**.

---

## ⭐ Support

If you like this project, please give it a ⭐ on GitHub – it helps a lot!

---

⚡ *Built with passion, Python, and Django.*

---

## 👤 Author

**Abdulla Shahzan**

* 📧 Email: [abdullashahzan@gmail.com](mailto:abdullashahzan@gmail.com)
* 💼 LinkedIn: [linkedin.com/in/abdulla-shahzan](https://www.linkedin.com/in/abdulla-shahzan-03b00a226)
* 🐙 GitHub: [github.com/abdullashahzan](https://github.com/abdullashahzan)

---
