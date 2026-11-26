"use strict";
const el=id=>document.getElementById(id);
const uid=()=>globalThis.crypto?.randomUUID?.()||("ch-"+Date.now()+"-"+Math.random().toString(36).slice(2));
function showToast(message){const t=el("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}

(function setupBackendConnection(){
  let token="";
  const tokenKey="interstory.backend.token";
  const api="https://api.github.com/repos/brovado/InterStoryBackend";
  const button=document.createElement("button");
  button.className="button secondary";
  button.textContent="Connect Backend";
  document.querySelector(".topbar .actions").append(button);
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
  const live=document.getElementById("home");
  const campaignKey="interstory.live.campaigns";
  let refreshHome=()=>{};
  let activeBusy=false;
  live.onclick=()=>{
    if(activeBusy)return;
    const panel=document.getElementById("game");
    let busy=false;
    const headers=()=>({Authorization:"Bearer "+token,Accept:"application/vnd.github+json","Content-Type":"application/json"});
    const read=async path=>{const r=await fetch(api+"/contents/"+path,{headers:headers(),cache:"no-store",redirect:"error"});if(r.status===404)return null;if(!r.ok)throw Error("GitHub HTTP "+r.status);const f=await r.json();return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(f.content.replace(/\s/g,"")),c=>c.charCodeAt(0))));};
    const roster=()=>{try{return JSON.parse(localStorage.getItem(campaignKey)||"[]")}catch(_){return []}};
    const remember=(id,name)=>{const list=roster().filter(x=>x.id!==id);list.push({id,name});localStorage.setItem(campaignKey,JSON.stringify(list));};
    const make=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
    const btn=(label,fn)=>{const b=make("button",label);b.className="button gold";b.type="button";b.onclick=fn;return b};
    function frame(title){panel.replaceChildren(make("h2",title));}
    async function play(id,turn,directive){
      if(busy||!directive.trim())return;
      if(!token){button.click();return;}
      if(!confirm("Generate the next paid AI response?"))return;
      busy=true;activeBusy=true;const request=uid();const credential=token;
      frame("Resolving adventure…");const status=make("p","Submitting to private backend. Keep this window open.");panel.append(status);
      try{
        const response=await fetch(api+"/actions/workflows/play.yml/dispatches",{method:"POST",headers:headers(),redirect:"error",body:JSON.stringify({ref:"main",inputs:{request_id:request,payload:JSON.stringify({campaign_id:id,base_turn:turn,directive})}})});
        if(!response.ok)throw Error("Dispatch HTTP "+response.status);
        status.textContent="The DM is preparing your adventure…";
        for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,4000));if(token!==credential)throw Error("Disconnected");const data=await read("results/"+request+".json");if(data){remember(id,String(data.state.name||data.state.character?.name||roster().find(x=>x.id===id)?.name||"Custom adventure"));display(data);return;}}
        throw Error("Timed out. Resume the campaign before retrying; the workflow may still finish.");
      }catch(e){status.textContent=e.message;panel.append(btn("Return to adventures",homeLive));}finally{busy=false;activeBusy=false;}
    }
    function display(data){
      frame("Adventure · Turn "+data.turn);
      panel.append(btn("Adventure roster",homeLive));
      const story=make("div",data.narrative);story.className="narrative";story.style.whiteSpace="pre-wrap";panel.append(story);
      const details=document.createElement("details");details.append(make("summary","Character & world state"));const pre=make("pre",JSON.stringify(data.state,null,2));pre.style.whiteSpace="pre-wrap";pre.style.overflowWrap="anywhere";details.append(pre);panel.append(details);
      renderDynamicDirectives(data.next_directives,panel,(directive)=>play(data.campaign_id,data.turn,directive));
    }
    async function homeLive(){
      if(busy)return;frame("Create your own adventure");
      const creation=document.createElement("form");
      const fields=document.createElement("div");fields.className="fields";creation.append(fields);
      const readers=[];
      const lever=(label,options)=>{
        const wrap=document.createElement("div");wrap.className="field";
        const title=make("label",label),select=document.createElement("select"),custom=document.createElement("input");
        select.id="creation-"+uid();title.htmlFor=select.id;
        for(const value of [...options,"Custom…"]){const o=make("option",value);o.value=value;select.append(o);}
        custom.type="text";custom.placeholder="Your own "+label.toLowerCase();custom.hidden=true;custom.maxLength=300;
        select.onchange=()=>{custom.hidden=select.value!=="Custom…";custom.required=!custom.hidden;if(!custom.hidden)custom.focus();};
        wrap.append(title,select,custom);fields.append(wrap);
        readers.push(()=>label+": "+(select.value==="Custom…"?custom.value.trim():select.value));
      };
      lever("World / setting",["Classic high fantasy","Dark fantasy","Cultivation / ascension","Dungeon and guild fantasy","Magitech fantasy","Monster hunting wilderness","Surprise me"]);
      lever("Character archetype",["Spellcaster / mage","Warrior / weapon master","Rogue / assassin","Summoner / necromancer","Artificer / inventor","Monster / evolving entity","Hybrid / discover my own"]);
      lever("Power progression",["Rapid earned power growth","Steady RPG progression","Evolution and transformations","Research and mastery","Empire / domain building","Surprise me"]);
      lever("Gameplay focus",["Balanced adventure and progression","Combat and dungeon exploration","Magic research and experimentation","Crafting and equipment upgrades","Exploration and discovery","Strategy and autonomous systems"]);
      lever("Starting power",["Promising beginner","Experienced adventurer","Exceptional prodigy","Already powerful","Unusual dormant potential"]);
      lever("Challenge",["Heroic power fantasy","Balanced challenge","Dangerous and tactical","Brutal survival"]);
      lever("Turn complexity",["Balanced — meaningful choices","Compact — fewer choices","Detailed — deeper management"]);
      const nameWrap=document.createElement("div");nameWrap.className="field";const nameLabel=make("label","Character name (optional)");const name=document.createElement("input");name.id="creation-name";nameLabel.htmlFor=name.id;name.placeholder="Let the DM suggest a name";name.maxLength=100;nameWrap.append(nameLabel,name);fields.append(nameWrap);
      const vision=document.createElement("textarea");vision.rows=3;vision.style.width="100%";vision.placeholder="Optional: signature abilities, unusual mechanics, story direction, anything the selections missed…";vision.maxLength=4000;
      const visionLabel=make("label","Additional vision");vision.id="creation-vision";visionLabel.htmlFor=vision.id;
      const generate=make("button","Generate character creation");generate.className="button gold";generate.type="submit";
      creation.append(visionLabel,vision,generate);
      creation.onsubmit=e=>{e.preventDefault();if(!token){button.click();return;}const directive=["Design an interactive character creation form using these preferences as guidance, not rigid restrictions.",...readers.map(read=>read()),"Character name: "+(name.value.trim()||"Suggest one"),"Additional vision: "+(vision.value.trim()||"None")].join("\n");const id=uid();remember(id,name.value.trim()||readers[1]().split(": ").slice(1).join(": "));play(id,-1,directive);};
      panel.append(creation,make("h3","Resume adventures"));
      if(token){try{const response=await fetch(api+"/contents/campaigns",{headers:headers(),cache:"no-store"});if(response.ok){for(const file of await response.json()){if(file.type==="file"&&/^[a-zA-Z0-9-]+\.json$/.test(file.name)){const id=file.name.slice(0,-5);if(!roster().some(x=>x.id===id)){const data=await read("campaigns/"+file.name);if(data)remember(id,String(data.state.name||data.state.character?.name||"Adventure "+id.slice(0,8)));}}}}}catch(e){showToast("Cloud roster unavailable: "+e.message);}}
      if(!panel.contains(vision))return;
      for(const item of roster())panel.append(btn(item.name,async()=>{try{const data=await read("campaigns/"+item.id+".json");if(data)display(data);else showToast("No completed turn yet. Check GitHub Actions.")}catch(e){showToast(e.message)}}));
    }
    refreshHome=homeLive;homeLive();
  };

  async function authenticate(candidate,mode){
    input.value="";
    if(!candidate){status.textContent="Enter your token first.";return;}
    connect.disabled=true;status.textContent="Checking private repository access...";
    try{
      const response=await fetch(api,{headers:{Authorization:"Bearer "+candidate,Accept:"application/vnd.github+json"},cache:"no-store",redirect:"error"});
      if(!response.ok)throw Error("GitHub returned HTTP "+response.status);
      const result=await response.json();
      if(result.full_name!=="brovado/InterStoryBackend")throw Error("Unexpected repository response");
      token=candidate;document.querySelector(".topbar .pill").textContent="AI CONNECTED";clearStored();try{if(mode==="device")localStorage.setItem(tokenKey,token);if(mode==="session")sessionStorage.setItem(tokenKey,token)}catch(_){showToast("Connection works, but browser storage is unavailable.")}button.textContent="Backend connected";status.textContent="Connected. Ready to play.";if(dialog.open)dialog.close();if(!document.getElementById("creation-vision"))refreshHome();
    }catch(e){reset();status.textContent="Connection failed: "+e.message;}
    finally{connect.disabled=false;}
  }
  connect.addEventListener("click",()=>authenticate(input.value.trim(),dialog.querySelector("#backend-mode").value));
  live.click();
  try{const saved=localStorage.getItem(tokenKey), session=sessionStorage.getItem(tokenKey);if(saved||session){const mode=saved?"device":"session";dialog.querySelector("#backend-mode").value=mode;authenticate(saved||session,mode);}}catch(_){}
})();

function renderDynamicDirectives(groups,host,onSubmit){
  const form=document.createElement("form");form.className="turn-form";
  const readers=[], checks=[];
  const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
  function section(group){
    const card=make("section",undefined,"decision-card"),context=make("div",undefined,"decision-context"),controls=make("div",undefined,"decision-controls");
    context.append(make("h3",String(group.label??group.title??"Actions")));
    if(group.description)context.append(make("p",String(group.description)));
    card.append(context,controls);form.append(card);
    const budget=Number.isInteger(group.budget)&&group.budget>=0?group.budget:null;
    const allocations=[];
    const counter=make("strong",undefined,"allocation-counter");
    if(budget!==null)context.append(counter);
    function update(){if(budget===null)return;const spent=allocations.reduce((sum,a)=>sum+Number(a.value||0),0);counter.textContent=(budget-spent)+" / "+budget+" points remaining";counter.classList.toggle("over-budget",spent>budget);for(const a of allocations)a.setCustomValidity(spent>budget?"Allocation exceeds available points":"");}
    function add(f){
      const type=f.type,label=String(f.label??f.id??"Choice"),wrap=make("div",undefined,"decision-field");
      if(/points remaining|remaining points|points available/i.test(label)&&type==="number"){wrap.append(make("p","Available points are shown in the character state; do not enter a balance."));controls.append(wrap);return;}
      wrap.append(make("label",label));if(f.description)wrap.append(make("small",String(f.description)));
      if(type==="single_select"||type==="multi_select"){
        const options=Array.isArray(f.options)?f.options.filter(o=>o&&typeof o==="object").slice(0,30):[];
        const picks=[];const name="pick-"+uid();
        const choices=type==="single_select"?[{label:"Defer",value:""},...options]:options;
        for(const option of choices){const tile=make("label",undefined,"choice-tile"),input=document.createElement("input");input.type=type==="single_select"?"radio":"checkbox";input.name=name;input.value=String(option.value??option.label??"");input.checked=type==="single_select"?(f.default!==undefined?input.value===String(f.default):input.value===""):Array.isArray(f.default)&&f.default.includes(input.value);const copy=make("span",String(option.label??option.value??""));if(option.description||option.effect)copy.append(make("small",String(option.description??option.effect)));tile.append(input,copy);wrap.append(tile);picks.push(input);}
        readers.push(()=>[label,picks.filter(p=>p.checked).map(p=>p.value).join("; ")]);
      }else{
        const input=document.createElement(type==="textarea"?"textarea":"input");input.type=type==="number"?"number":type==="boolean"?"checkbox":"text";input.id="field-"+uid();wrap.firstChild.htmlFor=input.id;
        if(type==="number"){input.step="1";input.min=String(f.min??0);if(f.max!==undefined||budget!==null)input.max=String(f.max??budget);input.value=String(f.default??0);if(budget!==null)allocations.push(input);const total=make("small");if(Number.isFinite(f.base)){wrap.append(total);const refresh=()=>{total.textContent="Current "+f.base+" → "+(f.base+Number(input.value||0));};input.addEventListener("input",refresh);refresh();}input.addEventListener("input",update);}
        else if(type==="boolean")input.checked=f.default===true;else input.value=String(f.default??"");
        wrap.append(input);readers.push(()=>[label,type==="boolean"?(input.checked?"Yes":""):input.value]);
      }
      controls.append(wrap);
    }
    const fields=Array.isArray(group.fields)?group.fields:Array.isArray(group.options)?[{label:"Choose action",type:"single_select",options:group.options}]:[];
    for(const f of fields.slice(0,30))if(f&&["text","textarea","number","boolean","single_select","multi_select"].includes(f.type))add(f);
    update();checks.push(()=>allocations.every(a=>a.checkValidity()));
  }
  for(const g of groups.slice(0,20))if(g&&typeof g==="object")section(g);
  section({label:"Your own direction",description:"Go beyond the suggested choices. Leave anything blank to defer.",fields:[{label:"Custom actions",type:"textarea"},{label:"Experimentation",type:"textarea"},{label:"Character development direction",type:"textarea"}]});
  const submit=make("button","Execute next turn","button gold");submit.type="submit";form.append(submit);
  form.onsubmit=e=>{e.preventDefault();if(!checks.every(c=>c()))return;const directive=readers.map(r=>r()).filter(([,v])=>v!=="").map(([k,v])=>k+": "+v).join("\n");onSubmit(directive||"Defer optional choices and continue the adventure.");};
  host.append(form);
}
