/* The visitor controls the pace. All content remains readable without this layer. */
(() => {
 'use strict'; const N=window.Nori; if(!N)return;
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const stage=$('#noriStage'), figure=$('.stage-character'), dock=$('.guide-dock'), avatar=$('#guideAvatar');
 const seen=new Set(); let introductionsOff=false, introduced=false, active='', settle, speaking, release, lastRole, extra=false, lastScroll=scrollY, pendingFrame=false;
 const path=()=>extra?'all':N.state.role==='researcher'?'research':N.state.role==='recruiter'?'job':'all';
 const colour=()=>path()==='research'?'red':path()==='job'?'blue':'gold';
 const eligible=b=>b.dataset.proofPath!=='unavailable'&&(path()==='all'||b.dataset.proofPath==='both'||b.dataset.proofPath===path());
 // Choose a purpose before the first milestone, without adding another long section.
 const chooser=document.createElement('div');chooser.className='arrival-choices';chooser.innerHTML='<p class="eyebrow">WHAT BRINGS YOU HERE?</p>';
 chooser.append($('.paths'));$('.hero').append(chooser);
 const scenes=$$('section[data-room]');
 const originalHero=$('.hero-description').textContent;
 const descriptions={
  journey:['THE MILESTONES','These are Shahzan’s big moments: competition awards, training, and community work. Collect the proof that catches your eye.','proud'],
  achievements:['THE CERTIFICATE ARCHIVE','Browse the certificates selected for your path. Open an original, then collect your certificate proof.','curious'],
  research:['THE RESEARCH LAB','Explore how Shahzan turns signals into sight. Play with the dots, read the papers, and collect their proof.','thinking'],
  projects:['THE WORKSHOP','Meet the builds. Filter by technology, launch a project into orbit, and collect proof from the ones on your route.','excited'],
  work:['WORK & INTERNSHIPS','Here are Shahzan’s Huawei internship and Saudi Cast experience. Two different teams, two pieces of proof.','happy'],
  about:['THE HUMAN BEHIND THE WORK','The person behind the projects: his story, education, and skills. Take a moment to meet him.','happy'],
  community:['LEAVE YOUR MARK','You made it! Make your own Nori, add your earned passport, and save a little piece of yourself here.','excited']
 };
 function line(text,mood){
  clearTimeout(speaking);figure.dataset.mood=mood;figure.classList.add('speaking');$('#stageLine').textContent=text;$('#stageNext').hidden=true;
  speaking=setTimeout(()=>{figure.classList.remove('speaking');$('#stageNext').hidden=false;},N.paused?0:Math.min(2300,Math.max(1200,text.length*14)));
 }
 function finish(){
  const from=figure.getBoundingClientRect();
  clearTimeout(speaking);stage.close();document.body.classList.remove('stage-open');
  if(active){seen.add(active);N.visit(active);}
  dock.dataset.corner=String(Math.max(0,scenes.findIndex(s=>s.id===active))%2);
  document.body.classList.add('nori-active');
  const to=dock.getBoundingClientRect();
  if(!N.paused && to.width) dock.animate([{transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width})`,transformOrigin:'top left'},{transform:'none',transformOrigin:'top left'}],{duration:850,easing:'cubic-bezier(.22,1,.36,1)'});
  release=document.activeElement; // dialog restores the caller's focus automatically
 }
 function sectionLine(){const [title,text,mood]=descriptions[active];$('#stageTitle').textContent=title;line(text,mood);$('#stageNext').textContent='Explore this section →';}
 function present(id){
  if(stage.open||document.querySelector('dialog[open]')||N.paused||N.state.quick||introductionsOff||seen.has(id))return;
  active=id;document.body.classList.add('stage-open');stage.showModal();figure.classList.add('walking','waving');
  setTimeout(()=>figure.classList.remove('walking'),900);setTimeout(()=>figure.classList.remove('waving'),2200);
  if(!introduced){$('#stageTitle').textContent='HI, I’M NORI';line('I’m Nori, your tiny guide to Shahzan’s world. I’ll introduce each stop, then leave you to explore. Ready?','happy');$('#stageNext').textContent='Next →';}
  else sectionLine();
 }
 $('#stageNext').addEventListener('click',()=>{if(!introduced){introduced=true;sectionLine();}else finish();});
 $('#skipStage').addEventListener('click',()=>{introduced=true;finish();});
 $('#skipTour').addEventListener('click',()=>{introduced=true;introductionsOff=true;finish();});
 stage.addEventListener('cancel',e=>{e.preventDefault();introduced=true;finish();});
 $('#meetNori').addEventListener('click',()=>{introductionsOff=false;seen.delete('journey');N.travel('journey');introduced=false;schedule();});
 $('#motionToggle').addEventListener('click',()=>{if(stage.open)finish();});
 function tick(){
  pendingFrame=false;document.body.classList.toggle('nori-active',scrollY>innerHeight*.6);
  if(!N.paused){
   const hero=$('.hero-scene'); if(hero.getBoundingClientRect().bottom>0)hero.style.transform=`translateY(${Math.min(45,scrollY*.08)}px)`;
   $$('.experience-media').forEach(el=>{const r=el.closest('.experience').getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)el.style.transform=`translateY(${Math.max(-22,Math.min(22,(innerHeight/2-r.top)*.055))}px)`;});
   $$('.parallax-mark').forEach(el=>{const r=el.parentElement.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)el.style.transform=`translateY(${Math.max(-80,Math.min(80,(innerHeight/2-r.top)*.12))}px) rotate(${(innerHeight/2-r.top)*.025}deg)`;});
  }
  if(scrollY<70)document.body.classList.remove('header-away');
  else if(Math.abs(scrollY-lastScroll)>14){document.body.classList.toggle('header-away',scrollY>lastScroll);lastScroll=scrollY;}
  const current=scenes.filter(s=>!s.hidden).find(s=>{const r=s.getBoundingClientRect();return r.top<innerHeight*.48&&r.bottom>innerHeight*.5;});
  const id=current?.id;
  if(id!==release){release=id;clearTimeout(settle);if(id)settle=setTimeout(()=>{if(N.paused||N.state.quick||introductionsOff){N.visit(id);return;}present(id);},350);}
 }
 function schedule(){if(!pendingFrame){pendingFrame=true;requestAnimationFrame(tick);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{schedule();drawMap();});
 // Real parallax layers are decorative, never the reading surface.
 scenes.forEach((s,i)=>{const mark=document.createElement('span');mark.className='parallax-mark';mark.setAttribute('aria-hidden','true');mark.textContent=['✳','✦','⌬','✧','◌','✿','♡'][i];s.prepend(mark);});
 let clicks=0,clickTimer;
 avatar.addEventListener('click',()=>{
  dock.dataset.mood='happy';dock.classList.add('nori-smiling');clearTimeout(clickTimer);clicks++;
  if(clicks>=3){clicks=0;for(let i=0;i<7;i++){const heart=document.createElement('span');heart.className='nori-heart';heart.textContent='♥';heart.style.setProperty('--heart-x',`${(i-3)*22}px`);heart.style.animationDelay=`${i*.07}s`;dock.append(heart);setTimeout(()=>heart.remove(),1800);} }
  clickTimer=setTimeout(()=>{clicks=0;dock.classList.remove('nori-smiling');},1200);
 });
 addEventListener('pointermove',e=>{if(N.paused||e.pointerType!=='mouse'||stage.open)return;const r=avatar.getBoundingClientRect();const x=Math.max(-5,Math.min(5,(e.clientX-r.left-r.width/2)/80)),y=Math.max(-4,Math.min(4,(e.clientY-r.top-r.height/2)/80));dock.style.setProperty('--look-x',x+'px');dock.style.setProperty('--look-y',y+'px');dock.style.setProperty('--follow-x',x*2+'px');},{passive:true});
 // Route visibility is shared by the map, project shelf, certificates and proof task.
 function drawMap(){const map=$('.world-map'),svg=$('.map-roads'),r=map.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);const points=$$('.map-node').filter(n=>!n.hidden).map(n=>{const b=$('.node-art',n).getBoundingClientRect();return `${b.left-r.left+b.width/2},${b.top-r.top+b.height/2}`;});$('path',svg).setAttribute('d','M'+points.join(' L'));}
 function applyRoute(){
  if(lastRole!==N.state.role){extra=false;lastRole=N.state.role;}
  const kind=path();document.body.dataset.route=kind;
  $$('[data-research-copy]').forEach(el=>el.hidden=kind==='job');
  $('.hero-description').textContent=kind==='job'?'Explore Shahzan’s work experience, projects, achievements, and technical skills.':originalHero;
  $('#research').hidden=kind==='job';$('#work').hidden=kind==='research';
  $$('a[href="#research"]').forEach(a=>a.hidden=kind==='job');$$('a[href="#work"]').forEach(a=>a.hidden=kind==='research');
  const stops=scenes.filter(s=>!s.hidden).map(s=>s.id);N.routes[N.state.role||'explorer']=stops;
  $('#routeTitle').textContent=kind==='job'?'Your hiring route':kind==='research'?'Your research route':'The whole world';
  $('#routeEyebrow').textContent='YOUR ROUTE / COLLECT THE PROOF';$('#routeDescription').textContent=kind==='job'?'Work, builds, and achievements. Research is optional at the end.':kind==='research'?'Papers, experiments, and achievements. Internships are optional at the end.':'Every story, every build, every piece of proof.';
  $('#routeSteps').replaceChildren(...stops.map((id,i)=>{const li=document.createElement('li'),b=document.createElement('button');b.textContent=`${String(i+1).padStart(2,'0')} ${N.names[id]}`;b.addEventListener('click',()=>N.travel(id));li.append(b);return li;}));
  $('#progressLabel').textContent=`${stops.filter(id=>N.state.visited.includes(id)).length} / ${stops.length} stops explored`;
  $$('[data-stamp]').forEach(el=>el.hidden=!stops.includes(el.dataset.stamp));
  $('#routeQuests').textContent='Your mission: collect the visible proof cards to earn a '+colour()+' passport.';
  $('#otherPath').hidden=kind==='all';$('#otherPath').textContent=kind==='research'?'Show me the internships ↗':'Show me the research ↗';
  $('#otherPathCopy').textContent=kind==='research'?'You’ve followed the research route. Would you also like to see Shahzan’s internships and work experience?':kind==='job'?'You’ve explored the hiring route. Would you also like to see Shahzan’s research papers?':'All routes are open. Collect your remaining proof to earn the golden passport.';
  filterProjects();document.dispatchEvent(new CustomEvent('nori:route',{detail:kind}));updateProof();drawMap();schedule();
 }
 $('#otherPath').addEventListener('click',()=>{const target=path()==='research'?'work':'research';extra=true;applyRoute();N.travel(target);});
 document.addEventListener('nori:progress',applyRoute);
 $$('[data-role]').forEach(b=>b.addEventListener('click',()=>{extra=false;applyRoute();}));
 // Proof collection is a playful browser-local achievement, not a verified credential.
 function proofButtons(){return $$('[data-proof]').filter(eligible);}
 function updateProof(){
  const buttons=proofButtons(),count=buttons.filter(b=>N.state.proofs.includes(b.dataset.proof)).length;
  $$('[data-proof]').forEach(b=>{const collected=N.state.proofs.includes(b.dataset.proof);b.textContent=collected?'✓ Proof collected':'Collect proof +';b.setAttribute('aria-pressed',String(collected));b.classList.toggle('collected',collected);});
  const complete=buttons.length>0&&count===buttons.length,c=colour();
  if(complete&&!N.state.passports.includes(c)){N.state.passports.push(c);N.persist();N.toast(`Your ${c} passport is ready. Add it to your Nori!`);document.dispatchEvent(new CustomEvent('nori:celebrate'));}
  $('#proofProgress').textContent=complete?`${c.toUpperCase()} PASSPORT UNLOCKED`:`${count} / ${buttons.length} proofs`;
  $('#passportMessage').textContent=complete?'Passport earned! Wear it with Nori at the end.':`Collect ${buttons.length-count} more proofs to earn your ${c} passport.`;
  $('#proofTracker').dataset.passport=c;
  $$('[data-passport-choice]').forEach(b=>b.disabled=b.dataset.passportChoice!=='none'&&!N.state.passports.includes(b.dataset.passportChoice));
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-proof]');if(!b)return;if(!N.state.proofs.includes(b.dataset.proof))N.state.proofs.push(b.dataset.proof);N.persist();updateProof();});
 function nextProof(){const b=proofButtons().find(b=>!N.state.proofs.includes(b.dataset.proof));if(!b){N.travel('community');return;}if(b.closest('.certificate-exhibit')){$('#certificateSearch').value='';$('#certificateSearch').dispatchEvent(new Event('input'));}
 if(b.closest('.project')){$('#projectSearch').value='';$('#projectTag').value='';limit=Infinity;filterProjects();}const paper=b.closest('.paper');if(paper?.hidden)$('[data-status="all"]').click();b.scrollIntoView({behavior:N.paused?'instant':'smooth',block:'center'});b.focus({preventScroll:true});}
 $('#proofNext').addEventListener('click',nextProof);$('#remainingProof').addEventListener('click',nextProof);
 document.addEventListener('nori:companion',e=>{const c=e.detail?.passport;if(c&&c!=='none'&&!N.state.passports.includes(c)){N.state.passports.push(c);N.persist();}updateProof();});
 // A scalable project shelf: search, technology filters and progressive disclosure.
 const cards=$$('.project');let limit=4;
 const tags=[...new Set(cards.flatMap(c=>$$('.tags span',c).map(t=>t.textContent)))].sort();tags.forEach(tag=>{const o=document.createElement('option');o.value=tag;o.textContent=tag;$('#projectTag').append(o);});
 function routeCards(){return cards.filter(c=>path()==='all'||c.dataset.audience==='both'||c.dataset.audience===path());}
 function filterProjects(){const q=$('#projectSearch').value.toLowerCase(),tag=$('#projectTag').value;const visible=routeCards().filter(c=>c.textContent.toLowerCase().includes(q)&&(!tag||$$('.tags span',c).some(t=>t.textContent===tag)));cards.forEach(c=>c.hidden=!visible.slice(0,limit).includes(c));$('#projectCount').textContent=`${visible.length} build${visible.length===1?'':'s'}`;$('#moreProjects').hidden=visible.length<=limit;renderLaunchers();}
 $('#projectSearch').addEventListener('input',()=>{limit=4;filterProjects();});$('#projectTag').addEventListener('change',()=>{limit=4;filterProjects();});$('#moreProjects').addEventListener('click',()=>{limit+=4;filterProjects();});
 const orbit=$('#orbitSky');
 function renderLaunchers(){const available=routeCards();$$('.satellite',orbit).filter(s=>!available.some(c=>c.dataset.projectId===s.dataset.id)).forEach(s=>s.remove());$('#launchProjects').replaceChildren(...available.map(card=>{const b=document.createElement('button');b.textContent='+ '+$('h3',card).textContent;b.addEventListener('click',()=>launch(card));return b;}));}
 function launch(card){if($(`.satellite[data-id="${card.dataset.projectId}"]`,orbit))return;const b=document.createElement('button');b.className='satellite';b.dataset.id=card.dataset.projectId;b.textContent=$('.project-icon',card).textContent;b.setAttribute('aria-label',$('h3',card).textContent);b.title=$('h3',card).textContent;let x=20+Math.random()*60,y=20+Math.random()*60,dragged=false;
  const position=()=>{b.style.left=x+'%';b.style.top=y+'%';};position();orbit.append(b);
  b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);dragged=false;});b.addEventListener('pointermove',e=>{if(!b.hasPointerCapture(e.pointerId))return;dragged=true;const r=orbit.getBoundingClientRect();x=Math.max(9,Math.min(91,(e.clientX-r.left)/r.width*100));y=Math.max(12,Math.min(88,(e.clientY-r.top)/r.height*100));position();});
  b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();x=Math.max(9,Math.min(91,x+(e.key==='ArrowRight'?4:e.key==='ArrowLeft'?-4:0)));y=Math.max(12,Math.min(88,y+(e.key==='ArrowDown'?4:e.key==='ArrowUp'?-4:0)));position();});
  b.addEventListener('click',()=>{if(dragged){dragged=false;return;}$('#projectPreviewTitle').textContent=$('h3',card).textContent;$('#projectPreviewText').textContent=$('p',card).textContent;$('#projectPreview').showModal();});
 }
 $('#resetOrbit').addEventListener('click',()=>$$('.satellite',orbit).forEach(s=>s.remove()));$('#closeProject').addEventListener('click',()=>$('#projectPreview').close());
 // Images stay on the portfolio, including uploaded files and hosted originals.
 $$('[data-image-preview], .experience a:has(img)').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();$('#mediaImage').src=a.href;$('#mediaImage').alt=a.dataset.imagePreview||$('img',a)?.alt||'Portfolio image';$('#mediaTitle').textContent=$('#mediaImage').alt;$('#mediaPreview').showModal();}));
 $('#closeMedia').addEventListener('click',()=>$('#mediaPreview').close());
 $('#resetJourney').addEventListener('click',()=>{seen.clear();introductionsOff=false;introduced=false;extra=false;applyRoute();});
 applyRoute();document.fonts?.ready.then(drawMap);
})();
