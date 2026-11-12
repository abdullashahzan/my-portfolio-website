import test from 'node:test';
import assert from 'node:assert/strict';
import {wordOpacity} from '../reading.js';
import {partitionRows,fitPlate} from '../wall-layout.js';
test('reading edge advances monotonically and reverses with scroll for every word',()=>{
 for(const count of [4,7,12,20]){
  for(let k=0;k<count;k++){
   assert.equal(wordOpacity(100,100,60,k,count),.14);
   assert.equal(wordOpacity(160,100,60,k,count),1);
   assert.ok(wordOpacity(130,100,60,k,count)>=wordOpacity(129,100,60,k,count));
  }
  const start=k=>100+60*k/(count+2);
  for(let k=1;k<count;k++)assert.ok(start(k)>start(k-1));
 }
});
test('wall preserves each record once and greedily balances row widths',()=>{
 for(const count of [1,7,12,29])for(const ratios of [[.7],[1.6],[.7,1.6,1.6]])for(const rows of [2,3]){
  const items=Array.from({length:count},(_,id)=>({id,width:ratios[id%ratios.length]*230}));
  const result=partitionRows(items,rows);
  assert.deepEqual(result.flatMap(r=>r.items.map(i=>i.id)).sort((a,b)=>a-b),items.map(i=>i.id));
  const widths=result.map(r=>r.width);
  assert.ok(Math.max(...widths)-Math.min(...widths)<=Math.max(...items.map(i=>i.width))+14);
 }
});
test('hover fit stays inside viewport, navigation and caption at either edge',()=>{
 for(const width of [768,1280,1366,1440,1920])for(const left of [-40,width-100])for(const ratio of [.7,1.6]){
  const rect={left,top:200,width:200*ratio,height:200};const fit=fitPlate(rect,{width,height:900},90,820);
  const cx=left+rect.width/2+fit.x,cy=300+fit.y;
  assert.ok(cx-rect.width*fit.scale/2>=23.999);
  assert.ok(cx+rect.width*fit.scale/2<=width-23.999);
  assert.ok(cy-rect.height*fit.scale/2>=113.999);
  assert.ok(cy+rect.height*fit.scale/2<=796.001);
 }
});
