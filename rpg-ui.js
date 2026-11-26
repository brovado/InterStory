"use strict";
window.InterStoryUI=(()=>{
const E=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];
const nameOf=v=>typeof v==="string"?v:typeof v==="number"?String(v):v&&typeof v==="object"?String(v.name||v.title||v.label||v.id||"Item"):"";
const val=v=>Number.isFinite(Number(v))?Number(v):null;
function identity(state){
  const c=obj(state.character),base=Object.keys(c).length?c:obj(state);
  return {c:base,name:nameOf(base.name||base.character_name||"Unnamed character"),level:base.level??base.rank??null,archetype:base.archetype||base.class||base.className||base.combat_style||base.power_tier||"",species:base.species||base.race||base.ancestry||"",location:base.status?.location||state.world?.current_location||state.location||""};
}
function resources(c){
 const result=[],seen=new Set();
 const add=(label,current,max)=>{const a=val(current),b=val(max);if(a===null||b===null||b<=0||seen.has(label.toLowerCase()))return;seen.add(label.toLowerCase());result.push({label,current:a,max:b})};
 for(const [k,v] of Object.entries(obj(c.resources))){const x=obj(v);add(k,x.current??x.value??x.amount,x.maximum??x.max??x.capacity);}
 const d=obj(c.derived);
 for(const pair of [["Health",["hp_current","health_current"],["hp_max","health_max"]],["Mana",["mana_current"],["mana_max"]],["Stamina",["stamina_current"],["stamina_max"]],["Essence",["essence_current"],["essence_max"]]]){
  let cur=pair[1].map(k=>d[k]??c[k]).find(x=>x!==undefined);let max=pair[2].map(k=>d[k]??c[k]).find(x=>x!==undefined);add(pair[0],cur,max);
 }
 if(val(c.xp)!==null&&val(c.xp_to_next)!==null)add("Experience",c.xp,c.xp_to_next);
 return result;
}
function attributes(c){const a=obj(c.attributes),values=obj(a.values);return Object.entries(Object.keys(values).length?values:a).filter(([,v])=>typeof v==="number").map(([name,value])=>({name,value,modifier:obj(a.modifiers)[name]}));}
function registryDefinitions(data,kind){return obj(obj(data.registry)[kind]);}
function collectAbilities(c){return [...arr(c.abilities),...arr(c.feats_and_abilities),...arr(c.spells),...arr(c.talents)].filter(x=>x!==null&&x!==undefined);}
function collectEquipment(c){const eq=c.equipment??c.inventory;if(Array.isArray(eq))return eq;if(typeof eq==="string")return [eq];const value=obj(eq),items=[];for(const [k,v] of Object.entries(value)){if(["gold","currency","coins","market_offers","notes"].includes(k))continue;if(typeof v==="string")items.push({name:v,id:k});else if(typeof v==="number")items.push({name:k,quantity:v,id:k});else if(Array.isArray(v))for(const item of v)items.push(item);else if(v&&typeof v==="object")for(const [sub,number] of Object.entries(v)){if(typeof number==="number")items.push({name:sub,quantity:number,id:sub});}}return items;}
function registryCard(item,defs,kind){const id=obj(item).id;const definition=obj(defs[id]);const x=typeof item==="object"?item:{name:nameOf(item)};const wrap=E("article","registry-item"),heading=E("strong",null,definition.name||nameOf(item));wrap.append(heading);const description=definition.description||x.description;if(description)wrap.append(E("p","muted",description));const facts=[];for(const key of ["mastery","level","rank","quantity","durability","charges","equipped","available"]){if(x[key]!==undefined&&typeof x[key]!=="object")facts.push(key+": "+x[key]);}if(facts.length)wrap.append(E("small","muted",facts.join(" · ")));return wrap;}
function section(title){const s=E("section","rpg-panel");s.append(E("h3",null,title));return s;}
function dashboard(data,host){
 const state=obj(data.state),{c,name,level,archetype,species,location}=identity(state),shell=E("section","rpg-dashboard");
 const top=E("div","rpg-identity");const left=E("div");left.append(E("h2",null,name),E("p","muted",[species,archetype,level!==null?"Level "+level:null].filter(Boolean).join(" · ")));if(location)left.append(E("small","muted","Location: "+location));top.append(left);shell.append(top);
 const stats=resources(c),a=attributes(c),abilities=collectAbilities(c),equipment=collectEquipment(c);
 if(stats.length){const card=section("Resources");const grid=E("div","rpg-resource-grid");for(const stat of stats){const item=E("div","resource-item"),line=E("div","resource-line");line.append(E("span",null,stat.label),E("strong",null,stat.current+" / "+stat.max));const track=E("div","resource-track"),fill=E("div","resource-fill");fill.style.width=Math.max(0,Math.min(100,100*stat.current/stat.max))+"%";fill.dataset.resource=stat.label.toLowerCase();track.append(fill);item.append(line,track);grid.append(item);}card.append(grid);shell.append(card);}
 if(a.length){const card=section("Attributes"),grid=E("div","attribute-grid");for(const x of a){const tile=E("div","attribute-tile");tile.append(E("small","muted",x.name),E("strong",null,x.value));if(x.modifier!==undefined)tile.append(E("small","muted",(x.modifier>=0?"+":"")+x.modifier));grid.append(tile);}card.append(grid);shell.append(card);}
 const registry=obj(data.registry);
 if(abilities.length||Object.keys(obj(registry.abilities)).length){const card=section("Abilities & mastery");const grid=E("div","registry-grid");const list=abilities.length?abilities:Object.values(obj(registry.abilities));for(const item of list.slice(0,60))grid.append(registryCard(item,obj(registry.abilities),"abilities"));card.append(grid);shell.append(card);}
 if(equipment.length||Object.keys(obj(registry.equipment)).length){const card=section("Equipment & inventory"),grid=E("div","registry-grid");const list=equipment.length?equipment:Object.values(obj(registry.equipment));for(const item of list.slice(0,60))grid.append(registryCard(item,obj(registry.equipment),"equipment"));card.append(grid);const money=c.equipment?.gold??c.gold??c.currency;if(money!==undefined)card.append(E("p","muted","Currency: "+money));shell.append(card);}
 if(!stats.length&&!a.length&&!abilities.length&&!equipment.length){shell.append(E("p","muted","Character details are still being established by the Game Master."));}
 const detail=E("details","rpg-raw");detail.append(E("summary",null,"Full character & world state"));detail.append(E("pre",null,JSON.stringify(state,null,2)));shell.append(detail);host.append(shell);
}
function renderActions(groups,host,onSubmit,turn=0){
 const form=E("form","turn-form"),readers=[],validators=[],queue=[],dedupe=new Set();let queueHost=null;
 const isCreation=turn===0;
 const makeCard=(group)=>{const card=E("section","decision-card"),context=E("div","decision-context"),fields=E("div","decision-controls");context.append(E("h3",null,String(group.label??group.title??"Decisions")));if(group.description)context.append(E("p","muted",group.description));card.append(context,fields);form.append(card);return {context,fields};};
 const filtered=arr(groups).filter(x=>x&&typeof x==="object").slice(0,24);
 function actionish(group,field){if(isCreation)return false;if(!["single_select","multi_select"].includes(field.type))return false;const value=(group.label+" "+field.label).toLowerCase();return !/character creation|heritage|ancestry|origin|appearance|stat allocation|attribute|level up|talent choice|mastery point|mastery allocation|skill upgrade|specialization choice/.test(value);}
 function addQueue(option,groupLabel,selected){
  const id=String(option.value??option.id??option.label??"");if(!id)return;
  const key=groupLabel+"|"+id;if(dedupe.has(key))return;dedupe.add(key);
  const item={key,id,title:String(option.label??id),description:String(option.description??option.effect??""),group:groupLabel};
  const input=E("input");input.type="checkbox";input.checked=selected;const tile=E("label","choice-tile");tile.append(input);
  const copy=E("span");copy.append(E("strong",null,item.title));if(item.description)copy.append(E("small","muted",item.description));tile.append(copy);
  input.addEventListener("change",()=>{const i=queue.findIndex(x=>x.key===key);if(input.checked&&i<0)queue.push(item);else if(!input.checked&&i>=0)queue.splice(i,1);refreshQueue();});
  if(selected)queue.push(item);return tile;
 }
 function addNormal(field,container,allocations,refresh){
  const type=field.type,label=String(field.label??field.id??"Choice"),wrap=E("div","decision-field");
  if(type==="number"&&/points remaining|points available|unspent point/i.test(label))return;
  const title=E("label",null,label);wrap.append(title);if(field.description)wrap.append(E("small","muted",field.description));
  if(type==="single_select"||type==="multi_select"){
   const options=arr(field.options).filter(x=>x&&typeof x==="object").slice(0,40);const list=[];const groupName="g"+Math.random().toString(36).slice(2);
   for(const opt of (type==="single_select"?[{label:"Defer",value:""},...options]:options)){const row=E("label","choice-tile"),radio=E("input");radio.type=type==="single_select"?"radio":"checkbox";radio.name=groupName;radio.value=String(opt.value??opt.label??"");radio.checked=type==="single_select"?(field.default!==undefined?radio.value===String(field.default):radio.value===""):arr(field.default).includes(radio.value);const label=E("span",null,opt.label??opt.value??"");if(opt.description||opt.effect)label.append(E("small","muted",opt.description??opt.effect));row.append(radio,label);wrap.append(row);list.push(radio);}
   readers.push(()=>[label,list.filter(x=>x.checked).map(x=>x.value).filter(Boolean).join("; ")]);
  }else{
   const input=E(type==="textarea"?"textarea":"input");if(type==="number"){input.type="number";input.min=String(field.min??0);if(field.max!==undefined)input.max=String(field.max);input.step="1";input.value=String(field.default??0);allocations.push(input);input.addEventListener("input",refresh);if(Number.isFinite(Number(field.base)))wrap.append(E("small","base-stat", "Current: "+field.base));}
   else if(type==="boolean"){input.type="checkbox";input.checked=field.default===true;}else{if(type!=="textarea")input.type="text";input.value=String(field.default??"");}
   const id="field-"+Math.random().toString(36).slice(2);input.id=id;title.htmlFor=id;wrap.append(input);readers.push(()=>[label,type==="boolean"?(input.checked?"Yes":""):input.value]);
  }container.append(wrap);
 }
 for(const group of filtered){
  const fields=arr(group.fields).length?group.fields:Array.isArray(group.options)?[{label:"Choose action",type:"single_select",options:group.options}]:[];
  const actionFields=fields.filter(f=>f&&actionish(group,f));
  const otherFields=fields.filter(f=>f&&!actionish(group,f));
  if(actionFields.length){const card=makeCard(group);for(const field of actionFields){const section=E("div","decision-field");if(actionFields.length>1)section.append(E("h4",null,field.label??"Actions"));for(const option of arr(field.options)){const value=String(option.value??option.label??"");const selected=Array.isArray(field.default)?field.default.includes(value):String(field.default??"")===value;const tile=addQueue(option,String(group.label??"Adventure"),selected);if(tile)section.append(tile);}card.fields.append(section);}}
  if(otherFields.length){const card=actionFields.length?null:makeCard(group);const hostFields=card?card.fields:form;const allocations=[];const budget=Number.isInteger(group.budget)&&group.budget>=0?group.budget:null;const counter=E("strong","allocation-counter");if(budget!==null){(card?card.context:hostFields).append(counter);}
   function update(){if(budget===null)return;const spent=allocations.reduce((sum,input)=>sum+(Number(input.value)||0),0);counter.textContent=(budget-spent)+" / "+budget+" available";counter.classList.toggle("over-budget",spent>budget);for(const inp of allocations)inp.setCustomValidity(spent>budget?"Exceeds point budget":"");}
   for(const field of otherFields.slice(0,35))if(["text","textarea","number","boolean","single_select","multi_select"].includes(field.type))addNormal(field,hostFields,allocations,update);update();validators.push(()=>allocations.every(x=>x.checkValidity()));
  }
 }
 if(!isCreation){
  const section=E("section","execution-panel");section.append(E("h3",null,"Execution order"),E("p","muted","Select multiple activities above. Move them into the order you want the DM to attempt them; later actions adapt to earlier outcomes."));
  queueHost=E("div","queue-list");section.append(queueHost);
  const queueControls=E("div","row-actions"),addField=E("input");addField.type="text";addField.placeholder="Add a custom action to the queue";addField.maxLength=500;
  const addButton=E("button","button secondary","Add action");addButton.type="button";addButton.addEventListener("click",()=>{const title=addField.value.trim();if(!title)return;queue.push({key:"custom-"+Math.random(),id:title,title,description:"",group:"Custom"});addField.value="";refreshQueue();});queueControls.append(addField,addButton);section.append(queueControls);form.append(section);
 }
 function refreshQueue(){if(!queueHost)return;queueHost.replaceChildren();if(!queue.length){queueHost.append(E("p","muted","No activities selected. You can continue through your other choices or add your own."));return;}queue.forEach((item,i)=>{const row=E("div","queue-item");row.append(E("strong",null,(i+1)+". "),E("span",null,item.title));const up=E("button","queue-arrow","↑"),down=E("button","queue-arrow","↓"),remove=E("button","queue-arrow","×");for(const b of [up,down,remove])b.type="button";up.disabled=i===0;down.disabled=i===queue.length-1;up.onclick=()=>{[queue[i-1],queue[i]]=[queue[i],queue[i-1]];refreshQueue();};down.onclick=()=>{[queue[i+1],queue[i]]=[queue[i],queue[i+1]];refreshQueue();};remove.onclick=()=>{queue.splice(i,1);for(const box of form.querySelectorAll('input[type="checkbox"]')){if(box.closest(".choice-tile")&&box.checked&&box.closest(".choice-tile").textContent.includes(item.title))box.checked=false;}refreshQueue();};row.append(up,down,remove);queueHost.append(row);});}
 refreshQueue();
 const custom=makeCard({label:isCreation?"Additional character direction":"Additional directives",description:"Anything that does not fit the suggested choices."});
 for(const label of [isCreation?"Unique character vision":"Custom character direction","Magical or mechanical experimentation"]){const wrap=E("div","decision-field");wrap.append(E("label",null,label));const area=E("textarea");area.rows=3;wrap.append(area);custom.fields.append(wrap);readers.push(()=>[label,area.value.trim()]);}
 const submit=E("button","button gold",isCreation?"Finalize character":"Execute next turn");submit.type="submit";form.append(submit);
 form.addEventListener("submit",e=>{e.preventDefault();if(!validators.every(x=>x()))return;const ordered=queue.map((x,i)=>(i+1)+". ["+x.group+"] "+x.title+" ("+x.id+")");const settings=readers.map(r=>r()).filter(([,v])=>v!=="").map(([label,v])=>label+": "+v);const directive=[ordered.length?"EXECUTION ORDER:\n"+ordered.join("\n"):"",...settings].filter(Boolean).join("\n\n")||"Continue the adventure while banking unspent points.";onSubmit(directive);});
 host.append(form);
}
return {dashboard,renderActions};
})();
