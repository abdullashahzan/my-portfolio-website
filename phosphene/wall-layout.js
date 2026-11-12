export const WALL_SPEED=1.2;
export function partitionRows(items,count){
  const rows=Array.from({length:count},()=>({width:0,items:[]}));
  for(const item of items){const row=rows.reduce((best,next)=>next.width<best.width?next:best);row.items.push(item);row.width+=item.width+(row.items.length>1?14:0)}
  return rows;
}
export function fitPlate(rect,viewport,navBottom,captionTop){
  const left=24,right=viewport.width-24,top=Math.max(24,navBottom+24),bottom=Math.min(viewport.height-24,captionTop-24);
  const availableWidth=Math.min(.7*viewport.width,960,right-left),availableHeight=Math.max(1,Math.min(viewport.height-navBottom-80,bottom-top));
  const scale=Math.min(availableWidth/rect.width,availableHeight/rect.height);
  const width=rect.width*scale,height=rect.height*scale;
  const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
  return {scale,x:Math.max(left+width/2,Math.min(right-width/2,cx))-cx,y:Math.max(top+height/2,Math.min(bottom-height/2,cy))-cy};
}
