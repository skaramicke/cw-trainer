const $=id=>document.getElementById(id);
const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const signals=".- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --.. ----- .---- ..--- ...-- ....- ..... -.... --... ---.. ----.".split(" ");
const codes=Object.fromEntries([...alphabet].map((c,i)=>[c,signals[i]]));
const order="KMURESNAPTLOWIJZF0YVG5Q9H38B427C1D6X";
const words="ME US SUM SURE RUM MUSE USE MUM MESS MERE SEEM RUN SUN NUN NURSE SEE TREE REST STAR START TASTE TEAM MATE RATE TAME NAME SAME MEAN NEAR EARN LEARN PLAN PLANT LATE LATER EAR EARLY EAST WEST NORTH SOUTH SET NET TEN TENT SENT TEST TEXT NEXT OPEN CLOSE COME HOME SOME MORE MOST TIME TONE NOTE STONE STORE ROSE WATER RAIN SNOW WIND STORM RADIO SIGNAL ANTENNA WIRE POWER TOWER LIGHT NIGHT RIGHT LEFT WORLD HELLO GOOD MORNING EVENING THANK THANKS FRIEND HOUSE GREEN BLUE BLACK WHITE SOUND MUSIC ORANGE APPLE WINTER SUMMER SPRING AUTUMN SWEDEN FOREST RIVER OCEAN MOUNTAIN RECEIVE TRANSMIT MESSAGE CONTACT STATION OPERATOR FREQUENCY AMATEUR ELECTRIC BATTERY COMPUTER KEYBOARD MORSE CODE SPEED TRAIN PRACTICE COPY LEARNING CALL".split(" ");
const ham="K R KN AR SK AS BK CQ DE DX TU TNX PSE UR RST RIG ANT PWR WX QTH QRM QRN QRS QRQ QRT QRZ QSL QSO QSY QRP QRO QSB QRL QSP QSX QTR OM YL XYL 73 88 599 579 559 5NN TEST AGN HW CPY FER FB CUL GM GA GE GL HI ES ABT SRI NIL".split(" ");
const qso=["CQ CQ DE SM6ABC","CQ CQ CQ DE SM5XYZ K","SM6ABC DE SM5XYZ KN","GM OM TNX FER CALL","UR RST 599","UR RST 579 579","MY QTH IS SKARA","NAME IS ERIK","PWR 100W ANT DIPOLE","PSE QRS","R R FB OM","HW CPY","AGN PSE","QSL TU 73","TNX FER QSO 73 SK","CQ DX DE SM6ABC K","WX IS RAIN","RIG 5W QRP","73 ES GL"];
const types=["single","random","word","ham","qso"],labels=["Characters","Random groups","Words","Ham shorthand","QSO fragments"];
const levels=[{n:2,w:10},{n:2,w:12},{n:3,w:12},{n:3,w:14}];
for(let n=4;n<=36;n++)levels.push({n,w:Math.min(25,14+Math.floor((n-3)/3))});
const fresh=()=>({version:1,level:0,per:{},recent:[],group:0,groupRecent:[],total:0,correct:0,skills:Object.fromEntries(types.map(t=>[t,{n:0,ok:0}]))});
const valid=v=>v?.version===1&&Number.isInteger(v.level)&&!!levels[v.level]&&Number.isInteger(v.group)&&v.group>=0&&v.group<=20&&v.per&&Array.isArray(v.recent)&&Array.isArray(v.groupRecent)&&types.every(t=>Number.isFinite(v.skills?.[t]?.n)&&Number.isFinite(v.skills?.[t]?.ok))&&Number.isFinite(v.total)&&Number.isFinite(v.correct)&&Object.values(v.per).every(a=>Array.isArray(a)&&a.length<=5&&a.every(x=>x===0||x===1));
let s=fresh();try{const v=JSON.parse(localStorage.getItem("cw-progress"));if(valid(v))s=v}catch{}
const save=()=>{try{localStorage.setItem("cw-progress",JSON.stringify(s))}catch{}};
const sum=a=>a.reduce((x,y)=>x+y,0), lesson=()=>levels[s.level],pool=()=>[...order.slice(0,lesson().n)],size=()=>lesson().n<5?1:Math.min(12,2+Math.floor(s.group/2)),gap=()=>Math.max(3,8-Math.ceil(s.group/2));
const rand=a=>a[Math.floor(Math.random()*a.length)];
let target="",typed="",kind="single",phase="idle",retry=false,ctx,timer,epoch=0,nodes=[];
function weighted(){const a=pool(),weights=a.map(c=>1+3*(1-sum(s.per[c]||[])/5));let r=Math.random()*sum(weights);for(let i=0;i<a.length;i++){r-=weights[i];if(r<=0)return a[i]}return a.at(-1)}
function options(k,manual=false){const max=manual?40:k==="qso"?Math.max(8,size()*2):size()+2;return ({word:words,ham,qso}[k]||[]).filter(w=>w.length>=2&&w.length<=max&&[...w].every(c=>c===" "||pool().includes(c)))}
function choose(){let k=$("mode").value,manual=k!=="adaptive";if(!manual){const a=["single","single","single"];if(lesson().n>=5){a.push("random","random");for(const t of ["word","ham"])if(options(t).length)a.push(t);if(s.group>=6&&options("qso").length)a.push("qso")}k=rand(a)}if(k==="single")return[k,weighted()];const a=options(k,manual);return a.length?[k,rand(a)]:["random",Array.from({length:Math.max(2,size())},weighted).join("")]}
function draw(){ $("level").textContent=s.level+1;$("speed").textContent=lesson().w;$("accuracy").textContent=s.total?Math.round(100*s.correct/s.total)+"%":"—";$("group").textContent=size();
const coverage=pool().reduce((a,c)=>a+Math.min(1,sum(s.per[c]||[])/4)*Math.min(1,(s.per[c]||[]).length/5),0)/pool().length;
$("progress").value=Math.min(1,s.recent.length/20,sum(s.recent)/18,coverage);$("goal").textContent="Level mastery · "+s.recent.length+"/20 trials · "+gap()+" unit spacing";
$("copy").textContent=typed||"—";drawKeyboard();
$("start").disabled=["playing","feedback"].includes(phase);$("start").textContent=phase==="idle"?"Start":"Next";$("replay").disabled=!target||phase!=="answer";$("check").disabled=!target||phase!=="answer"||!typed;$("skip").disabled=!target||phase!=="answer";
$("master").replaceChildren();for(const c of pool()){const el=document.createElement("span"),p=document.createElement("progress");el.textContent=c;p.max=5;p.value=sum(s.per[c]||[]);el.append(p);$("master").append(el)}
$("skills").replaceChildren();types.forEach((t,i)=>{const a=s.skills[t],el=document.createElement("div");el.textContent=labels[i]+" · "+(a.n?Math.round(100*a.ok/a.n)+"% ("+a.n+")":"—");el.style.marginBottom="8px";$("skills").append(el)})}
const keyButtons=new Map();
let previousUnlocked=new Set(pool());
function drawKeyboard(){
if(!keyButtons.size){
for(const row of ["1234567890","QWERTYUIOP","ASDFGHJKL","ZXCVBNM"]){
const el=document.createElement("div");el.className="keyrow";
for(const c of row){const b=document.createElement("button");b.textContent=c;b.type="button";b.onclick=()=>input(c);el.append(b);keyButtons.set(c,b)}
$("keys").append(el)}
const row=document.createElement("div");row.className="keyrow";
for(const [c,label,fn] of [[" ","Space",()=>input(" ")],["Backspace","⌫",erase],["Enter","↵ Check",check]]){
const b=document.createElement("button");b.textContent=label;b.className="utility"+(c===" "?" space":"");b.onclick=fn;row.append(b);keyButtons.set(c,b)}
$("keys").append(row)}
const unlocked=new Set(pool()),canType=!!target&&["playing","answer"].includes(phase);
for(const [c,b] of keyButtons){
if(c===" "||c==="Backspace"||c==="Enter"){b.disabled=kind==="single"||!canType||(c==="Enter"&&(phase!=="answer"||!typed.trim()));continue}
const active=unlocked.has(c);b.classList.toggle("unlocked",active);b.classList.toggle("locked",!active);
b.disabled=!active||!canType||(phase==="playing"&&kind==="single");
b.setAttribute("aria-label",c+(active?"":" (locked)"));
if(active&&!previousUnlocked.has(c)){b.classList.remove("new");void b.offsetWidth;b.classList.add("new")}
if(!active)b.classList.remove("new")}
previousUnlocked=unlocked;
}
function celebrateKey(button){
if(!button||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
const rect=button.getBoundingClientRect(),burst=document.createElement("div");
burst.className="keyburst";burst.setAttribute("aria-hidden","true");
burst.style.left=rect.left+rect.width/2+"px";burst.style.top=rect.top+rect.height/2+"px";
const colors=["#70e8ce","#b5fff0","#ffce82","#f2fffa"];
for(let i=0;i<14;i++){
const p=document.createElement("i"),angle=(i+Math.random()*.65)*Math.PI*2/14,distance=28+Math.random()*34;
p.style.setProperty("--dx",Math.cos(angle)*distance+"px");p.style.setProperty("--dy",Math.sin(angle)*distance-10+"px");p.style.setProperty("--particle",colors[i%colors.length]);
const size=3+Math.random()*4;p.style.width=p.style.height=size+"px";burst.append(p)}
document.body.append(burst);setTimeout(()=>burst.remove(),520);
button.classList.remove("success-pop");void button.offsetWidth;button.classList.add("success-pop");setTimeout(()=>button.classList.remove("success-pop"),270);
}
let pulses=[],frame=0;
function animateSignal(){
cancelAnimationFrame(frame);
const tick=()=>{const now=ctx?.currentTime??0;document.body.classList.toggle("keyed",pulses.some(([a,b])=>now>=a&&now<b));if(pulses.some(([,b])=>now<b))frame=requestAnimationFrame(tick);else document.body.classList.remove("keyed")};
tick();
}
async function unlock(){if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state!=="running")await ctx.resume()}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Short non-CW earcons. They never drive the visual receiver.
async function feedbackSound(ok,e){
if(!$("effects")?.checked)return;
const volume=+$("volume").value/100;
if(!volume)return;
try{
await unlock();if(e!==epoch)return;
const start=ctx.currentTime+.008,duration=ok?.115:.16;
const o=ctx.createOscillator(),g=ctx.createGain();
o.type="sine";o.connect(g);g.connect(ctx.destination);
o.frequency.setValueAtTime(ok?880:350,start);
o.frequency.exponentialRampToValueAtTime(ok?1320:190,start+duration*.78);
g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(volume*.13,start+.009);
g.gain.exponentialRampToValueAtTime(.0001,start+duration);
o.start(start);o.stop(start+duration+.005);nodes.push(o);
o.onended=()=>{nodes=nodes.filter(x=>x!==o);o.disconnect();g.disconnect()};
await wait((duration+.025)*1000);
}catch{/* Feedback must never block training. */}
}

async function play(text,e){await unlock();if(e!==epoch)return;const u=1.2/lesson().w,v=+$("volume").value/100*.22,f=+$("pitch").value;let t=ctx.currentTime+.05,end=t;pulses=[];const seq=[...text];for(let i=0;i<seq.length;i++){const c=seq[i];if(c===" "){t+=Math.max(7,gap()*7/3)*u-gap()*u;continue}const code=codes[c];if(!code)continue;for(const sign of code){const d=u*(sign==="-"?3:1),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.setValueAtTime(v,t+d-.004);g.gain.linearRampToValueAtTime(0,t+d);pulses.push([t,t+d]);o.start(t);o.stop(t+d+.005);nodes.push(o);o.onended=()=>{nodes=nodes.filter(x=>x!==o);o.disconnect();g.disconnect()};end=t+d;t=end+u}t+=(gap()-1)*u}document.body.classList.add("playing");animateSignal();await wait(Math.max(0,(end-ctx.currentTime+.03)*1000));if(e===epoch){document.body.classList.remove("playing","keyed");cancelAnimationFrame(frame)}}
function cancel(){cancelAnimationFrame(frame);pulses=[];document.body.classList.remove("keyed");epoch++;clearTimeout(timer);for(const o of nodes){try{o.stop()}catch{}}nodes=[];document.body.classList.remove("playing")}
async function send(){const e=epoch;phase="playing";$("status").textContent="Receiving…";draw();try{await play(target,e);if(e!==epoch)return;phase="answer";$("status").textContent="Awaiting input"}catch{if(e!==epoch)return;phase="answer";$("status").textContent="Audio error — tap Replay"}draw()}
function next(){if(["playing","feedback"].includes(phase))return;cancel();[kind,target]=choose();typed="";retry=false;$("feedback").textContent="Copy what you hear.";send()}
function schedule(ms){clearTimeout(timer);if($("auto").checked)timer=setTimeout(next,ms)}
function align(a,b){const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));let i=a.length,j=b.length,out=[];while(i||j){if(i&&j&&d[i][j]===d[i-1][j-1]+Number(a[i-1]!==b[j-1]))out.push([a[--i],b[--j]]);else if(i&&d[i][j]===d[i-1][j]+1)out.push([a[--i],""]);else out.push(["",b[--j]])}return out.reverse()}
function record(a,ok){const stat=s.skills[kind];stat.n++;stat.ok+=Number(ok);const pairs=align(a,target).filter(([x,y])=>x!==" "&&y!==" ");s.total+=pairs.length;s.correct+=pairs.filter(([x,y])=>x===y).length;if($("mode").value==="adaptive"){if(kind==="single"){s.recent=[...s.recent,Number(ok)].slice(-20);s.per[target]=[...(s.per[target]||[]),Number(ok)].slice(-5)}else{s.groupRecent=[...s.groupRecent,Number(ok)].slice(-12);if(s.groupRecent.length===12&&sum(s.groupRecent)>=11&&s.group<20){s.group++;s.groupRecent=[]}}}save()}
function promote(){if(s.level<levels.length-1&&s.recent.length===20&&sum(s.recent)>=18&&pool().every(c=>(s.per[c]||[]).length===5&&sum(s.per[c])>=4)){s.level++;s.recent=[];s.per={};save();return true}return false}
function input(c){if(!target||!["playing","answer"].includes(phase))return;if(kind==="single"){if(phase==="answer"&&codes[c]){typed=c;check()}}else if(typed.length<100){typed+=c;$("copy").textContent=typed;$("check").disabled=phase!=="answer";drawKeyboard()}}
function erase(){if(!["playing","answer"].includes(phase))return;typed=typed.slice(0,-1);$("copy").textContent=typed||"—";$("check").disabled=phase!=="answer"||!typed;drawKeyboard()}
async function check(){if(phase!=="answer"||!target||!typed.trim())return;const a=typed.trim().replace(/\s+/g," "),t=target,ok=a===t;if(!retry)record(a,ok);if(ok){celebrateKey(kind==="single"?keyButtons.get(a):keyButtons.get("Enter"));const up=promote();target="";phase="feedback";const e=epoch;$("status").textContent=up?"Level up!":"Correct copy";$("feedback").textContent=up?"Unlocked "+lesson().n+" characters at "+lesson().w+" WPM":"✓ "+t;draw();await feedbackSound(true,e);if(e!==epoch)return;phase="idle";draw();schedule(up?1250:500);return}retry=true;phase="feedback";draw();const e=epoch;$("status").textContent="Compare the sounds";try{await feedbackSound(false,e);if(e!==epoch)return;await wait(90);if(e!==epoch)return;for(const [x,y] of align(a,t)){if(e!==epoch)return;if(x===y)continue;for(const [label,c] of [["You copied",x],["Transmitted",y]]){if(!codes[c])continue;$("feedback").textContent=label+": "+c;await play(c,e);await wait(400);if(e!==epoch)return}}$("feedback").textContent="Transmitted: "+t;await play(t,e);await wait(750);if(e!==epoch)return;typed="";$("feedback").textContent="Try again";await send()}catch{if(e===epoch){phase="answer";$("status").textContent="Audio error — tap Replay";draw()}}}
$("start").onclick=next;$("replay").onclick=()=>{if(phase==="answer")send()};$("check").onclick=check;
$("skip").onclick=async()=>{if(phase!=="answer"||!target)return;const t=target;if(!retry)record("",false);target="";typed=t;phase="feedback";draw();const e=epoch;$("feedback").textContent="Transmitted: "+t;try{await play(t,e)}catch{}if(e!==epoch)return;phase="idle";draw();schedule(700)};
$("auto").onchange=()=>{clearTimeout(timer);if(phase==="idle"&&s.total)schedule(200)};
$("mode").onchange=()=>{cancel();target="";typed="";phase="idle";$("status").textContent="Ready";draw()};
$("reset").onclick=()=>{if(!confirm("Reset progress on this device?"))return;cancel();s=fresh();save();target="";typed="";phase="idle";$("status").textContent="Ready";$("feedback").textContent="Listen and type what you hear.";draw()};
$("export").onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(s)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="cw-progress.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$("import").onclick=()=>$("file").click();$("file").onchange=async()=>{try{const v=JSON.parse(await $("file").files[0].text());if(!valid(v))throw Error();if(confirm("Replace current progress?")){cancel();s=v;save();target="";typed="";phase="idle";draw()}}catch{alert("Invalid progress file")}$("file").value=""};
document.addEventListener("keydown",e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName))return;if(e.key==="Escape"){e.preventDefault();$("replay").click()}else if(e.key==="Enter"){e.preventDefault();if(target)check();else next()}else if(e.key==="Backspace"){e.preventDefault();erase()}else if(e.key===" "){e.preventDefault();if(!target)next();else input(" ")}else if(pool().includes(e.key.toUpperCase())){e.preventDefault();input(e.key.toUpperCase())}});
try{const prefs=JSON.parse(localStorage.getItem("cw-settings")||"{}");for(const id of ["pitch","volume","mode"]){if(prefs[id]!=null)$(id).value=prefs[id]}if(typeof prefs.auto==="boolean")$("auto").checked=prefs.auto;if(typeof prefs.effects==="boolean"&&$("effects"))$("effects").checked=prefs.effects}catch{}
const saveSettings=()=>{try{localStorage.setItem("cw-settings",JSON.stringify({pitch:$("pitch").value,volume:$("volume").value,mode:$("mode").value,auto:$("auto").checked,effects:$("effects")?.checked??true}))}catch{}};
for(const id of ["pitch","volume","mode","auto","effects"])$(id)?.addEventListener("change",saveSettings);

// HUD panels overlay the training surface without interrupting audio or keyboard input.
const hudPanels=[["statsToggle","statsPanel"],["settingsToggle","settings"]];
function closeHud(){for(const [button,panel] of hudPanels){$(panel).hidden=true;$(button).setAttribute("aria-expanded","false")}}
for(const [button,panel] of hudPanels){
const toggle=$(button);toggle.addEventListener("pointerdown",e=>e.preventDefault());
toggle.addEventListener("click",()=>{const open=$(panel).hidden;closeHud();$(panel).hidden=!open;toggle.setAttribute("aria-expanded",String(open));toggle.blur()});
}
document.addEventListener("pointerdown",e=>{if(!e.target.closest(".hud,.hudpanel"))closeHud()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&hudPanels.some(([,panel])=>!$(panel).hidden)){closeHud();e.stopImmediatePropagation();e.preventDefault()}},true);

draw();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(console.warn);
