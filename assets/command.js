import {supabase} from "./account.js";
const $=id=>document.getElementById(id);
const tasks=["Emergency water reserve","30-day food inventory","First-aid supplies","Family contact and evacuation plan","Backup lighting and power","Important documents secured","Sanitation and hygiene supplies","Local hazard and weather alerts"];
const gear=["Seed Starting Kit","Gravity Water Filter","Portable Solar Panel","Emergency First Aid Kit","Homestead Hand Tools","Food Storage Containers","Rainwater Storage Tank","Off-Grid Field Guides"];
let user=null, prefs={household_size:4,checklist:[],wishlist:[]},locations=[],plans=[];
const message=(s,bad=false)=>{$("commandStatus").textContent=s;$("commandStatus").style.color=bad?"#ffaaa3":""};
const button=(label,fn)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=fn;return b};
const paragraph=(text)=>{const p=document.createElement("p");p.textContent=text;return p};
const fromStorage=(key,fallback)=>{try{return JSON.parse(localStorage.getItem("northstar_"+key))??fallback}catch{return fallback}};
const count=(arr)=>Array.isArray(arr)?arr.length:0;
function render(){
  $("commandGuest").hidden=!!user;$("commandMember").hidden=!user;
  if(!user)return;
  const people=Number(prefs.household_size)||4,days=Number($("commandDays").value)||30,water=people*days;
  $("commandPeople").value=people;
  $("commandWater").textContent=water.toLocaleString()+" gallons";
  $("commandCalories").textContent=(people*days*2000).toLocaleString()+" kcal";
  $("commandReadiness").textContent=count(prefs.checklist)+"/"+tasks.length;
  $("commandPlans").textContent=plans.length;
  $("commandLocations").textContent=locations.length;
  $("commandGear").textContent=count(prefs.wishlist);
  $("commandProgress").style.width=(count(prefs.checklist)/tasks.length*100)+"%";
  const checklist=$("commandChecklist");checklist.replaceChildren();
  tasks.forEach((task,i)=>{const label=document.createElement("label");label.className="command-check";const box=document.createElement("input");box.type="checkbox";box.checked=prefs.checklist.includes(i);box.onchange=()=>{prefs.checklist=box.checked?[...new Set([...prefs.checklist,i])]:prefs.checklist.filter(n=>n!==i);savePrefs()};label.append(box,document.createTextNode(task));checklist.append(label)});
  const wishlist=$("commandWishlist");wishlist.replaceChildren();
  gear.forEach((item,i)=>{const label=document.createElement("label");label.className="command-check";const box=document.createElement("input");box.type="checkbox";box.checked=prefs.wishlist.includes(i);box.onchange=()=>{prefs.wishlist=box.checked?[...new Set([...prefs.wishlist,i])]:prefs.wishlist.filter(n=>n!==i);savePrefs()};label.append(box,document.createTextNode(item));wishlist.append(label)});
  const loc=$("commandLocationList");loc.replaceChildren();
  if(!locations.length)loc.append(paragraph("No saved locations yet. Save coordinates from Land Explorer or the account panel."));
  locations.forEach(point=>{const row=document.createElement("div");row.className="command-row";const link=document.createElement("a");link.href="https://www.openstreetmap.org/?mlat="+encodeURIComponent(point.latitude)+"&mlon="+encodeURIComponent(point.longitude)+"#map=11/"+encodeURIComponent(point.latitude)+"/"+encodeURIComponent(point.longitude);link.target="_blank";link.rel="noopener noreferrer";link.textContent=point.label+" · "+Number(point.latitude).toFixed(4)+", "+Number(point.longitude).toFixed(4);row.append(link,button("Delete",()=>removeLocation(point.id)));loc.append(row)});
  const pl=$("commandPlanList");pl.replaceChildren();
  if(!plans.length)pl.append(paragraph("No cloud meal plans yet. Use Save 30-day plan in My Account."));
  plans.forEach(plan=>{const row=document.createElement("div");row.className="command-row";row.append(paragraph(plan.title+" · "+plan.servings+" servings · "+count(plan.selected_days)+" days"),button("Delete",()=>removePlan(plan.id)));pl.append(row)});
}
async function loadData(){
  if(!user)return;
  const [p,l,m]=await Promise.all([
    supabase.from("user_preferences").select("household_size,checklist,wishlist").eq("user_id",user.id).maybeSingle(),
    supabase.from("saved_locations").select("id,label,latitude,longitude,created_at").order("created_at",{ascending:false}).limit(100),
    supabase.from("saved_meal_plans").select("id,title,servings,selected_days").order("created_at",{ascending:false}).limit(100)
  ]);
  const errors=[p.error,l.error,m.error].filter(Boolean);
  if(errors.length)message("Cloud data error: "+errors[0].message,true);
  prefs=p.data?{...p.data,checklist:Array.isArray(p.data.checklist)?p.data.checklist:[],wishlist:Array.isArray(p.data.wishlist)?p.data.wishlist:[]}:{household_size:4,checklist:[],wishlist:[]};
  locations=l.data||[];plans=m.data||[];render();
}
async function savePrefs(){
  if(!user)return;
  const {error}=await supabase.from("user_preferences").upsert({user_id:user.id,household_size:prefs.household_size,checklist:prefs.checklist,wishlist:prefs.wishlist,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  message(error?"Save failed: "+error.message:"Preferences saved to your NORTHSTAR account.",!!error);render();
}
async function removeLocation(id){if(!confirm("Delete this saved research location?"))return;const {error}=await supabase.from("saved_locations").delete().eq("id",id);if(error)message(error.message,true);else {locations=locations.filter(x=>x.id!==id);message("Location deleted.");render()}}
async function removePlan(id){if(!confirm("Delete this cloud meal plan?"))return;const {error}=await supabase.from("saved_meal_plans").delete().eq("id",id);if(error)message(error.message,true);else {plans=plans.filter(x=>x.id!==id);message("Plan deleted.");render()}}
$("commandPeople").addEventListener("change",()=>{prefs.household_size=Math.max(1,Math.min(30,Number($("commandPeople").value)||4));savePrefs()});
$("commandDays").addEventListener("change",render);
$("commandReload").onclick=()=>loadData();
$("commandImport").onclick=async()=>{
  if(!user)return message("Sign in first.",true);
  const oldChecks=fromStorage("checks",[]),oldWish=fromStorage("wishlist",[]);
  if(!confirm("Merge this browser's existing checklist and wishlist into your cloud account?"))return;
  prefs.checklist=[...new Set([...prefs.checklist,...oldChecks.filter(i=>Number.isInteger(i)&&i>=0&&i<tasks.length)])];
  prefs.wishlist=[...new Set([...prefs.wishlist,...oldWish.filter(i=>Number.isInteger(i)&&i>=0&&i<gear.length)])];
  await savePrefs();
};
$("commandExport").onclick=()=>{
  const data=JSON.stringify({exported_at:new Date().toISOString(),preferences:prefs,locations,meal_plans:plans},null,2);
  const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="northstar-command-center.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$("commandAddLocation").onclick=async()=>{
  if(!user)return message("Sign in first.",true);
  const lat=Number($("commandLatitude").value),lng=Number($("commandLongitude").value),label=$("commandLocationName").value.trim();
  if(!label||label.length>120||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return message("Enter a name and valid latitude/longitude.",true);
  const {error}=await supabase.from("saved_locations").insert({user_id:user.id,label,latitude:lat,longitude:lng});
  if(error)message(error.message,true);else{message("Research point saved. Verify ownership, water rights and hazards independently.");await loadData()}
};
supabase.auth.onAuthStateChange((_event,session)=>{
  const next=session?.user||null;
  if(next?.id!==user?.id){user=next;prefs={household_size:4,checklist:[],wishlist:[]};locations=[];plans=[];render();if(user)queueMicrotask(loadData)}
});
const {data:{user:initial}}=await supabase.auth.getUser();user=initial;render();if(user)await loadData();
