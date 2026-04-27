# 🌌 Deep-Space Portfolio | Django & AI

A high-performance, minimalist portfolio built with **Django 4.2**, integrated with **Groq (Llama 3.3)** for real-time AI assistance. This project bridges the gap between traditional web development and modern AI integration, featuring a custom-built CMS and automated asset management.

## 🧠 Core Architecture & AI Integration

### **Real-Time AI Assistant**
Unlike static chatbots, this system uses a custom Django API endpoint to interface with **Groq's Llama-3.3-70b** model.
* **Dynamic Context Injection**: The assistant is "portfolio-aware." It queries the database for your latest projects and research papers to inject into the LLM system prompt.
* **Asynchronous Flow**: Uses JavaScript `async/await` to handle real-time inference without blocking the UI thread.

### **Advanced Django Patterns**
* **Custom Managers**: Implements specialized `ResearchManager` logic to allow semantic template calls like `{{ research_items.published.count }}`, keeping logic out of the views and in the models.
* **Optimized Queries**: Leverages `prefetch_related` and `select_related` to minimize database hits during project and tag rendering.
* **Lazy-Load Registry**: Assets are served via a dynamic static-file pipeline configured for production-grade environments like **Huawei Cloud ECS**.

---

## 🛠️ Technical Stack

| Layer | Technology | Key Features |
| :--- | :--- | :--- |
| **Backend** | Django 4.x / Python 3.12 | Custom Managers, Signals, CSRF-secure API |
| **Intelligence**| Groq API (Llama 3.3) | Sub-100ms inference, Portolio-aware context |
| **Frontend** | Vanilla JS / Bootstrap 5 | Intersection Observer, Parallax, Glassmorphism |

---

## ⚙️ Engineering Setup

### **1. Environment Configuration**
The project utilizes `python-dotenv` for secure credential management. Create a `.env` file in the root:
```env
GROQ_API_KEY=your_gsk_key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com, localhost
```

### **2. Production Deployment**
To transition from development to production:
1.  **Static Collection**: Run `python manage.py collectstatic` to aggregate assets for Nginx.
2.  **Environment Sync**: Ensure your Huawei Cloud security groups allow traffic on port 80/443.
3.  **Process Management**: Recommended deployment via Gunicorn and Nginx on CentOS.

---

## ⚡ Key Features
* **Research Tracking**: Differentiates between 'In-Progress' and 'Published' work using a custom status-filtering pipeline.
* **Interactive Skills Grid**: A staggered, alphabetically sorted grid that handles animation delays dynamically via the Django `forloop.counter`.
* **Deep-Space Aesthetic**: A customized UI/UX style that prioritizes minimalism and high-tech visual cues over cluttered design.

---

## 👤 Author
**Abdulla Shahzan**
* **Projects**: AI-driven medical prosthetics, CNN fruit classification, and minimalist UI systems.
* **Expertise**: Full-stack Django development and Computer Vision.
