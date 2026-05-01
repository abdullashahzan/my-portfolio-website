/* ════════════════════════════════════════
   HERO CANVAS
════════════════════════════════════════ */
const canvas = document.getElementById('heroCanvas');
const ctx    = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
resize();
window.addEventListener('resize', resize);

class P {
  constructor() { this.reset(); }
  reset() {
    this.x       = Math.random() * W;
    this.y       = Math.random() * H;
    this.size    = Math.random() * 1.5 + .3;
    this.vx      = (Math.random() - .5) * .3;
    this.vy      = (Math.random() - .5) * .3;
    this.life    = Math.random();
    this.maxLife = Math.random() * .04 + .005;
    this.isRed   = Math.random() < .12;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life += this.maxLife;
    if (this.life > 1 || this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    const a = Math.sin(this.life * Math.PI);
    ctx.globalAlpha = a * .6;
    ctx.fillStyle   = this.isRed ? '#EF5D60' : '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGrid() {
  ctx.globalAlpha = .04;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = .5;
  const gs = 80;
  for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0);  ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y);  ctx.lineTo(W, y); ctx.stroke(); }
  ctx.globalAlpha = .08;
  ctx.strokeStyle = '#EF5D60';
  ctx.lineWidth   = 1;
  [W * .3, W * .7].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); });
  [H * .4, H * .7].forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); });
}

for (let i = 0; i < 120; i++) particles.push(new P());

let cmx = W / 2, cmy = H / 2;
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  cmx = e.clientX - r.left;
  cmy = e.clientY - r.top;
});

function loop() {
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  ctx.lineWidth = 1;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 110) {
        ctx.globalAlpha = .04 * (1 - d / 110);
        ctx.strokeStyle = (particles[i].isRed || particles[j].isRed) ? '#EF5D60' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
    const dx = particles[i].x - cmx;
    const dy = particles[i].y - cmy;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < 120) { particles[i].vx += dx / d * .03; particles[i].vy += dy / d * .03; }
    particles[i].update();
    particles[i].draw();
  }
  requestAnimationFrame(loop);
}
loop();


/* ════════════════════════════════════════
   CURSOR
════════════════════════════════════════ */
const cur  = document.getElementById('cur');
const ring = document.getElementById('curRing');
let mx2 = 0, my2 = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx2 = e.clientX;
  my2 = e.clientY;
  cur.style.transform = `translate(${mx2 - 5}px, ${my2 - 5}px)`;
});

(function lerpRing() {
  rx += (mx2 - rx) * .1;
  ry += (my2 - ry) * .1;
  ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
  requestAnimationFrame(lerpRing);
})();

document.querySelectorAll('a, button, .skill, .stat, .proj, .paper, .ach-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    ring.style.width       = '52px';
    ring.style.height      = '52px';
    ring.style.borderColor = 'rgba(192,57,43,.7)';
  });
  el.addEventListener('mouseleave', () => {
    ring.style.width       = '36px';
    ring.style.height      = '36px';
    ring.style.borderColor = 'rgba(192,57,43,.5)';
  });
});


/* ════════════════════════════════════════
   NAV
════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Active page highlight
const currentPath = window.location.pathname;
document.querySelectorAll('nav ul a, .nav-drawer ul a').forEach(a => {
  const href = a.getAttribute('href');
  if (href && !href.includes('#') && currentPath.includes(href.replace(/^.*\/\/[^/]+/, ''))) {
    a.classList.add('active');
  }
});

// Mobile drawer
const navMenuBtn = document.getElementById('navMenuBtn');
const navDrawer  = document.getElementById('navDrawer');

navMenuBtn?.addEventListener('click', () => {
  const isOpen = navDrawer.classList.toggle('open');
  navMenuBtn.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

function closeDrawer() {
  navDrawer?.classList.remove('open');
  navMenuBtn?.classList.remove('open');
  document.body.style.overflow = '';
}


/* ════════════════════════════════════════
   SCROLL REVEAL
════════════════════════════════════════ */
const obs = new IntersectionObserver(entries => {
  entries.forEach(el => {
    if (el.isIntersecting) {
      el.target.classList.add('vis');
      el.target.querySelector?.('.sh-line')?.classList.add('vis');
    }
  });
}, { threshold: .1 });

document.querySelectorAll('.r, .r-left, .r-right, .sh').forEach(el => obs.observe(el));
document.querySelectorAll('.sh-line').forEach(el => obs.observe(el));

/* ════════════════════════════════════════
   JOURNEY – SNAP TO FULL SCREEN + REVERSIBLE
════════════════════════════════════════ */
(function() {
  const section = document.getElementById('journey');
  const slides = Array.from(document.querySelectorAll('.journey-slide'));
  if (!section || slides.length === 0) return;

  let activeIndex = 0;
  let isLocked = false;
  let isAnimating = false;
  let lastWheelTime = 0;

  // 1. TUNED LOCK: Increased threshold to 0.8 for a "softer" entry/exit
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Locks only when 80% visible. If less than that, we let the user scroll freely.
      if (entry.intersectionRatio > 0.8) {
        if (!isLocked) snapAndLock();
      } else if (entry.intersectionRatio < 0.8) {
        unlockScroll();
      }
    });
  }, { threshold: [0, 0.8] });

  observer.observe(section);

  function snapAndLock() {
    if (isLocked) return;
    isLocked = true;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    document.body.style.overflow = 'hidden'; 
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKey, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
  }

  function unlockScroll() {
    if (!isLocked) return;
    isLocked = false;
    document.body.style.overflow = ''; 
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('keydown', handleKey);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
  }

  function setActiveSlide(index) {
    if (index === activeIndex || isAnimating) return;
    isAnimating = true;

    slides[activeIndex].classList.remove('active');
    slides[index].classList.add('active');
    activeIndex = index;

    // Reduced timeout to 600ms for a snappier feel
    setTimeout(() => { isAnimating = false; }, 600); 
  }

  function handleWheel(e) {
    if (!isLocked) return;
    e.preventDefault();

    const now = Date.now();
    // Lowered cooldown to 70ms for better responsiveness
    if (now - lastWheelTime < 70) return; 
    lastWheelTime = now;

    if (e.deltaY > 0) {
      if (activeIndex < slides.length - 1) {
        setActiveSlide(activeIndex + 1);
      } else {
        exitSection('down');
      }
    } else {
      if (activeIndex > 0) {
        setActiveSlide(activeIndex - 1);
      } else {
        exitSection('up');
      }
    }
  }

  let touchStartY = 0;
  function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    if (!isLocked) return;
    e.preventDefault();

    const touchEndY = e.touches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    // Sensitivity lowered to 35px for effortless mobile swiping
    if (Math.abs(deltaY) > 35) { 
      if (deltaY > 0) {
        if (activeIndex < slides.length - 1) setActiveSlide(activeIndex + 1);
        else exitSection('down');
      } else {
        if (activeIndex > 0) setActiveSlide(activeIndex - 1);
        else exitSection('up');
      }
      touchStartY = touchEndY; 
    }
  }

  function exitSection(direction) {
    unlockScroll();
    // Increased nudge to 300px to decisively clear the intersection trigger
    if (direction === 'down') {
      window.scrollBy({ top: 10, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: -100, behavior: 'smooth' });
    }
  }

  function handleKey(e) {
    if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
      if (isLocked) e.preventDefault();
    }
    if (e.key === 'ArrowDown' && activeIndex < slides.length - 1) setActiveSlide(activeIndex + 1);
    else if (e.key === 'ArrowDown') exitSection('down');
    
    if (e.key === 'ArrowUp' && activeIndex > 0) setActiveSlide(activeIndex - 1);
    else if (e.key === 'ArrowUp') exitSection('up');
  }
})();

/* ════════════════════════════════════════
   HUAWEI CERT STAGGER
════════════════════════════════════════ */
const certObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('cert-in');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.cert-card').forEach((card, i) => {
  card.style.transitionDelay = `${(i % 3) * 0.08}s`;
  certObs.observe(card);
});


/* ════════════════════════════════════════
   CHAT (UPDATED FOR GROQ API)
════════════════════════════════════════ */
const overlay = document.getElementById('chatOverlay');
const openChat  = () => overlay.classList.add('open');
const closeChat = () => {
  overlay.classList.add('closing');
  setTimeout(() => overlay.classList.remove('open', 'closing'), 260);
};

document.getElementById('chatBtn')?.addEventListener('click', openChat);
document.getElementById('chatBtnHero')?.addEventListener('click', openChat);
document.getElementById('chatClose')?.addEventListener('click', closeChat);
overlay?.addEventListener('click', e => { if (e.target === overlay) closeChat(); });

const msgs = document.getElementById('chatMsgs');
const inp  = document.getElementById('chatInp');

// Helper to get CSRF token from cookies (Standard Django practice)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function sendMsg() {
  const txt = inp.value.trim();
  if (!txt) return;
  
  inp.value = '';
  
  // 1. Append User Message
  const u = document.createElement('div');
  u.className   = 'msg user';
  u.textContent = txt;
  msgs.appendChild(u);
  
  // 2. Add Typing Indicator
  const t = document.createElement('div');
  t.className   = 'typing';
  t.innerHTML   = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  msgs.appendChild(t);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    // 3. Fetch from Django Backend
    const response = await fetch('/chat-api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken') // Important for Django security
      },
      body: JSON.stringify({ message: txt })
    });

    const data = await response.json();
    
    // 4. Remove typing indicator and append bot response
    t.remove();
    const b = document.createElement('div');
    b.className   = 'msg bot';
    
    if (data.response) {
      b.textContent = data.response;
    } else {
      b.textContent = "I'm having a bit of trouble connecting to my brain. Try again in a second?";
    }
    
    msgs.appendChild(b);

  } catch (error) {
    t.remove();
    const e = document.createElement('div');
    e.className = 'msg bot';
    e.textContent = "Offline. Please check your connection.";
    msgs.appendChild(e);
    console.error("Chat Error:", error);
  }

  msgs.scrollTop = msgs.scrollHeight;
}

document.getElementById('chatSend')?.addEventListener('click', sendMsg);
inp?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

/* ════════════════════════════════════════
   ACHIEVEMENTS — ACCORDION
════════════════════════════════════════ */
function toggleCat(btn) {
  const cat    = btn.closest('.ach-cat');
  const isOpen = cat.classList.contains('open');
  document.querySelectorAll('.ach-cat.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) cat.classList.add('open');
}


/* ════════════════════════════════════════
   ACHIEVEMENTS — LIGHTBOX
════════════════════════════════════════ */
let lbImages = [];
let lbIndex  = 0;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.ach-card').forEach(card => {
    card.addEventListener('click', () => {
      const catName = card.dataset.cat;
      const idx     = parseInt(card.dataset.idx);
      lbImages = [];
      document.querySelectorAll(`.ach-card[data-cat="${catName}"]`).forEach(c => {
        lbImages.push(c.dataset.src);
      });
      lbIndex = idx;
      openLightbox();
    });
  });
});

function openLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('closing');
  lb.classList.add('open');
  setLbImage();
  document.addEventListener('keydown', lbKeyHandler);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.add('closing');
  setTimeout(() => lb.classList.remove('open', 'closing'), 260);
  document.removeEventListener('keydown', lbKeyHandler);
}

function setLbImage() {
  const img = document.getElementById('lb-img');
  img.style.opacity = 0;
  img.src = lbImages[lbIndex];
  img.onload = () => { img.style.transition = 'opacity .2s'; img.style.opacity = 1; };
  document.getElementById('lb-caption').textContent = `${lbIndex + 1} / ${lbImages.length}`;
}

function lbNav(dir, e) {
  e && e.stopPropagation();
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  setLbImage();
}

function lbKeyHandler(e) {
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'ArrowLeft')  lbNav(-1);
  if (e.key === 'Escape')     closeLightbox();
}