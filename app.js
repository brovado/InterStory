"use strict";
const STORAGE_KEY="interstory.characters.v1";
const FALLBACK=[
["archmage","ARCHMAGE","❄","Rise through the circles of magic.","Frost Mage"],["veilbound","VEILBOUND","🗡","Become the blade between dimensions.","Spatial Assassin"],
["calamity-engine","CALAMITY ENGINE","✴","Evolve beyond existence.","Evolving Sovereign"],["wildsovereign","WILDSOVEREIGN","🐉","Hunt legends. Forge a legacy.","Monster Hunter"],
["dungeon-lord","DUNGEON LORD","🏰","Build the dungeon others fear.","Dungeon Lord"],["spellforge","SPELLFORGE","⚒","Invent magic the world has never seen.","Artificer"],
["beastmaster","BEASTMASTER","🐺","Bond with extraordinary creatures.","Beast Tamer"],["necropolis","NECROPOLIS","☠","Command forces beyond life.","Necromancer"],
["kingmaker","KINGMAKER","♛","Rise from adventurer to sovereign.","Warrior Lord"]
].map(a=>({id:a[0],name:a[1],glyph:a[2],tagline:a[3],archetypes:[a[4]],signature:"Exploration, progression and adventure"}));
let modules=FALLBACK, characters=[],current=null,tab="adventure",chosenModule="wildsovereign";
const el=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>globalThis.crypto?.randomUUID?.()||("ch-"+Date.now()+"-"+Math.random().toString(36).slice(2));
function showToast(message){const t=el("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function validateCharacter(c){return c&&typeof c==="object"&&!Array.isArray(c)&&typeof c.id==="string"&&c.id.length<150&&typeof c.name==="string"&&c.name.length<140&&typeof c.module==="string"&&c.module.length<100&&Number.isInteger(c.turn)&&c.turn>=0&&c.turn<1000000&&Array.isArray(c.history)&&c.history.length<10000}
function load(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");characters=Array.isArray(data)?data.filter(validateCharacter).slice(0,100):[]}catch(_){characters=[];showToast("Saved data could not be read; export a backup if available.")}}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(characters))}catch(_){showToast("Browser storage is full or unavailable. Export your saves now.")}}
function moduleById(id){return modules.find(m=>m.id===id)||{id,name:id.toUpperCase(),glyph:"✦",tagline:"A new legend",archetypes:["Adventurer"],signature:""}}
function home(){current=null;el("hero").classList.remove("hidden");el("roster-section").classList.remove("hidden");el("library-section").classList.add("hidden");el("editor-section").classList.add("hidden");renderHome();scrollTo({top:0,behavior:"smooth"})}
function editor(title,kicker,html){el("hero").classList.add("hidden");el("roster-section").classList.add("hidden");el("library-section").classList.add("hidden");el("editor-section").classList.remove("hidden");el("editor-title").textContent=title;el("editor-kicker").textContent=kicker;el("editor-content").innerHTML=html;scrollTo({top:0,behavior:"smooth"})}
function renderHome(){
el("character-count").textContent=characters.length+" character"+(characters.length===1?"":"s");
el("character-grid").innerHTML=characters.length?characters.map(c=>{const m=moduleById(c.module);return '<button class="tile" data-open="'+esc(c.id)+'"><span class="glyph">'+esc(m.glyph)+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.className)+' · '+esc(m.name)+'</p><small>Turn '+c.turn+' · Open character →</small></button>'}).join(""):'<div class="empty">Your story begins here. Create a character to claim your first save slot.</div>';
el("adventure-grid").innerHTML=modules.map(m=>'<button class="tile" data-new="'+esc(m.id)+'"><span class="glyph">'+esc(m.glyph)+'</span><h3>'+esc(m.name)+'</h3><p>'+esc(m.tagline)+'</p><small>Begin adventure →</small></button>').join("");
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openCharacter(b.dataset.open)));
document.querySelectorAll("[data-new]").forEach(b=>b.addEventListener("click",()=>newCharacter(b.dataset.new)));
}
function field(id,label,value="",type="text",help=""){return '<div class="field"><label for="'+id+'">'+esc(label)+'</label>'+(type==="textarea"?'<textarea id="'+id+'">'+esc(value)+'</textarea>':'<input id="'+id+'" type="'+type+'" value="'+esc(value)+'">')+(help?'<span class="hint">'+esc(help)+'</span>':"")+'</div>'}
function formValue(id){return el(id)?.value.trim()||""}
function newCharacter(moduleId){chosenModule=moduleId||"wildsovereign";const m=moduleById(chosenModule);
editor("Create your character","NEW ADVENTURE",'<div class="columns"><form class="panel" id="create-form"><h3>The beginning of a legend</h3><div class="fields">'+field("name","Character name")+field("species","Species / ancestry","Human")+field("className","Class / archetype",m.archetypes[0])+field("specialization","Specialization / affinity")+'</div>'+field("origin","Origin / background")+field("ambition","Power fantasy / long-term ambition","Become extraordinarily powerful through earned progression","textarea")+field("vision","Custom character vision","", "textarea")+'<div class="row-actions"><button type="submit" class="button gold">Create character</button><button type="button" id="cancel-create" class="button secondary">Cancel</button></div></form><aside class="panel"><h3>'+esc(m.glyph)+" "+esc(m.name)+'</h3><p>'+esc(m.tagline)+'</p><p class="hint">'+esc(m.signature)+'</p><div class="notice">A character is saved locally on this browser. The OpenAI game master is not connected yet.</div></aside></div>');
el("cancel-create").addEventListener("click",home);
el("create-form").addEventListener("submit",e=>{e.preventDefault();const name=formValue("name");if(!name){showToast("Please name your character.");return}if(characters.length>=100){showToast("100 character limit reached; export or delete one.");return}const c={id:uid(),module:chosenModule,name,species:formValue("species"),className:formValue("className"),specialization:formValue("specialization"),origin:formValue("origin"),ambition:formValue("ambition"),vision:formValue("vision"),level:1,xp:0,health:"100/100",mana:"100/100",currency:0,attributes:{STR:10,DEX:10,CON:10,INT:10,WIS:10,CHA:10},equipment:"Starting equipment to be generated",skills:"Starting skills to be generated",quests:"Begin the adventure",story:"Your story has not begun. AI generation will be added in the next milestone.",turn:0,history:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};characters.push(c);persist();showToast("Character created.");openCharacter(c.id)});
}
function openCharacter(id){current=id;tab="adventure";renderCharacter()}
function active(){return characters.find(c=>c.id===current)}
function renderCharacter(){const c=active();if(!c)return home();const m=moduleById(c.module);
const tabs=["adventure","character","journal","save"].map(t=>'<button class="button tab '+(tab===t?"active":"")+'" data-tab="'+t+'">'+t[0].toUpperCase()+t.slice(1)+'</button>').join("");
let content="";
if(tab==="adventure")content='<div class="columns"><div><div class="panel"><h3>Latest story</h3><div class="narrative">'+esc(c.story)+'</div></div><div class="panel"><h3>Next turn directives</h3><div class="notice">This is a legacy local save. Use Play RPG for live AI adventures. This manual editor does not submit turns.</div><div style="height:13px"></div>'+field("objective","Primary objectives, in execution order","","textarea")+field("doctrine","Combat doctrine / preferred abilities")+field("allocation","Attributes / skills / evolution allocation","","textarea")+field("equipmentAction","Equipment / crafting / purchases","","textarea")+field("custom","Custom actions","","textarea")+field("experiment","Experimentation / character direction","","textarea")+'<div class="row-actions"><button class="button gold" id="build-directive">Generate turn directive</button></div><pre class="mono hidden" id="directive-output"></pre><button class="button secondary hidden" id="copy-directive">Copy directive</button></div><div class="panel"><h3>Record resolved turn</h3><p class="hint">Paste the actual result from your AI conversation. Do not record an unresolved directive as a completed turn.</p>'+field("turnStory","What happened this turn?","","textarea")+'<button class="button secondary" id="record-turn">Save completed turn</button></div></div><aside><div class="panel"><h3>'+esc(m.glyph)+" "+esc(m.name)+'</h3><div class="stats"><div class="stat"><small>Level</small><b>'+esc(c.level)+'</b></div><div class="stat"><small>XP</small><b>'+esc(c.xp)+'</b></div><div class="stat"><small>Turn</small><b>'+esc(c.turn)+'</b></div></div></div><div class="panel"><h3>Active quests</h3><div class="narrative">'+esc(c.quests)+'</div></div></aside></div>';
if(tab==="character")content='<form class="panel" id="sheet-form"><h3>Character sheet</h3><div class="fields">'+field("edit-level","Level",c.level,"number")+field("edit-xp","Experience",c.xp,"number")+field("edit-health","Health",c.health)+field("edit-mana","Mana / energy",c.mana)+field("edit-currency","Currency",c.currency,"number")+'</div><h3>Attributes</h3><div class="fields">'+Object.keys(c.attributes||{}).map(k=>field("attr-"+k,k,c.attributes[k],"number")).join("")+'</div>'+field("edit-skills","Skills / evolutions",c.skills,"textarea")+field("edit-equipment","Equipment / inventory",c.equipment,"textarea")+field("edit-quests","Active quests",c.quests,"textarea")+'<button type="submit" class="button gold">Save character sheet</button></form>';
if(tab==="journal")content='<div class="panel"><h3>Adventure journal</h3>'+(c.history.length?c.history.slice().reverse().map(h=>'<details style="border-bottom:1px solid var(--stroke);padding:12px 0"><summary>Turn '+h.turn+' · '+esc(h.date?.slice(0,10)||"")+'</summary><div class="narrative">'+esc(h.story)+'</div></details>').join(""):'<p class="hint">No resolved turns recorded yet.</p>')+'</div>';
if(tab==="save")content='<div class="panel"><h3>Portable character save</h3><p class="hint">Export the save to move it between devices or keep a backup. Do not add private story details to a public GitHub repository.</p><pre class="mono">'+esc(JSON.stringify(c,null,2))+'</pre><div class="row-actions"><button id="export-character" class="button gold">Download character JSON</button><button id="delete-character" class="button danger">Delete character</button></div></div>';
editor(c.name,"CHARACTER · "+m.name+" · TURN "+c.turn,'<div class="tabs">'+tabs+'</div>'+content);
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{tab=b.dataset.tab;renderCharacter()}));
if(tab==="adventure")wireAdventure(c);
if(tab==="character")el("sheet-form").addEventListener("submit",e=>{e.preventDefault();c.level=num(formValue("edit-level"),1);c.xp=num(formValue("edit-xp"));c.currency=num(formValue("edit-currency"));c.health=formValue("edit-health");c.mana=formValue("edit-mana");for(const k of Object.keys(c.attributes||{}))c.attributes[k]=num(formValue("attr-"+k));c.skills=formValue("edit-skills");c.equipment=formValue("edit-equipment");c.quests=formValue("edit-quests");c.updatedAt=new Date().toISOString();persist();showToast("Character sheet saved.");renderCharacter()});
if(tab==="save"){el("export-character").addEventListener("click",()=>download(c.name+"-save.json",JSON.stringify({version:1,characters:[c]},null,2)));el("delete-character").addEventListener("click",()=>{if(!confirm('Permanently delete '+c.name+' from this browser? Export first if you need a backup.'))return;characters=characters.filter(x=>x.id!==c.id);persist();home();showToast("Character deleted.")})}
}
function num(v,min=0){let n=Number(v);return Number.isFinite(n)?Math.max(min,Math.floor(n)):min}
function wireAdventure(c){
el("build-directive").addEventListener("click",()=>{const directive=[c.module.toUpperCase()+" — TURN "+(c.turn+1)+" DIRECTIVES","Character: "+c.name,"Primary objectives (in order):",formValue("objective")||"Continue the current story.","Combat doctrine / preferred abilities: "+(formValue("doctrine")||"Use established abilities intelligently."),"Attribute / mastery / evolution investments: "+(formValue("allocation")||"Defer spending."),"Equipment / purchases: "+(formValue("equipmentAction")||"No changes."),"Custom actions: "+(formValue("custom")||"None."),"Experimentation / character direction: "+(formValue("experiment")||"None."),"Resolve the turn, reconcile persistent state, award earned progression and present next interactive directives."].join("\n");el("directive-output").textContent=directive;el("directive-output").classList.remove("hidden");el("copy-directive").classList.remove("hidden")});
el("copy-directive").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(el("directive-output").textContent);showToast("Directive copied.")}catch(_){showToast("Clipboard unavailable. Select and copy the text above.")}});
el("record-turn").addEventListener("click",()=>{const story=formValue("turnStory");if(!story){showToast("Paste a resolved story result first.");return}if(!confirm("Record this as completed Turn "+(c.turn+1)+"?"))return;c.turn++;c.story=story;c.history.push({turn:c.turn,date:new Date().toISOString(),story});c.updatedAt=new Date().toISOString();persist();showToast("Turn "+c.turn+" saved.");renderCharacter()});
}
function download(name,content){const blob=new Blob([content],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name.replace(/[^a-z0-9_.-]/gi,"-");document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportAll(){download("interstory-saves.json",JSON.stringify({version:1,exportedAt:new Date().toISOString(),characters},null,2))}
async function importSaves(file){if(!file)return;if(file.size>2_000_000){showToast("Import file exceeds 2 MB.");return}try{const d=JSON.parse(await file.text());if(d.version!==1||!Array.isArray(d.characters)||d.characters.length>100||!d.characters.every(validateCharacter))throw Error("Invalid save format");const merged=new Map(characters.map(c=>[c.id,c]));for(const c of d.characters)merged.set(c.id,c);if(merged.size>100)throw Error("Too many characters");if(!confirm("Import "+d.characters.length+" save(s)? Matching character IDs will be replaced."))return;characters=[...merged.values()];persist();home();showToast("Imported "+d.characters.length+" character save(s).")}catch(e){showToast("Import failed: "+e.message)}finally{el("import-file").value=""}}
function init(){load();el("new-character-top").addEventListener("click",()=>document.getElementById("open-rpg").click());el("back-home").addEventListener("click",home);el("export-all").addEventListener("click",exportAll);el("import-file").addEventListener("change",e=>importSaves(e.target.files?.[0]));renderHome();fetch("./adventures.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(Array.isArray(data)&&data.length&&data.every(m=>m&&typeof m.id==="string"&&Array.isArray(m.archetypes))){modules=data;if(!current)renderHome()}}).catch(()=>{});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();


(function setupBackendConnection(){
  let token="";
  const tokenKey="interstory.backend.token";
  const api="https://api.github.com/repos/brovado/InterStoryBackend";
  const button=document.createElement("button");
  button.className="button secondary";
  button.textContent="Connect Backend";
  document.querySelector(".topbar .actions").append(button);
  const testButton=document.createElement("button");testButton.className="button gold";testButton.textContent="Test AI Turn";document.querySelector(".topbar .actions").append(testButton);
  const dialog=document.createElement("dialog");
  dialog.style.cssText="background:#151e2c;color:#edf0f8;border:1px solid #344156;border-radius:12px;padding:24px;width:min(460px,90vw)";
  dialog.innerHTML='<h2>Connect private backend</h2><p>Enter your fine-grained GitHub token. Choose how long this device should remember your connection. Persistent storage is accessible to scripts running on this site.</p><div class="field"><label for="backend-token">GitHub access token</label><input id="backend-token" type="password" autocomplete="off" spellcheck="false"></div><div class="field"><label for="backend-mode">Remember connection</label><select id="backend-mode"><option value="temporary">Temporary — until refresh</option><option value="session">Session — survive refresh</option><option value="device">Remember this device — until disconnect</option></select></div><p id="backend-status" role="status"></p><div class="row-actions"><button class="button gold" id="backend-connect">Connect</button><button class="button secondary" id="backend-close">Close</button><button class="button secondary" id="backend-disconnect">Disconnect</button></div>';
  document.body.append(dialog);
  const input=dialog.querySelector("#backend-token"), status=dialog.querySelector("#backend-status"), connect=dialog.querySelector("#backend-connect");
  function clearStored(){try{localStorage.removeItem(tokenKey);sessionStorage.removeItem(tokenKey)}catch(_) {}}
  function reset(){clearStored();token="";document.querySelector(".topbar .pill").textContent="AI DISCONNECTED";input.value="";button.textContent="Connect Backend";status.textContent="Disconnected";}
  button.addEventListener("click",()=>{input.value="";dialog.showModal()});
  dialog.querySelector("#backend-close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>{input.value=""});
  dialog.querySelector("#backend-disconnect").addEventListener("click",reset);
  testButton.addEventListener("click",async()=>{
    if(!token){showToast("Connect Backend first.");return;}
    const directive=prompt("Test directive (does not modify characters):","Explore the ruined tower and investigate its magic.");
    if(!directive||!confirm("Generate one paid AI test turn?"))return;
    const credential=token, id=uid();
    const headers={Authorization:"Bearer "+credential,Accept:"application/vnd.github+json","Content-Type":"application/json"};
    testButton.disabled=true;
    try{
      testButton.textContent="Submitting...";
      const response=await fetch(api+"/actions/workflows/smoke-test.yml/dispatches",{method:"POST",headers,redirect:"error",body:JSON.stringify({ref:"main",inputs:{directive:directive.slice(0,4000),request_id:id}})});
      if(!response.ok)throw Error("Dispatch HTTP "+response.status);
      testButton.textContent="Generating...";
      for(let i=0;i<90;i++){
        await new Promise(resolve=>setTimeout(resolve,4000));
        if(token!==credential)throw Error("Disconnected; submitted workflow may still finish.");
        const result=await fetch(api+"/contents/test-results/"+encodeURIComponent(id)+".json",{headers,cache:"no-store",redirect:"error"});
        if(result.status===404)continue;
        if(!result.ok)throw Error("Result HTTP "+result.status);
        const file=await result.json();
        const data=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,"")),c=>c.charCodeAt(0))));
        const output=document.createElement("dialog");
        output.style.cssText="background:#151e2c;color:#edf0f8;border:1px solid #344156;border-radius:12px;padding:24px;width:min(700px,90vw);max-height:85vh;overflow:auto";
        const heading=document.createElement("h2");heading.textContent="AI test result";
        const story=document.createElement("div");story.className="narrative";story.textContent=data.proposal.narrative;
        const details=document.createElement("div");renderDynamicDirectives(data.proposal.next_directives,details);
        const close=document.createElement("button");close.className="button gold";close.textContent="Close";close.onclick=()=>output.close();
        output.append(heading,story,details,close);document.body.append(output);output.addEventListener("close",()=>output.remove());output.showModal();return;
      }
      throw Error("Timed out waiting for result. Check GitHub Actions before retrying.");
    }catch(e){showToast(e.message);}
    finally{testButton.disabled=false;testButton.textContent="Test AI Turn";}
  });

  const live=document.createElement("button");live.className="button gold";live.textContent="Play RPG";live.id="open-rpg";document.querySelector(".topbar .actions").append(live);
  const campaignKey="interstory.live.campaigns";
  live.onclick=()=>{
    if(!token){button.click();showToast("Connect your backend, then select Play RPG.");return;}
    const panel=document.createElement("dialog");panel.style.cssText="background:#151e2c;color:#edf0f8;border:1px solid #344156;border-radius:12px;padding:20px;width:min(850px,94vw);max-height:90vh;overflow:auto";
    document.body.append(panel);panel.addEventListener("close",()=>panel.remove());panel.showModal();
    let busy=false;
    const headers=()=>({Authorization:"Bearer "+token,Accept:"application/vnd.github+json","Content-Type":"application/json"});
    const read=async path=>{const r=await fetch(api+"/contents/"+path,{headers:headers(),cache:"no-store",redirect:"error"});if(r.status===404)return null;if(!r.ok)throw Error("GitHub HTTP "+r.status);const f=await r.json();return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(f.content.replace(/\s/g,"")),c=>c.charCodeAt(0))));};
    const roster=()=>{try{return JSON.parse(localStorage.getItem(campaignKey)||"[]")}catch(_){return []}};
    const remember=(id,name)=>{const list=roster().filter(x=>x.id!==id);list.push({id,name});localStorage.setItem(campaignKey,JSON.stringify(list));};
    const make=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
    const btn=(label,fn)=>{const b=make("button",label);b.className="button gold";b.type="button";b.onclick=fn;return b};
    function frame(title){panel.replaceChildren(make("h2",title),btn("Close",()=>panel.close()));}
    async function play(id,turn,directive){
      if(busy||!directive.trim())return;
      if(!confirm("Generate the next paid AI response?"))return;
      busy=true;const request=uid();const credential=token;
      frame("Resolving adventure…");const status=make("p","Submitting to private backend. Keep this window open.");panel.append(status);
      try{
        const response=await fetch(api+"/actions/workflows/play.yml/dispatches",{method:"POST",headers:headers(),redirect:"error",body:JSON.stringify({ref:"main",inputs:{request_id:request,payload:JSON.stringify({campaign_id:id,base_turn:turn,directive})}})});
        if(!response.ok)throw Error("Dispatch HTTP "+response.status);
        status.textContent="The DM is preparing your adventure…";
        for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,4000));if(token!==credential)throw Error("Disconnected");const data=await read("results/"+request+".json");if(data){remember(id,String(data.state.name||data.state.character?.name||roster().find(x=>x.id===id)?.name||"Custom adventure"));display(data);return;}}
        throw Error("Timed out. Resume the campaign before retrying; the workflow may still finish.");
      }catch(e){status.textContent=e.message;panel.append(btn("Return to adventures",homeLive));}finally{busy=false;}
    }
    function display(data){
      frame("Adventure · Turn "+data.turn);
      panel.append(btn("Adventure roster",homeLive));
      const story=make("div",data.narrative);story.className="narrative";story.style.whiteSpace="pre-wrap";panel.append(story);
      const details=document.createElement("details");details.append(make("summary","Character & world state"));const pre=make("pre",JSON.stringify(data.state,null,2));pre.style.whiteSpace="pre-wrap";pre.style.overflowWrap="anywhere";details.append(pre);panel.append(details);
      renderDynamicDirectives(data.next_directives,panel,(directive)=>play(data.campaign_id,data.turn,directive));
    }
    function homeLive(){
      if(busy)return;frame("Create your own adventure");
      const vision=document.createElement("textarea");vision.rows=7;vision.style.width="100%";vision.placeholder="Describe your world, character concept, power fantasy, mechanics and preferred gameplay…";
      panel.append(vision,btn("Generate character creation",()=>{if(!vision.value.trim())return;const id=uid();remember(id,vision.value.slice(0,60));play(id,-1,vision.value);}),make("h3","Resume adventures"));
      for(const item of roster())panel.append(btn(item.name,async()=>{try{const data=await read("campaigns/"+item.id+".json");if(data)display(data);else showToast("No completed turn yet. Check GitHub Actions.")}catch(e){showToast(e.message)}}));
    }
    homeLive();
  };

  async function authenticate(candidate,mode){
    input.value="";
    if(!candidate){status.textContent="Enter your token first.";return;}
    connect.disabled=true;status.textContent="Checking private repository access...";
    try{
      const response=await fetch(api+"/contents/test-results/latest.json",{headers:{Authorization:"Bearer "+candidate,Accept:"application/vnd.github+json"},cache:"no-store",redirect:"error"});
      if(!response.ok)throw Error("GitHub returned HTTP "+response.status);
      const result=await response.json();
      if(result.type!=="file")throw Error("Unexpected repository response");
      token=candidate;document.querySelector(".topbar .pill").textContent="AI CONNECTED";clearStored();try{if(mode==="device")localStorage.setItem(tokenKey,token);if(mode==="session")sessionStorage.setItem(tokenKey,token)}catch(_){showToast("Connection works, but browser storage is unavailable.")}button.textContent="Backend connected";status.textContent="Connected. Private result access verified. Browser generation test is available.";
    }catch(e){reset();status.textContent="Connection failed: "+e.message;}
    finally{connect.disabled=false;}
  }
  connect.addEventListener("click",()=>authenticate(input.value.trim(),dialog.querySelector("#backend-mode").value));
  try{const saved=localStorage.getItem(tokenKey), session=sessionStorage.getItem(tokenKey);if(saved||session){const mode=saved?"device":"session";dialog.querySelector("#backend-mode").value=mode;authenticate(saved||session,mode);}}catch(_){}
})();

function renderDynamicDirectives(groups, host, onSubmit){
  const form=document.createElement("form");
  const readers=[];
  const add=(label,type,options=[])=>{
    const wrap=document.createElement("div");wrap.className="field";
    const title=document.createElement("label");title.textContent=label;wrap.append(title);
    let control;
    if(type==="single_select"||type==="multi_select"){
      control=document.createElement("select");control.multiple=type==="multi_select";
      if(!control.multiple){const blank=document.createElement("option");blank.value="";blank.textContent="Defer";control.append(blank);}
      for(const option of options.slice(0,20)){const o=document.createElement("option");o.value=String(option.value??option.label??"");o.textContent=String(option.label??option.value??"")+(option.effect?" — "+option.effect:"");control.append(o);}
    }else{control=document.createElement(type==="textarea"?"textarea":"input");if(type==="number")control.type="number";else if(type==="boolean")control.type="checkbox";}
    control.id="dynamic-"+uid();title.htmlFor=control.id;wrap.append(control);form.append(wrap);
    readers.push(()=>[label,control.multiple?Array.from(control.selectedOptions,o=>o.value).join("; "):type==="boolean"?String(control.checked):control.value]);
  };
  for(const group of groups.slice(0,12)){
    if(!group||typeof group!=="object")continue;
    const label=String(group.label??group.title??group.id??"Actions");
    if(Array.isArray(group.fields)){for(const f of group.fields.slice(0,12)){if(!f||!["text","textarea","number","boolean","single_select","multi_select"].includes(f.type))continue;add(label+" / "+String(f.label??f.id),f.type,Array.isArray(f.options)?f.options.filter(o=>o&&typeof o==="object"):[]);}}
    else if(Array.isArray(group.options)&&group.options.length)add(label,"single_select",group.options.filter(o=>o&&typeof o==="object"));
  }
  add("Custom actions","textarea");add("Experimentation","textarea");
  const preview=document.createElement("pre");preview.className="mono";
  const submit=document.createElement("button");submit.className="button gold";submit.type="submit";submit.textContent=onSubmit?"Resolve next turn":"Build next directive";
  form.append(submit,preview);form.addEventListener("submit",e=>{e.preventDefault();preview.textContent=readers.map(read=>read()).filter(([,v])=>v!=="").map(([k,v])=>k+": "+v).join("\n");if(onSubmit)onSubmit(preview.textContent,submit);});
  host.append(form);
}
