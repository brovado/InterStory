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
      const vision=document.createElement("textarea");vision.rows=7;vision.style.width="100%";vision.placeholder="Describe your world, character concept, power fantasy, mechanics and preferred gameplay…";
      panel.append(vision,btn("Generate character creation",()=>{if(!vision.value.trim())return;if(!token){button.click();return;}const id=uid();remember(id,vision.value.slice(0,60));play(id,-1,vision.value);}),make("h3","Resume adventures"));
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
      token=candidate;document.querySelector(".topbar .pill").textContent="AI CONNECTED";clearStored();try{if(mode==="device")localStorage.setItem(tokenKey,token);if(mode==="session")sessionStorage.setItem(tokenKey,token)}catch(_){showToast("Connection works, but browser storage is unavailable.")}button.textContent="Backend connected";status.textContent="Connected. Ready to play.";if(dialog.open)dialog.close();refreshHome();
    }catch(e){reset();status.textContent="Connection failed: "+e.message;}
    finally{connect.disabled=false;}
  }
  connect.addEventListener("click",()=>authenticate(input.value.trim(),dialog.querySelector("#backend-mode").value));
  live.click();
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
  const preview=document.createElement("pre");preview.hidden=true;
  const submit=document.createElement("button");submit.className="button gold";submit.type="submit";submit.textContent=onSubmit?"Resolve next turn":"Build next directive";
  form.append(submit);form.addEventListener("submit",e=>{e.preventDefault();preview.textContent=readers.map(read=>read()).filter(([,v])=>v!=="").map(([k,v])=>k+": "+v).join("\n");if(onSubmit)onSubmit(preview.textContent,submit);});
  host.append(form);
}
