const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reducedMotion.matches;
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
  if (document.hidden && !motionPaused) { requestAnimationFrame(loop); return; }
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
    if (d > 0 && d < 120) { particles[i].vx += dx / d * .03; particles[i].vy += dy / d * .03; }
    particles[i].update();
    particles[i].draw();
  }
  if (!motionPaused) requestAnimationFrame(loop);
}
loop();


const motionButton = document.getElementById('motionToggle');
function updateMotion(){motionButton.textContent=motionPaused?'Play animation':'Pause animation';motionButton.setAttribute('aria-pressed',String(motionPaused));document.querySelectorAll('.video-divider video').forEach(v=>{if(motionPaused)v.pause();else v.play().catch(()=>{});});}
updateMotion();motionButton.addEventListener('click',()=>{motionPaused=!motionPaused;updateMotion();if(!motionPaused)loop();});
const nav=document.getElementById('nav'),menu=document.getElementById('navMenuBtn'),drawer=document.getElementById('navDrawer');
window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>30),{passive:true});
function closeDrawer(){drawer.classList.remove('open');menu.classList.remove('open');menu.setAttribute('aria-expanded','false');document.body.style.overflow='';}
menu.addEventListener('click',()=>{const open=!drawer.classList.contains('open');closeDrawer();if(open){drawer.classList.add('open');menu.classList.add('open');menu.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';drawer.querySelector('a').focus();}});
const sections=document.querySelectorAll('section[id]');
const sectionObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)document.querySelectorAll('nav a[href*="#"]').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}),{rootMargin:'-20% 0px -55% 0px'});sections.forEach(s=>sectionObserver.observe(s));
// Normal document scrolling keeps all experience entries available at any length.
if(!reducedMotion.matches){const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');reveal.unobserve(e.target);}}),{threshold:.05});document.querySelectorAll('.r,.r-left,.r-right').forEach(el=>{el.classList.add('reveal-ready');reveal.observe(el);});}
// Research filters are derived from each database record's status.
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});let count=0;document.querySelectorAll('.paper[data-status]').forEach(p=>{p.hidden=button.dataset.status!=='all'&&p.dataset.status!==button.dataset.status;if(!p.hidden)count++;});document.getElementById('researchEmpty').hidden=count>0;}));
function setCategory(cat,open){cat.classList.toggle('open',open);cat.querySelector('.ach-cat-header').setAttribute('aria-expanded',String(open));cat.querySelector('.ach-cat-body').hidden=!open;}
function toggleCat(button){const cat=button.closest('.ach-cat');setCategory(cat,!cat.classList.contains('open'));}
const search=document.getElementById('certificateSearch');
search.addEventListener('input',()=>{const query=search.value.trim().toLocaleLowerCase();let count=0;document.querySelectorAll('.ach-cat').forEach(cat=>{const category=cat.querySelector('.ach-cat-name').textContent.toLocaleLowerCase();let matches=0;cat.querySelectorAll('.ach-card').forEach(card=>{card.hidden=!!query&&!`${category} ${card.dataset.title}`.toLocaleLowerCase().includes(query);if(!card.hidden)matches++;});cat.hidden=!!query&&!matches;setCategory(cat,!!query&&matches>0);count+=matches;});document.getElementById('certificateCount').textContent=query?`${count} certificate${count===1?'':'s'} found`:'';});
// Shared keyboard/focus behavior for the assistant and certificate viewer.
let activeModal=null,returnFocus=null;
function openModal(el,focus){returnFocus=document.activeElement;activeModal=el;el.classList.add('open');document.body.style.overflow='hidden';document.querySelector('nav').inert=true;focus.focus();}
function closeModal(){if(!activeModal)return;activeModal.classList.remove('open');activeModal=null;document.body.style.overflow='';document.querySelector('nav').inert=false;returnFocus?.focus();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(activeModal)closeModal();else if(drawer.classList.contains('open')){closeDrawer();menu.focus();}}const container=activeModal||(drawer.classList.contains('open')?drawer:null);if(container&&e.key==='Tab'){const items=[...container.querySelectorAll('a[href],button:not(:disabled),input')].filter(el=>el.getClientRects().length);if(!activeModal)items.push(menu);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
const lightbox=document.getElementById('lightbox');let lbImages=[],lbIndex=0;
document.querySelectorAll('.ach-card:not(:disabled)').forEach(card=>card.addEventListener('click',()=>{lbImages=[...document.querySelectorAll('.ach-card:not(:disabled)')].filter(c=>c.dataset.cat===card.dataset.cat&&!c.hidden);lbIndex=lbImages.indexOf(card);setLbImage();openModal(lightbox,lightbox.querySelector('.lb-close'));}));
function setLbImage(){const card=lbImages[lbIndex];if(!card)return;const img=document.getElementById('lb-img');img.src=card.dataset.src;img.alt=card.dataset.title;document.getElementById('lb-caption').textContent=`${card.dataset.title} · ${lbIndex+1} / ${lbImages.length}`;}
function closeLightbox(){closeModal();}
function lbNav(dir,event){event?.stopPropagation();if(lbImages.length){lbIndex=(lbIndex+dir+lbImages.length)%lbImages.length;setLbImage();}}
lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeModal();});document.addEventListener('keydown',e=>{if(activeModal!==lightbox)return;if(e.key==='ArrowRight')lbNav(1);if(e.key==='ArrowLeft')lbNav(-1);});
const overlay=document.getElementById('chatOverlay'),inp=document.getElementById('chatInp'),msgs=document.getElementById('chatMsgs'),send=document.getElementById('chatSend');
[document.getElementById('chatBtn'),document.getElementById('chatBtnHero')].forEach(b=>b?.addEventListener('click',()=>openModal(overlay,inp)));
document.getElementById('chatClose').addEventListener('click',closeModal);overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal();});
let sending=false;
function addMessage(text,type){const msg=document.createElement('div');msg.className=`msg ${type}`;msg.textContent=text;msgs.appendChild(msg);msgs.scrollTop=msgs.scrollHeight;return msg;}
async function sendMsg(){const text=inp.value.trim();if(!text||sending)return;sending=true;send.disabled=true;inp.value='';addMessage(text,'user');const pending=addMessage('Thinking…','bot');try{const response=await fetch(overlay.dataset.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text}),signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error('Request failed');const data=await response.json();pending.textContent=data.response||'The assistant is unavailable right now. Please try again shortly.';}catch{pending.textContent='The assistant couldn’t connect. Please try again shortly, or use the contact links below.';}finally{sending=false;send.disabled=false;msgs.scrollTop=msgs.scrollHeight;}}
send.addEventListener('click',sendMsg);inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();sendMsg();}});
