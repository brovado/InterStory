"use strict";
window.InterStoryScenes=(()=>{
const E=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const A=v=>Array.isArray(v)?v:[];
const str=(v,f="")=>typeof v==="string"||typeof v==="number"?String(v):f;
const n=(v,min,max,f=min)=>typeof v==="number"&&Number.isFinite(v)?Math.max(min,Math.min(max,Math.round(v))):f;
const colors={forest:["#172f37","#446b57","#a6b78a"],mountain:["#26394f","#687d90","#d6d5ca"],city:["#302b46","#74617a","#d6a86c"],dungeon:["#161c29","#424c61","#b99b69"],desert:["#583b38","#b77c50","#f5d49a"],coast:["#193c57","#478b9a","#d6d5ad"],snow:["#30465e","#92b2c5","#eef2ed"],swamp:["#263b33","#65704a","#b3b17b"],cosmic:["#17182e","#514578","#c9a8e4"]};
function artwork(item,campaign){
 const biome=Object.hasOwn(colors,item.biome)?item.biome:"forest",id=str(item.scene_id,str(item.title,"scene")).slice(0,120),key="interstory.art.v1."+campaign+"."+id+"."+biome;
 let url;try{url=localStorage.getItem(key);if(url&&!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(url))url=null}catch(_){}
 if(!url){
  const canvas=E("canvas");canvas.width=900;canvas.height=320;const ctx=canvas.getContext("2d");if(!ctx)return E("p","muted",str(item.description));
  let seed=2166136261;for(const ch of id)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const [dark,mid,light]=colors[biome],g=ctx.createLinearGradient(0,0,0,320);g.addColorStop(0,dark);g.addColorStop(1,mid);ctx.fillStyle=g;ctx.fillRect(0,0,900,320);
  ctx.fillStyle=light;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(130+random()*650,65,30+random()*24,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  for(let layer=0;layer<4;layer++){ctx.fillStyle=layer%2?dark:mid;ctx.globalAlpha=.35+layer*.19;ctx.beginPath();ctx.moveTo(0,320);for(let x=0;x<=940;x+=45)ctx.lineTo(x,105+layer*43+random()*(biome==="mountain"?95:45));ctx.lineTo(900,320);ctx.fill();}
  ctx.globalAlpha=1;ctx.fillStyle=dark;
  for(let i=0;i<23;i++){const x=random()*900,y=240+random()*80,h=35+random()*110;if(["forest","swamp","snow"].includes(biome)){ctx.fillRect(x-3,y-h/2,6,h/2);for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(x,y-h+j*15);ctx.lineTo(x-12-j*7,y-h+40+j*15);ctx.lineTo(x+12+j*7,y-h+40+j*15);ctx.fill();}}else if(["city","dungeon"].includes(biome)){ctx.fillRect(x,y-h,22+random()*36,h);ctx.fillStyle=light;ctx.fillRect(x+8,y-h+15,4,8);ctx.fillStyle=dark;}else if(biome==="cosmic"){ctx.fillStyle=light;ctx.fillRect(x,random()*220,2,2);ctx.fillStyle=dark;}}
  url=canvas.toDataURL("image/png");try{const keys=Object.keys(localStorage).filter(k=>k.startsWith("interstory.art.v1."));while(keys.length>=12)localStorage.removeItem(keys.shift());localStorage.setItem(key,url)}catch(_){}
 }
 const figure=E("figure","scene-art"),img=E("img");img.src=url;img.alt=str(item.description,str(item.title,"Procedural landscape"));img.loading="lazy";figure.append(img,E("figcaption","muted",str(item.title,"Environment")+" · procedural illustration"));return figure;
}
function battlefield(item){
 const w=n(item.width,4,20,10),h=n(item.height,4,20,8),card=E("section","scene-card"),grid=E("div","battle-grid");grid.style.gridTemplateColumns="repeat("+w+",minmax(0,1fr))";grid.style.aspectRatio=w+"/"+h;card.append(E("h3",null,str(item.title,"Battlefield")));
 const terrain=A(item.terrain).slice(0,80),units=A(item.units).slice(0,80),legend=E("div","battle-legend");
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const cell=E("div","battle-cell");const t=terrain.find(t=>t&&Number.isInteger(t.x)&&Number.isInteger(t.y)&&x>=t.x&&y>=t.y&&x<t.x+n(t.w,1,w,1)&&y<t.y+n(t.h,1,h,1));if(t){cell.classList.add("terrain");cell.title=str(t.name,str(t.kind,"Terrain"));cell.textContent=str(t.name,str(t.kind,"#")).slice(0,2);}
 const here=units.filter(u=>u&&u.x===x&&u.y===y);for(const u of here){const side=["player","ally","enemy","neutral"].includes(u.side)?u.side:"neutral",token=E("span","battle-token "+side,str(u.name,"?").slice(0,2));token.title=str(u.name)+" "+str(u.status);cell.append(token);}grid.append(cell);}
 for(const u of units){if(!u)continue;const side=["player","ally","enemy","neutral"].includes(u.side)?u.side:"neutral";legend.append(E("span","legend-"+side,str(u.name,"Unit")+" · "+str(u.status,side)));}
 card.append(grid,legend);return card;
}
function component(item,campaign){
 if(!item||typeof item!=="object")return null;
 if(item.type==="artwork")return artwork(item,campaign);
 if(item.type==="battlefield")return battlefield(item);
 if(!["reward","notification","discovery","encounter"].includes(item.type))return null;
 const card=E("section","scene-card scene-"+item.type);card.append(E("small","scene-kicker",item.type==="reward"?"REWARDS EARNED":item.type.toUpperCase()),E("h3",null,str(item.title,"System update")));if(item.text)card.append(E("p",null,str(item.text)));
 for(const entry of A(item.entries).slice(0,30)){if(!entry)continue;const line=E("div","scene-entry");line.append(E("span",null,str(entry.label)),E("strong",null,str(entry.value)));card.append(line);}
 for(const actor of A(item.actors).slice(0,30)){if(!actor)continue;const line=E("div","scene-actor"),header=E("div","scene-entry");header.append(E("strong",null,str(actor.name,"Unknown")),E("span",null,str(actor.status,str(actor.side))));line.append(header);if(typeof actor.health==="number"&&typeof actor.max_health==="number"&&actor.max_health>0){const track=E("div","resource-track"),fill=E("div","resource-fill");fill.dataset.resource=actor.side==="enemy"?"health":"stamina";fill.style.width=Math.max(0,Math.min(100,100*actor.health/actor.max_health))+"%";track.append(fill);line.append(track,E("small","muted",actor.health+" / "+actor.max_health+" HP"));}card.append(line);}
 return card;
}
function render(data,host){
 const story=E("article","narrative scene-narrative"),parts=str(data.narrative).split(/\n\s*\n/),items=A(data.presentation).slice(0,24);
 for(let i=0;i<parts.length;i++){story.append(E("p",null,parts[i]));for(const item of items.filter(x=>x&&n(x.after,0,parts.length-1,0)===i)){try{const c=component(item,str(data.campaign_id));if(c)story.append(c)}catch(e){console.warn("Optional scene component skipped",e.message)}}}host.append(story);
}
return {render};
})();
