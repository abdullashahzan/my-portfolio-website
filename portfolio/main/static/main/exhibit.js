/* Progressive enhancement: original certificates remain available without JavaScript. */
(() => {
 'use strict';
 const N = window.Nori;
 if (!N) return;
 const $ = s => document.querySelector(s);
 // The exhibit uses the existing admin-managed records and original lightbox.
 const source=$('.collections'), records=[...document.querySelectorAll('.certificate')].map(button=>({button,title:button.dataset.title,src:button.dataset.src,category:button.closest('.collection').dataset.category,date:button.querySelector('.certificate-date')?.textContent||'',order:Number(button.dataset.order)||0}));
 records.sort((a,b)=>a.order-b.order);
 if(!records.length)return;
 const exhibit=document.createElement('div');exhibit.className='certificate-exhibit';
 exhibit.innerHTML='<div class="archive-tabs" role="group" aria-label="Certificate collections"></div><div class="archive-stage"><button class="archive-art" aria-label="Inspect original certificate"><span class="archive-mount"><img alt=""></span><span class="archive-inspect">INSPECT ORIGINAL ↗</span></button><div class="archive-copy"><span class="eyebrow">FROM THE PERSONAL ARCHIVE</span><span class="archive-number" aria-hidden="true"></span><p class="archive-category"></p><h3></h3><p class="archive-date"></p><div class="archive-controls"><button type="button" class="icon-button archive-prev" aria-label="Previous exhibit">←</button><span class="archive-position" role="status"></span><button type="button" class="icon-button archive-next" aria-label="Next exhibit">→</button></div></div></div><p class="archive-empty" hidden>No certificates match. Try another search or collection.</p><label class="archive-picker">Jump to certificate<select aria-label="Choose a certificate"></select></label>';
 source.before(exhibit);source.hidden=true;$('#expandCollections').hidden=true;
 let category='All',filtered=records,index=0;
 const find=s=>exhibit.querySelector(s);
 for(const name of ['All',...new Set(records.map(r=>r.category))]){const b=document.createElement('button');b.type='button';b.textContent=name.includes('King Abdullah University')?'KAUST':name;b.dataset.category=name;b.title=name;b.setAttribute('aria-pressed',String(name===category));b.addEventListener('click',()=>{category=name;filter();});find('.archive-tabs').append(b);}
 function filter(){const query=$('#certificateSearch').value.toLocaleLowerCase();filtered=records.filter(r=>(category==='All'||r.category===category)&&`${r.title} ${r.category}`.toLocaleLowerCase().includes(query));index=0;find('.archive-tabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));render();}
 function render(){
  const item=filtered[index];find('.archive-stage').hidden=!item;find('.archive-empty').hidden=Boolean(item);find('.archive-picker select').replaceChildren();if(!item)return;
  const img=find('.archive-mount img');img.src=item.src;img.alt=item.title;img.hidden=!item.src;find('.archive-art').disabled=!item.src;
  find('h3').textContent=item.title;find('.archive-category').textContent=item.category;find('.archive-date').textContent=item.date;find('.archive-number').textContent=String(index+1).padStart(2,'0');find('.archive-position').textContent=`${index+1} / ${filtered.length}`;
  find('.archive-prev').disabled=find('.archive-next').disabled=filtered.length<2;
  filtered.forEach((r,i)=>find('.archive-picker select').add(new Option(`${i+1}. ${r.title}`,String(i),false,i===index)));

 }
 find('.archive-picker select').addEventListener('change',e=>{index=Number(e.target.value);render();});
 find('.archive-prev').addEventListener('click',()=>{index=(index-1+filtered.length)%filtered.length;render();});find('.archive-next').addEventListener('click',()=>{index=(index+1)%filtered.length;render();});find('.archive-art').addEventListener('click',()=>filtered[index]?.button.click());$('#certificateSearch').addEventListener('input',filter);render();
})();
