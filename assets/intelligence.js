const $=id=>document.getElementById(id);
const providers=[{name:"LandWatch",url:"https://www.landwatch.com/",desc:"Rural land, farms, ranches, acreage and listing photographs"},{name:"Land.com",url:"https://www.land.com/",desc:"Land listings with seller photos, acreage and broker details"},{name:"Land And Farm",url:"https://www.landandfarm.com/",desc:"Farms, recreational parcels and rural land"},{name:"LandApp",url:"https://www.landapp.com/landapp-features/listings",desc:"Nationwide land listings with parcel research tools"}];
function renderLand(){
  const q=$("landQuery").value.trim(), min=$("landMin").value,max=$("landMax").value;
  $("landProviderList").replaceChildren();
  for(const p of providers){
    const card=document.createElement("article");card.className="intel-card";
    const h=document.createElement("h3");h.textContent=p.name;
    const desc=document.createElement("p");desc.textContent=p.desc;
    const a=document.createElement("a");a.href=p.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Browse verified source listings and property photos ↗";
    card.append(h,desc,a);$("landProviderList").append(card);
  }
  $("landSearchNote").textContent=q||min||max?"Search preferences: "+[q&&"Area: "+q,min&&"Min acres: "+min,max&&"Max price: $"+max].filter(Boolean).join(" · ")+". Open a provider above and apply these filters there. NORTHSTAR does not claim to import or verify their listings.":"Choose a provider to view actual listings and photographs on its website.";
}
$("landSearch").onclick=renderLand;renderLand();
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
