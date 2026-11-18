const $=id=>document.getElementById(id);
const providers=[
 {name:"LandWatch",domain:"landwatch.com",desc:"Acreage, homesteads, farms and rural property photos",url:"https://www.landwatch.com/"},
 {name:"Land.com",domain:"land.com",desc:"Rural and residential acreage listings with broker photography",url:"https://www.land.com/"},
 {name:"Land And Farm",domain:"landandfarm.com",desc:"Farms, ranches and recreational land",url:"https://www.landandfarm.com/"},
 {name:"LandSearch",domain:"landsearch.com",desc:"Land parcels, acreage and undeveloped property listings",url:"https://www.landsearch.com/"}
];
const landFields=()=>({area:$("landQuery").value.trim(),min:$("landMin").value.trim(),max:$("landMax").value.trim()});
const landTerms=({area,min,max})=>[area||"United States","land for sale",min?"at least "+min+" acres":"",max?"under $"+max:""].filter(Boolean).join(" ");
function renderLand(){
 const fields=landFields(),root=$("landProviderList");root.replaceChildren();
 const min=fields.min===""?null:Number(fields.min),max=fields.max===""?null:Number(fields.max);
 if((min!==null&&(!Number.isFinite(min)||min<0))||(max!==null&&(!Number.isFinite(max)||max<0))){
   $("landSearchNote").textContent="Please enter nonnegative acreage and price values.";return;
 }
 const query=landTerms(fields);
 const heading=document.createElement("p");heading.className="intel-search-summary";
 heading.textContent="Search prepared for: "+query+". Choose a marketplace below to view matching live listings and photos. Filters may need adjustment on the marketplace.";
 root.append(heading);
 for(const p of providers){
   const card=document.createElement("article");card.className="intel-card";
   const h=document.createElement("h3");h.textContent=p.name;
   const desc=document.createElement("p");desc.textContent=p.desc;
   const a=document.createElement("a");a.target="_blank";a.rel="noopener noreferrer";
   a.href="https://www.google.com/search?"+new URLSearchParams({q:"site:"+p.domain+" "+query}).toString();
   a.textContent="Find "+(fields.area||"U.S.")+" listings & photos ↗";
   const home=document.createElement("a");home.href=p.url;home.target="_blank";home.rel="noopener noreferrer";home.className="intel-secondary";home.textContent="Browse marketplace directly ↗";
   card.append(h,desc,a,home);root.append(card);
 }
 $("landSearchNote").textContent="Search updated. These are real marketplace search links, not live listings embedded in NORTHSTAR. Google results can be outdated; confirm price, availability and acreage on the listing.";
}
$("landSearch").addEventListener("click",renderLand);
["landQuery","landMin","landMax"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();renderLand()}}));
renderLand();
const status=(s)=>{$("intelStatus").textContent=s};
const badge=(text)=>{const s=document.createElement("span");s.className="intel-tag";s.textContent=text;return s};
const add=(root,title,desc,url,meta)=>{
 const card=document.createElement("article");card.className="intel-card";
 const h=document.createElement("h3");h.textContent=title;
 const p=document.createElement("p");p.textContent=desc;
 card.append(h,p);
 if(meta)card.append(badge(meta));
 const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Open official source ↗";card.append(a);root.append(card);
};
async function loadAlerts(){
 const root=$("nationalAlerts");root.replaceChildren();status("Loading official US alerts and recent earthquakes…");
 const results=await Promise.allSettled([
   fetch("https://api.weather.gov/alerts/active?status=actual",{headers:{Accept:"application/geo+json"}}).then(r=>{if(!r.ok)throw Error("NWS "+r.status);return r.json()}),
   fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson").then(r=>{if(!r.ok)throw Error("USGS "+r.status);return r.json()})
 ]);
 let shown=0;
 if(results[0].status==="fulfilled"){
  const alerts=(results[0].value.features||[]).filter(x=>x.properties?.headline).sort((a,b)=>Date.parse(b.properties.sent||0)-Date.parse(a.properties.sent||0)).slice(0,16);
  for(const item of alerts){const p=item.properties;add(root,p.event||"Weather alert",p.headline||"Official National Weather Service bulletin",p["@id"]||p.uri||"https://www.weather.gov/alerts",p.severity+" · "+(p.areaDesc||"United States").slice(0,95));shown++}
 }else add(root,"Weather alerts temporarily unavailable","View the official NWS alerts page directly.","https://www.weather.gov/alerts","Source unavailable");
 if(results[1].status==="fulfilled"){
  const quakes=(results[1].value.features||[]).slice(0,10);
  for(const item of quakes){const p=item.properties;add(root,"M "+Number(p.mag).toFixed(1)+" earthquake",p.place||"Location unavailable",p.url||"https://earthquake.usgs.gov/earthquakes/map/","USGS · "+new Date(p.time).toLocaleString());shown++}
 }else add(root,"Earthquake feed temporarily unavailable","View recent earthquakes on the official USGS map.","https://earthquake.usgs.gov/earthquakes/map/","Source unavailable");
 status("Official sources checked "+new Date().toLocaleString()+". "+shown+" reports displayed. This is not a comprehensive emergency notification system.");
}
$("refreshIntel").onclick=loadAlerts;loadAlerts();
