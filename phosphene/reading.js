// Pure helpers shared by the animation and its geometry tests.
export function wordOpacity(readingY, top, pitch, index, count) {
  const sweep=(readingY-top)/pitch*(count+2);
  return .14+.86*Math.max(0,Math.min(1,(sweep-index)/3));
}
export function readingHighlight(paragraph,text,ScrollTrigger,reduced){
  paragraph.setAttribute('aria-label',text);
  paragraph.replaceChildren(...text.trim().split(/\s+/).flatMap((word,i)=>{
    const span=document.createElement('span');span.className='reveal-word';span.setAttribute('aria-hidden','true');span.textContent=word;
    return i?[document.createTextNode(' '),span]:[span];
  }));
  if(reduced)return;
  const words=[...paragraph.children];let measured=[];
  const update=()=>{
    const readingY=scrollY+(innerWidth<768?.68:.62)*innerHeight;
    for(const item of measured){const value=wordOpacity(readingY,item.top,item.pitch,item.index,item.count).toFixed(4);if(item.word.style.opacity!==value)item.word.style.opacity=value}
  };
  const measure=()=>{
    const lines=[];
    for(const word of words){const rect=word.getBoundingClientRect(),top=Math.round(rect.top+scrollY);let line=lines.at(-1);if(!line||line.top!==top){line={top,words:[]};lines.push(line)}line.words.push(word)}
    const fallback=parseFloat(getComputedStyle(paragraph).lineHeight);
    measured=lines.flatMap((line,i)=>line.words.map((word,index)=>({word,index,count:line.words.length,top:line.top,pitch:lines[i+1]?lines[i+1].top-line.top:i?line.top-lines[i-1].top:fallback})));
    update();
  };
  const setAll=value=>words.forEach(word=>word.style.opacity=value);
  measure();
  ScrollTrigger.create({trigger:paragraph,start:'top bottom',end:'bottom top',onUpdate:update,onRefresh:measure,onLeave:()=>setAll('1'),onLeaveBack:()=>setAll('.14')});
}
