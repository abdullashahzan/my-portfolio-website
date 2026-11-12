import {partitionRows,fitPlate,WALL_SPEED} from './wall-layout';

export function certificateWall({gsap,ScrollTrigger,lenis,reduced,certificates,switched}){
 const stage=document.querySelector('.certificate-stage'),viewport=stage.querySelector('.certificate-viewport'),track=stage.querySelector('.certificate-track'),grid=stage.querySelector('.specimen-grid');
 const slots=[...grid.querySelectorAll('.certificate-slot')].sort((a,b)=>Number(a.dataset.cert)-Number(b.dataset.cert));
 const native=reduced||innerWidth<768||matchMedia('(hover:none)').matches;
 const measured=slots.every(slot=>Number(slot.dataset.ratio)>0);
 const rowCount=native?2:innerHeight<900?2:3;
 const rowHeight=Math.max(150,Math.min(320,(innerHeight-190-14*(rowCount-1))/rowCount));
 stage.style.setProperty('--wall-row-height',`${rowHeight}px`);
 stage.classList.add('wall-enhanced');
 const rows=partitionRows(slots.map(slot=>({slot,width:Number(slot.dataset.ratio)*rowHeight||rowHeight})),rowCount);
 grid.replaceChildren(...rows.map(row=>{const el=document.createElement('div');el.className='wall-row';el.append(...row.items.map(item=>item.slot));return el}));
 const travelDistance=()=>Math.max(0,track.scrollWidth-viewport.clientWidth);
 // Unbackfilled media remains accessible in the native wall. Never guess its
 // aspect ratio or change a pinned track's width after an image downloads.
 const pinned=!native&&measured&&slots.length>=8&&travelDistance()>0;
 stage.classList.toggle('wall-pinned',pinned);
 const progress=stage.querySelector('.wall-progress span'),cue=stage.querySelector('.wall-cue');
 let pan,zoom,activeSlot,candidate,timer,resumeTimer,disposed=false;
 const loadThumbnail=slot=>{const img=slot.querySelector('img[data-src]');if(img){img.src=img.dataset.src;img.removeAttribute('data-src')}};
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){loadThumbnail(entry.target);observer.unobserve(entry.target)}}),{root:pinned?null:viewport,rootMargin:`${innerWidth}px`});
 slots.forEach(slot=>observer.observe(slot));
 const collapse=(immediate=false)=>{
  clearTimeout(timer);if(!zoom)return;
  const old=zoom;zoom=null;activeSlot=null;stage.classList.remove('has-wall-focus');
  gsap.killTweensOf(old);
  if(immediate){old.remove();return}
  gsap.to(old,{scale:1,x:0,y:0,opacity:0,duration:.3,ease:'expo.out',onComplete:()=>old.remove()});
 };
 const speed=()=>Math.abs(pan?.scrollTrigger.getVelocity()||0);
 const enlarge=(slot,keyboard=false)=>{
  if(disposed||native||activeSlot===slot||(!keyboard&&speed()>900)||document.querySelector('dialog[open]'))return;
  collapse(true);loadThumbnail(slot);activeSlot=slot;stage.classList.add('has-wall-focus');
  const rect=slot.getBoundingClientRect();
  const navHeight=document.querySelector('header').getBoundingClientRect().height;
  const caption=stage.querySelector('.certificate-caption').getBoundingClientRect();
  const fit=fitPlate(rect,{width:innerWidth,height:innerHeight},navHeight,caption.top>navHeight?caption.top:innerHeight);
  zoom=slot.querySelector('.specimen').cloneNode(true);zoom.classList.add('wall-zoom');zoom.setAttribute('aria-hidden','true');
  Object.assign(zoom.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,pointerEvents:'none',willChange:'transform'});
  document.body.append(zoom);
  const current=zoom;
  gsap.fromTo(current,{scale:1,x:0,y:0,clipPath:'inset(0)'},{...fit,duration:.45,ease:'expo.out',onComplete:()=>current.style.removeProperty('will-change')});
  const record=certificates[Number(slot.dataset.cert)],source=record.displayImage||record.image;
  if(source){const display=new Image();display.className='zoom-display';display.alt='';display.style.opacity='0';display.onload=()=>{if(current.isConnected)gsap.to(display,{opacity:1,duration:.2})};display.src=source;current.append(display)}
 };
 const intend=slot=>{clearTimeout(timer);candidate=slot;timer=setTimeout(()=>{if(candidate!==slot)return;if(speed()>900){clearTimeout(resumeTimer);resumeTimer=setTimeout(()=>{if(candidate===slot)intend(slot)},120)}else enlarge(slot)},60)};
 const onPointerOver=e=>{const slot=e.target.closest('.certificate-slot');if(slot&&!slot.contains(e.relatedTarget))intend(slot)};
 const onPointerOut=e=>{const slot=e.target.closest('.certificate-slot');if(slot&&!slot.contains(e.relatedTarget)){candidate=null;collapse()}};
 const onKey=e=>{if(e.key==='Escape'){candidate=null;collapse()}};
 const onClick=()=>collapse(true);
 const onFocus=e=>{
  const slot=e.target.closest('.certificate-slot');if(!slot||!slot.matches(':focus-visible'))return;
  if(pinned){const center=slot.getBoundingClientRect().left+slot.offsetWidth/2-track.getBoundingClientRect().left;const x=Math.max(0,Math.min(travelDistance(),center-viewport.clientWidth/2));const y=pan.scrollTrigger.start+x/WALL_SPEED;lenis?lenis.scrollTo(y,{immediate:true}):window.scrollTo(0,y);ScrollTrigger.update()}
  else {const center=slot.getBoundingClientRect().left-viewport.getBoundingClientRect().left+viewport.scrollLeft+slot.offsetWidth/2;viewport.scrollTo({left:center-viewport.clientWidth/2,behavior:'instant'})}
  clearTimeout(timer);timer=setTimeout(()=>enlarge(slot,true),60);
 };
 const onBlur=e=>{if(e.target.closest('.certificate-slot'))collapse()};
 const movement=()=>{
  // Collapse during motion and require fresh intent after it settles. This also
  // prevents a stationary pointer from flashing successive plates on fast pans.
  if(zoom)collapse(true);
  clearTimeout(resumeTimer);
  if(candidate)resumeTimer=setTimeout(()=>{if(candidate?.matches(':hover'))intend(candidate)},180);
 };
 if(pinned){
  pan=gsap.to(track,{x:()=>-travelDistance(),ease:'none',scrollTrigger:{trigger:stage,start:'top top',end:()=>`+=${travelDistance()/WALL_SPEED}`,pin:true,scrub:true,invalidateOnRefresh:true,onUpdate:self=>{progress.style.transform=`scaleX(${self.progress})`;cue.style.opacity=String(Math.max(0,1-self.progress*15));movement()},onRefresh:()=>collapse(true),onLeave:()=>collapse(true),onLeaveBack:()=>collapse(true)}});
  slots.forEach(slot=>gsap.fromTo(slot.querySelector('.specimen'),{clipPath:'inset(0 0 0 100%)',scale:1.06},{clipPath:'inset(0 0 0 0%)',scale:1,duration:.6,ease:'expo.out',scrollTrigger:{trigger:slot,containerAnimation:pan,start:'left right',toggleActions:'play none none reverse'}}));
 }else{
  viewport.addEventListener('scroll',movement,{passive:true});
 }
 if(switched&&!reduced)gsap.fromTo(slots,{opacity:0},{opacity:1,duration:.35,stagger:.025,ease:'none'});
 stage.addEventListener('pointerover',onPointerOver);stage.addEventListener('pointerout',onPointerOut);stage.addEventListener('focusin',onFocus);stage.addEventListener('focusout',onBlur);stage.addEventListener('click',onClick);document.addEventListener('keydown',onKey);
 return ()=>{disposed=true;clearTimeout(timer);clearTimeout(resumeTimer);collapse(true);observer.disconnect();stage.removeEventListener('pointerover',onPointerOver);stage.removeEventListener('pointerout',onPointerOut);stage.removeEventListener('focusin',onFocus);stage.removeEventListener('focusout',onBlur);stage.removeEventListener('click',onClick);document.removeEventListener('keydown',onKey);viewport.removeEventListener('scroll',movement);stage.classList.remove('wall-pinned','wall-enhanced','has-wall-focus')};
}
