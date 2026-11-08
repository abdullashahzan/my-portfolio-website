/* Progressive enhancement: original certificates remain available without JavaScript. */
(() => {
 'use strict';
 const N = window.Nori;
 if (!N) return;
 const $ = s => document.querySelector(s);
 const sky = $('.star-sky');
 const points = [[22,25],[49,18],[78,29],[15,52],[48,48],[84,56],[25,78],[55,81],[72,72]];
 let sequence=[], answer=[], round=0, phase='idle', generation=0;
 const status=$('#starStatus'), start=$('#starStart'), replay=$('#starReplay'), hint=$('#starHint');
 const stars=points.map(([x,y],i)=>{
  const b=document.createElement('button'); b.className='memory-star'; b.type='button'; b.textContent=String(i+1); b.setAttribute('aria-label',`Star ${i+1}`); b.style.left=x+'%'; b.style.top=y+'%'; b.disabled=true; sky.append(b);
  b.addEventListener('click',()=>choose(i)); return b;
 });
 function clue(){ $('#starClue').hidden=!hint.checked; $('#starClue').textContent=sequence.length ? 'Sequence: '+sequence.map(i=>i+1).join(' → ') : 'Your sequence will appear here.'; }
 hint.addEventListener('change',clue);
 function trail(){ $('#starTrail').setAttribute('d',answer.length?'M'+answer.map(i=>points[i].join(',')).join(' L'):''); }
 function enable(on){stars.forEach(b=>b.disabled=!on);}
 async function show(){
  const token=++generation; phase='showing'; answer=[]; trail(); enable(false); start.hidden=true; replay.hidden=false; replay.disabled=true;
  stars.forEach(b=>b.classList.remove('lit','selected','miss')); clue();
  if(N.paused){hint.checked=true; clue();}
  status.textContent='Watch the order…';
  for(const i of sequence){
   if(token!==generation)return;
   stars[i].classList.add('lit');
   await new Promise(resolve=>setTimeout(resolve,650));
   stars[i].classList.remove('lit');
   await new Promise(resolve=>setTimeout(resolve,180));
  }
  if(token!==generation)return;
  phase='input';enable(true);replay.disabled=false;status.textContent='Your turn. Select the stars in order. Take your time.';
 }
 function newRound(){
  if(round===3){round=0;document.querySelectorAll('.orbit-progress span').forEach(s=>s.classList.remove('complete'));}
  const pool=[...points.keys()];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  sequence=pool.slice(0,round+3); show();
 }
 function choose(i){
  if(phase!=='input')return;
  if(i!==sequence[answer.length]){stars[i].classList.add('miss');phase='retry';enable(false);status.textContent='A different orbit! Replay the same pattern and try again.';replay.disabled=false;return;}
  answer.push(i);stars[i].classList.add('selected');trail();
  if(answer.length!==sequence.length)return;
  phase='complete';enable(false);round++;document.querySelectorAll('.orbit-progress span')[round-1].classList.add('complete');
  start.hidden=false;replay.hidden=true;
  if(round===3){status.textContent='Constellation complete. You just connected a little universe.'; start.textContent='Explore another sky ↗';N.state.circuit=true;N.persist();N.updateProgress();document.dispatchEvent(new CustomEvent('nori:celebrate'));}
  else{status.textContent=`Round ${round} complete. Ready for ${round+3} stars?`;start.textContent='Next constellation ↗';}
 }
 start.addEventListener('click',newRound);replay.addEventListener('click',show);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='showing'){generation++;stars.forEach(b=>b.classList.remove('lit'));phase='retry';replay.disabled=false;status.textContent='Welcome back. Replay when you’re ready.';}});
 // The exhibit uses the existing admin-managed records and original lightbox.
 const source=$('.collections'), records=[...document.querySelectorAll('.certificate')].map(button=>({button,title:button.dataset.title,src:button.dataset.src,category:button.closest('.collection').dataset.category,date:button.querySelector('.certificate-date')?.textContent||''}));
 if(!records.length)return;
 const exhibit=document.createElement('div');exhibit.className='certificate-exhibit';
 exhibit.innerHTML='<div class="archive-tabs" role="group" aria-label="Certificate collections"></div><div class="archive-stage"><button class="archive-art" aria-label="Inspect original certificate"><span class="archive-mount"><img alt=""></span><span class="archive-inspect">INSPECT ORIGINAL ↗</span></button><div class="archive-copy"><span class="eyebrow">FROM THE PERSONAL ARCHIVE</span><span class="archive-number" aria-hidden="true"></span><p class="archive-category"></p><h3></h3><p class="archive-date"></p><div class="archive-controls"><button type="button" class="icon-button archive-prev" aria-label="Previous exhibit">←</button><span class="archive-position" role="status"></span><button type="button" class="icon-button archive-next" aria-label="Next exhibit">→</button></div></div></div><p class="archive-empty" hidden>No certificates match. Try another search or collection.</p><div class="archive-strip" aria-label="Choose a certificate"></div>';
 source.before(exhibit);source.hidden=true;$('#expandCollections').hidden=true;
 let category='All',filtered=records,index=0;
 const find=s=>exhibit.querySelector(s);
 for(const name of ['All',...new Set(records.map(r=>r.category))]){const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed',String(name===category));b.addEventListener('click',()=>{category=name;filter();});find('.archive-tabs').append(b);}
 function filter(){const query=$('#certificateSearch').value.toLocaleLowerCase();filtered=records.filter(r=>(category==='All'||r.category===category)&&`${r.title} ${r.category}`.toLocaleLowerCase().includes(query));index=0;find('.archive-tabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===category)));render();}
 function render(){
  const item=filtered[index];find('.archive-stage').hidden=!item;find('.archive-empty').hidden=Boolean(item);find('.archive-strip').replaceChildren();if(!item)return;
  const img=find('.archive-mount img');img.src=item.src;img.alt=item.title;img.hidden=!item.src;find('.archive-art').disabled=!item.src;
  find('h3').textContent=item.title;find('.archive-category').textContent=item.category;find('.archive-date').textContent=item.date;find('.archive-number').textContent=String(index+1).padStart(2,'0');find('.archive-position').textContent=`${index+1} / ${filtered.length}`;
  find('.archive-prev').disabled=find('.archive-next').disabled=filtered.length<2;
  filtered.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1).padStart(2,'0');b.title=r.title;b.setAttribute('aria-label',r.title);b.setAttribute('aria-pressed',String(i===index));b.addEventListener('click',()=>{index=i;render();find('.archive-strip').children[i]?.focus({preventScroll:true});});find('.archive-strip').append(b);});
 }
 find('.archive-prev').addEventListener('click',()=>{index=(index-1+filtered.length)%filtered.length;render();});find('.archive-next').addEventListener('click',()=>{index=(index+1)%filtered.length;render();});find('.archive-art').addEventListener('click',()=>filtered[index]?.button.click());$('#certificateSearch').addEventListener('input',filter);render();
})();
