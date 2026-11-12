import './style.css';
import './wall.css';
import './art.css';
import {artPass} from './art';
import {readingHighlight} from './reading';
import {certificateWall} from './wall';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {Flip} from 'gsap/Flip';
import Lenis from 'lenis';
import {startField} from './field.js';
gsap.registerPlugin(ScrollTrigger, Flip);
const root=document.documentElement;
const db=JSON.parse(document.querySelector('#portfolio-content').textContent);
const source=db;
let persona=root.dataset.persona;
let c, contexts=[],cleanupField=()=>{},switchTimeline, intro, epoch=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const safeURL=url=>{if(!url)return null;try{const u=new URL(url,location.origin);return ['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}};
const link=(url,text)=>safeURL(url)?`<a href="${esc(safeURL(url))}">${esc(text)} ↗</a>`:'';
const description=item=>{const d=item.desc??item.summary??item.description??'';return typeof d==='object'?(d[persona]||''):d};
function ordered(items){const rank=v=>v.for===persona?0:v.for==='both'?1:2;return [...items].sort((a,b)=>rank(a)-rank(b)||a.order-b.order||a.id-b.id)}
function resolveContent(){c={...source,...source.personas[persona],projects:ordered(source.projects),achievements:ordered(source.achievements),certificates:ordered(source.certificates)}}
function switchUI(kind){return `<div class="persona-switch ${kind}-switch"><span class="mono switch-label"><i></i> ${esc(db.alterEgoLabel)}</span><div role="radiogroup" aria-label="${esc(db.alterEgoLabel)}">${['researcher','engineer'].map((p,i)=>`${i?'<span class="switch-slash" aria-hidden="true">/</span>':''}<button type="button" role="radio" aria-checked="${persona===p}" tabindex="${persona===p?0:-1}" data-persona-choice="${p}"><span>${esc(db.personas[p].label)}</span><span class="switch-fill" aria-hidden="true">${esc(db.personas[p].label)}</span></button>`).join('')}</div>${kind==='hero'?`<p class="mono">${esc(db.switchHint)}</p>`:''}</div>`}
function render(){
document.querySelector('#app').innerHTML=db.views[persona];
const email=document.querySelector('a.email');if(email){email.setAttribute('aria-label',c.email);email.innerHTML=[...c.email].map((v,i)=>`<span class="roll" aria-hidden="true"><span data-char="${esc(v)}" style="transition-delay:${i*.03}s">${esc(v)}</span></span>`).join('')}
document.querySelector('.nav-persona').innerHTML=switchUI('nav');
document.querySelector('.overlay-persona').innerHTML=switchUI('overlay');
document.querySelectorAll('[data-nav]').forEach(el=>el.hidden=!db.active[persona][el.dataset.nav]);
}
const lenis=reduced?null:new Lenis({lerp:.09,anchors:true});
if(lenis){lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0)}
function sectionContext(selector,fn){const el=document.querySelector(selector);if(el)contexts.push(gsap.context(fn,el))}
function maskedLines(el){
 const text=el.textContent;el.setAttribute('aria-label',text);
 el.innerHTML=text.split(/\s+/).map(w=>`<span class="line-word" aria-hidden="true">${esc(w)}</span>`).join(' ');
 const groups=[];let previous=-1;for(const word of el.children){if(word.offsetTop!==previous){groups.push([]);previous=word.offsetTop}groups.at(-1).push(word.textContent.trim())}
 el.innerHTML=groups.map(words=>`<span class="line-mask" aria-hidden="true"><span class="line-inner">${esc(words.join(' '))}</span></span>`).join(' ');
}
function setupMotion(skipEntrances=false){
 sectionContext('#top',()=>{if(!reduced){gsap.to('#name',{yPercent:25,scale:.94,opacity:0,ease:'none',scrollTrigger:{trigger:document.querySelector('.hero'),start:'top top',end:'bottom top',scrub:true}});gsap.to('#field',{opacity:.1,scrollTrigger:{trigger:document.querySelector('.hero'),start:'top top',end:'bottom top',scrub:true}})}ScrollTrigger.create({trigger:document.querySelector('.hero'),start:'bottom top',onToggle:s=>document.querySelector('.nav-persona').classList.toggle('visible',s.isActive),onUpdate:s=>document.querySelector('.nav-persona').classList.toggle('visible',s.progress>0)});});
 sectionContext('#about',()=>readingHighlight(document.querySelector('.statement'),c.about,ScrollTrigger,reduced));
 sectionContext('.marquee',()=>{if(reduced)return;const tracks=gsap.utils.toArray('.track');const tweens=tracks.map((el,i)=>gsap.fromTo(el,{xPercent:i?-25:0},{xPercent:i?0:-25,duration:85,repeat:-1,ease:'none'}));ScrollTrigger.create({onUpdate:s=>tweens.forEach(t=>gsap.to(t,{timeScale:s.direction*Math.min(4,1+Math.abs(s.getVelocity())/1200),overwrite:true,duration:.4}))})});
 sectionContext('#research',()=>{const path=document.querySelector('.research-line path');if(!reduced)gsap.fromTo(path,{strokeDasharray:100,strokeDashoffset:100},{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:document.querySelector('.research-list'),start:'top 65%',end:'bottom 65%',scrub:true}});document.querySelectorAll('.research-entry').forEach((el,i)=>ScrollTrigger.create({trigger:el,start:'top 65%',end:'bottom 65%',onToggle:s=>{el.querySelector('.dot').style.background=s.isActive?'var(--glow)':'var(--mute)';if(s.isActive)document.querySelector('#current').textContent=String(i+1).padStart(2,'0')}}))});
 sectionContext('#projects',()=>{if(!skipEntrances&&!reduced)gsap.utils.toArray('.rule').forEach(el=>gsap.from(el,{scaleX:0,duration:1.1,scrollTrigger:{trigger:el,start:'top 90%',once:true}}))});
 sectionContext('#achievements',()=>{const mm=gsap.matchMedia();mm.add('(min-width:1024px)',()=>{if(reduced)return;const steps=gsap.utils.toArray('.achievement-step');if(!steps.length)return;gsap.set(steps,{autoAlpha:0});const tl=gsap.timeline({scrollTrigger:{trigger:document.querySelector('.achievement-stage'),start:'top top',end:()=>`+=${innerHeight*.9*steps.length}`,pin:true,scrub:true,invalidateOnRefresh:true}});steps.forEach((step,i)=>{tl.set(step,{autoAlpha:1},i).fromTo(step.querySelectorAll('h3'),{opacity:0},{opacity:1,duration:.23,ease:'none'},i).fromTo(step.querySelector('.stage-light'),{opacity:0,scale:.8},{opacity:1,scale:1,duration:.3},i).to(step.querySelector('.stage-light'),{y:40,duration:.9,ease:'none'},i).fromTo(step.querySelector('.achievement-year'),{yPercent:100,opacity:0},{yPercent:0,opacity:1,duration:.3},i).fromTo(step.querySelectorAll('.achievement-meta,.achievement-copy>p,.achievement-copy>a,.achievement-image'),{opacity:0,y:20},{opacity:1,y:0,duration:.3},i).to(step.querySelectorAll('h3'),{yPercent:-110,opacity:0,duration:.23,stagger:.035},i+.7).to(step,{autoAlpha:0,duration:.3},i+.7);});tl.fromTo('.achievement-track i',{y:0},{y:()=>innerHeight*.55,duration:steps.length,ease:'none'},0);});if((innerWidth<1024||reduced)&&!skipEntrances)gsap.utils.toArray('.achievement-step').forEach(el=>gsap.from(el,{opacity:0,y:reduced?0:28,duration:reduced?.15:1,scrollTrigger:{trigger:el,start:'top 90%',once:true}}));});
 sectionContext('#certificates',()=>certificateWall({gsap,ScrollTrigger,lenis,reduced,certificates:c.certificates,switched:skipEntrances}));
 sectionContext('#experience',()=>{if(!skipEntrances)gsap.from('.cv-row',{y:reduced?0:24,opacity:0,stagger:.08,duration:reduced?.15:1,scrollTrigger:{trigger:document.querySelector('#experience'),start:'top 80%',once:true}})});
 sectionContext('#contact',()=>{if(!reduced)gsap.timeline({scrollTrigger:{trigger:document.querySelector('.contact'),start:'top 85%',end:'top 15%',scrub:1}}).fromTo('.contact-wash',{clipPath:'circle(0% at 50% 18%)'},{clipPath:'circle(150% at 50% 18%)',duration:1,ease:'power2.inOut'}).from('.contact > :not(.contact-wash)',{opacity:0,y:32,duration:.55,stagger:.06,ease:'power4.out'},.25)});
 contexts.push(gsap.context(()=>artPass({gsap,ScrollTrigger,reduced,persona})));
 cleanupField=startField(document.querySelector('#field'),()=>persona,reduced,epoch===0);
 ScrollTrigger.refresh();
}
function teardown(){cleanupField();contexts.forEach(ctx=>ctx.revert());contexts=[];intro?.kill();}
function applyPersona(next){
 if(!['researcher','engineer'].includes(next))return;
 const focusedKind=document.activeElement?.closest('.persona-switch')?.className.includes('nav-')?'nav':document.activeElement?.closest('.persona-switch')?.className.includes('overlay-')?'overlay':'hero';
 const token=++epoch;switchTimeline?.kill();gsap.killTweensOf(".persona-copy,[data-flip-id]");gsap.killTweensOf(root);intro?.progress(1);intro?.kill();cleanupField.finish?.();
 const scroll=scrollY;const previousGlow=getComputedStyle(root).getPropertyValue('--glow').trim();
 persona=next;document.querySelectorAll('[data-persona-choice]').forEach(b=>{b.setAttribute('aria-checked',String(b.dataset.personaChoice===next));b.tabIndex=b.dataset.personaChoice===next?0:-1});document.cookie=`portfolio-persona=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`
 const url=new URL(location.href);url.searchParams.set('as',next);url.searchParams.delete('ego');history.replaceState(null,'',url);
 const swap=()=>{if(token!==epoch)return;const flipState=Flip.getState('[data-flip-id]:not(.certificate-slot)');teardown();root.dataset.persona=next;resolveContent();render();setupMotion(true);lenis?.resize();window.scrollTo(0,scroll);lenis?.scrollTo(scroll,{immediate:true});if(!reduced){root.style.setProperty('--glow',previousGlow);gsap.to(root,{'--glow':db.accents[next],duration:.6,overwrite:true,onComplete:()=>root.style.removeProperty('--glow')});Flip.from(flipState,{targets:'[data-flip-id]:not(.certificate-slot)',duration:.7,ease:'expo.out',absolute:false});gsap.fromTo('.persona-copy',{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:.55,stagger:.07,overwrite:true,ease:'power4.out'})}else{root.style.removeProperty('--glow');gsap.fromTo('#app',{opacity:.7},{opacity:1,duration:.15})}document.querySelector(`.${focusedKind}-switch [data-persona-choice="${next}"]`)?.focus({preventScroll:true});document.querySelector('#persona-status').textContent=`Showing the ${next} view`;ScrollTrigger.refresh();window.scrollTo(0,scroll)};
 if(reduced){swap();return}switchTimeline=gsap.timeline().to('.persona-copy',{yPercent:-110,opacity:0,duration:.25,stagger:.05,overwrite:true}).call(swap);
}
const overlay=document.querySelector('#mobile-nav'),menu=document.querySelector('.menu');
function closeMenu(){overlay.hidden=true;menu.setAttribute('aria-expanded','false');menu.textContent='Menu +'}
menu.addEventListener('click',()=>{overlay.hidden=!overlay.hidden;menu.setAttribute('aria-expanded',String(!overlay.hidden));menu.textContent=overlay.hidden?'Menu +':'Close −';if(!overlay.hidden)overlay.querySelector('[tabindex="0"]').focus()});
document.addEventListener('click',e=>{const button=e.target.closest('[data-persona-choice]');if(button)applyPersona(button.dataset.personaChoice);if(e.target.closest('#mobile-nav a'))closeMenu();const plate=e.target.closest('[data-cert]');if(plate)openCertificate(Number(plate.dataset.cert),plate)});
document.addEventListener('keydown',e=>{const b=e.target.closest('[role="radio"]');if(b&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();applyPersona(b.dataset.personaChoice==='researcher'?'engineer':'researcher')}if(!overlay.hidden){if(e.key==='Escape'){closeMenu();menu.focus()}if(e.key==='Tab'){const all=[menu,...overlay.querySelectorAll('button[tabindex="0"],a')],idx=all.indexOf(document.activeElement);if(e.shiftKey&&idx===0){e.preventDefault();all.at(-1).focus()}else if(!e.shiftKey&&idx===all.length-1){e.preventDefault();menu.focus()}}}});
let lastScroll=0;addEventListener('scroll',()=>{if(overlay.hidden)gsap.to('header',{yPercent:scrollY>lastScroll&&scrollY>100?-110:0,duration:.35,overwrite:true});lastScroll=scrollY},{passive:true});
const dialog=document.createElement('dialog');dialog.className='certificate-dialog';dialog.setAttribute('aria-labelledby','dialog-title');document.body.append(dialog);
let currentCertificate=0,originPlate,touchStart=0;
function showCertificate(index){currentCertificate=(index+c.certificates.length)%c.certificates.length;const a=c.certificates[currentCertificate];const original=safeURL(a.displayImage||a.image||a.thumbnail);const pdf=safeURL(a.download||a.original);dialog.innerHTML=`<button class="dialog-close mono" type="button">${esc(db.labels.close)} ×</button><div class="dialog-image">${original?`<img src="${esc(original)}" alt="${esc(a.title)}" style="background-image:url('${esc(a.thumbnail||'')}')">`:`<div class="type-plate"><span class="mono">${esc(a.issuer)}</span><span>${esc(a.title)}</span></div>`}</div><h2 id="dialog-title">${esc(a.title)}</h2><div class="mono meta-row">${[a.issuer,a.date,a.credentialId].filter(Boolean).map(v=>`<span>${esc(v)}</span>`).join('')}</div><div class="dialog-links mono">${a.url?link(a.url,db.labels.verify):''}${pdf?link(pdf,db.labels.original):''}</div><div class="dialog-controls"><button type="button" data-step="-1" aria-label="Previous certificate">← ${esc(db.labels.previous)}</button><span class="mono">${String(currentCertificate+1).padStart(2,'0')} / ${c.certificates.length}</span><button type="button" data-step="1" aria-label="Next certificate">${esc(db.labels.next)} →</button></div>`;for(const offset of [-1,1]){const item=c.certificates[(currentCertificate+offset+c.certificates.length)%c.certificates.length];if(item.displayImage||item.image){const img=new Image();img.src=item.displayImage||item.image}}}
function openCertificate(index,plate){if(!c.certificates.length)return;originPlate=plate;showCertificate(index);dialog.showModal();lenis?.stop();document.body.classList.add('dialog-open');gsap.fromTo(dialog,{opacity:0,scale:reduced?1:.96},{opacity:1,scale:1,duration:reduced?.15:.4,ease:'expo.out'});dialog.querySelector('.dialog-close').focus()}
dialog.addEventListener('click',e=>{if(e.target.closest('.dialog-close')||e.target===dialog)dialog.close();const step=e.target.closest('[data-step]');if(step){const val=step.dataset.step;showCertificate(currentCertificate+Number(val));dialog.querySelector(`[data-step="${val}"]`).focus()}});
dialog.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();showCertificate(currentCertificate+(e.key==='ArrowRight'?1:-1));dialog.querySelector('.dialog-close').focus()}});
dialog.addEventListener('touchstart',e=>touchStart=e.changedTouches[0].clientX,{passive:true});dialog.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStart;if(Math.abs(dx)>50)showCertificate(currentCertificate+(dx<0?1:-1))},{passive:true});
dialog.addEventListener('close',()=>{lenis?.start();document.body.classList.remove('dialog-open');originPlate?.focus({preventScroll:true})});
function previewCaption(e){const plate=e.target.closest('[data-cert]');if(plate){const a=c.certificates[Number(plate.dataset.cert)];document.querySelector('.certificate-caption').replaceChildren(...[`${String(Number(plate.dataset.cert)+1).padStart(2,'0')} / ${c.certificates.length}`,a.title,a.issuer,a.date].filter(Boolean).map(v=>{const el=document.createElement('span');el.textContent=v;return el}));}}
document.addEventListener('pointerover',previewCaption);
document.addEventListener('focusin',previewCaption);
resolveContent();
// Initial DOM comes from Django. Measure only after fonts and final text exist.
let ready=false,rebuildTimer;
function rebuild(){if(!ready)return;const y=scrollY;teardown();setupMotion(true);ScrollTrigger.refresh();lenis?.resize();window.scrollTo(0,y)}
document.fonts.ready.then(()=>{ready=true;setupMotion();});
addEventListener('load',()=>document.fonts.ready.then(()=>ScrollTrigger.refresh()),{once:true});
addEventListener('resize',()=>{clearTimeout(rebuildTimer);rebuildTimer=setTimeout(rebuild,160)});
// Certificate geometry comes from stored ratios; image loads never rebuild pins.
