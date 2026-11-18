const byId=id=>document.getElementById(id);
const landSources=[
 ["LandWatch","landwatch.com","Rural acreage, farms, cabins and seller photographs"],
 ["Land.com","land.com","Rural land and broker listing photography"],
 ["LandSearch","landsearch.com","Vacant land, homesteads and acreage"],
 ["Land And Farm","landandfarm.com","Farms, ranches and recreational land"]
];
const states={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"};
for(const [code,name] of Object.entries(states)){const o=document.createElement("option");o.value=code;o.textContent=name;byId("alertState").append(o)}
function mapAt(id,center,zoom){if(!window.L)return null;const m=L.map(id,{scrollWheelZoom:false}).setView(center,zoom);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:18}).addTo(m);setTimeout(()=>m.invalidateSize(),100);return m}
const landMap=mapAt("landSearchMap",[39,-98],4),alertMap=mapAt("alertMap",[39,-98],4);
const landPins=landMap?L.layerGroup().addTo(landMap):null,alertPins=alertMap?L.layerGroup().addTo(alertMap):null;
const element=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x};
function link(title,url){const a=element("a",title);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function searchCards(area,min,max){
 const root=byId("landProviderList");root.replaceChildren();
 const term=[area||"United States","land for sale",min?"at least "+min+" acres":"",max?"under $"+max:""].filter(Boolean).join(" ");
 for(const [name,domain,desc] of landSources){const card=element("article",undefined,"intel-card");card.append(element("h3",name),element("p",desc),link("Search matching listings and property photos ↗","https://www.google.com/search?"+new URLSearchParams({q:"site:"+domain+" "+term})),link("Browse marketplace ↗","https://www."+domain+"/"));root.append(card)}
}
async function landSearch(){
 const area=byId("landQuery").value.trim(),min=byId("landMin").value,max=byId("landMax").value;
 if((min!==""&&(+min<0||!Number.isFinite(+min)))||(max!==""&&(+max<0||!Number.isFinite(+max)))){byId("landSearchNote").textContent="Use nonnegative numbers for acreage and budget.";return}
 searchCards(area,min,max);
 const note=byId("landSearchNote");note.textContent="Search ready. Select a marketplace result to view real listing photos, prices and availability. These are targeted external searches, not an embedded live listing database.";
 if(!area||!landMap)return;
 note.textContent="Locating "+area+" on the map…";
 try{
  const url="https://nominatim.openstreetmap.org/search?"+new URLSearchParams({q:area,format:"json",limit:"1",countrycodes:"us",addressdetails:"1"});
  const r=await fetch(url,{headers:{Accept:"application/json"}});if(!r.ok)throw Error("Geocoding unavailable");
  const results=await r.json();if(!results.length){note.textContent="Location not found on map. Marketplace searches are ready below; try a city, county or state.";return}
  const p=results[0];landPins.clearLayers();const lat=+p.lat,lon=+p.lon;
  if(p.boundingbox){const b=p.boundingbox.map(Number);landMap.fitBounds([[b[0],b[2]],[b[1],b[3]]],{maxZoom:11})}else landMap.setView([lat,lon],9);
  L.marker([lat,lon]).addTo(landPins).bindPopup(element("span",p.display_name)).openPopup();
  note.textContent="Mapped "+p.display_name+". Search results below open real property marketplaces; this pin marks the area, not an individual property.";
 }catch(e){note.textContent="Map location lookup unavailable. Marketplace search links below are still ready."}
}
byId("landSearch").addEventListener("click",landSearch);
["landQuery","landMin","landMax"].forEach(id=>byId(id).addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();landSearch()}}));
searchCards("","","");
let alerts=[],quakes=[],failures=[];
const sourceCard=(title,detail,url,meta)=>{const c=element("article",undefined,"intel-card");c.append(element("h3",title),element("p",detail),element("span",meta,"intel-tag"),link("View official report ↗",url));return c};
const safeUrl=(url,fallback)=>typeof url==="string"&&url.startsWith("https://")?url:fallback;
async function getJson(url){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),12000);try{const r=await fetch(url,{signal:ctrl.signal,headers:{Accept:"application/geo+json, application/json"}});if(!r.ok)throw Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(timer)}}
async function loadAlerts(){
 const root=byId("nationalAlerts");root.replaceChildren();byId("intelStatus").textContent="Loading current official NWS alerts and USGS earthquakes…";
 const data=await Promise.allSettled([getJson("https://api.weather.gov/alerts/active"),getJson("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson")]);
 failures=[];alerts=data[0].status==="fulfilled"?(data[0].value.features||[]):(failures.push("NWS alerts"),[]);
 quakes=data[1].status==="fulfilled"?(data[1].value.features||[]):(failures.push("USGS earthquakes"),[]);
 renderAlerts();
}
let focusedDisaster=null;function showSelectedDisaster(item){focusedDisaster=item;const target=byId("selectedDisaster");if(!target)return;target.replaceChildren();const p=item.properties||{},q=item.geometry?.coordinates;const title=item.kind==="quake"?"M "+Number(p.mag||0).toFixed(1)+" earthquake":p.event||"Weather alert";target.append(element("h3",title),element("p",item.kind==="quake"?(p.place||"Location unavailable"):(p.headline||p.areaDesc||"Official NWS alert")),element("p",item.kind==="quake"?"Occurred: "+new Date(p.time).toLocaleString()+" · Depth: "+(Array.isArray(q)?q[2]:"Unknown")+" km":"Severity: "+(p.severity||"Unspecified")+" · Areas: "+(p.areaDesc||"Unspecified")));target.append(link("Open full official report ↗",safeUrl(p.url||p["@id"]||p.uri,item.kind==="quake"?"https://earthquake.usgs.gov/earthquakes/map/":"https://www.weather.gov/alerts")));target.hidden=false;const root=byId("nationalAlerts");root.replaceChildren();root.append(sourceCard(title,item.kind==="quake"?(p.place||"Location unavailable"):(p.headline||p.description||"Official weather report"),safeUrl(p.url||p["@id"]||p.uri,item.kind==="quake"?"https://earthquake.usgs.gov/earthquakes/map/":"https://www.weather.gov/alerts"),"Selected event only"));const reset=element("button","Show all matching disasters");reset.type="button";reset.addEventListener("click",()=>{focusedDisaster=null;renderAlerts()});target.prepend(reset);byId("intelStatus").textContent="Showing one selected disaster. Choose Show all matching disasters to restore the list.";target.scrollIntoView({behavior:"smooth",block:"nearest"})}
function renderAlerts(){focusedDisaster=null;const selectedPanel=byId("selectedDisaster");if(selectedPanel){selectedPanel.replaceChildren();selectedPanel.hidden=true}
 const state=byId("alertState").value,root=byId("nationalAlerts");root.replaceChildren();if(alertPins)alertPins.clearLayers();
 const inState=x=>{const p=x.properties||{};if(!state)return true;const ugc=p.geocode?.UGC||[];const sameUGC=ugc.some(v=>v.startsWith(state));const parts=(p.areaDesc||"").split(/[;,]/).map(s=>s.trim().toLowerCase());const full=states[state].toLowerCase();const sameArea=parts.some(s=>s===full||s.endsWith(", "+full));return sameUGC||sameArea};
 const unique=new Set();
 const selected=alerts.filter(inState).sort((a,b)=>Date.parse(b.properties?.sent||0)-Date.parse(a.properties?.sent||0)).filter(x=>{const p=x.properties||{};const id=p.id||p["@id"]||x.id;const key=id||[p.event,(p.headline||"").trim().toLowerCase(),(p.areaDesc||"").trim().toLowerCase()].join("|");if(unique.has(key))return false;unique.add(key);return true}).slice(0,35);
 for(const x of selected){const p=x.properties||{};root.append(sourceCard(p.event||"Weather alert",p.headline||p.description?.slice(0,180)||"Official weather bulletin",safeUrl(p["@id"]||p.uri,"https://www.weather.gov/alerts"),(p.severity||"Alert")+" · "+(p.areaDesc||"Area not specified").slice(0,110)))}
 let earthquakeCount=0;
 for(const q of quakes){const p=q.properties||{},coords=q.geometry?.coordinates;if(!coords||coords.length<2)continue;
  if(state){const name=(p.place||"").toLowerCase(),full=states[state].toLowerCase();if(!name.endsWith(", "+state.toLowerCase())&&!name.endsWith(", "+full))continue}
  earthquakeCount++;if(earthquakeCount<=20)root.append(sourceCard("M "+Number(p.mag||0).toFixed(1)+" earthquake",p.place||"Location not specified",safeUrl(p.url,"https://earthquake.usgs.gov/earthquakes/map/"),"USGS · "+new Date(p.time).toLocaleString()));
  if(alertPins){const marker=L.circleMarker([coords[1],coords[0]],{radius:Math.max(4,Math.min(13,(+p.mag||0)*2)),color:"#b35e37",fillOpacity:.7});marker.addTo(alertPins).bindPopup(element("span","M "+p.mag+" · "+(p.place||"Earthquake")));marker.on("click",()=>showSelectedDisaster({...q,kind:"quake"}))}
 }
 for(const x of selected){const geom=x.geometry;if(!geom||!alertPins)continue;try{const layer=L.geoJSON(geom,{style:{color:"#df9a4e",weight:2,fillOpacity:.1}});layer.addTo(alertPins);layer.on("click",()=>showSelectedDisaster({...x,kind:"alert"}))}catch{}}
 if(!selected.length&&!earthquakeCount)root.append(sourceCard("No reports in this selection","No matching records returned from the current feeds. This does not establish that an area is safe.","https://www.weather.gov/alerts","Check local emergency management"));
 if(failures.length)for(const name of failures)root.prepend(sourceCard(name+" temporarily unavailable","Live source could not be reached from this browser. Open the official website for current information.",name.startsWith("NWS")?"https://www.weather.gov/alerts":"https://earthquake.usgs.gov/earthquakes/map/","Source connection failed"));
 byId("intelStatus").textContent="Last checked "+new Date().toLocaleString()+" · "+selected.length+" NWS alerts · "+earthquakeCount+" USGS earthquakes"+(failures.length?" · Unavailable: "+failures.join(", "):"")+". Map shows located earthquakes and available alert polygons; some alerts lack geometry.";
 if(alertMap)setTimeout(()=>alertMap.invalidateSize(),100);
}
byId("alertState").addEventListener("change",renderAlerts);
byId("refreshIntel").addEventListener("click",loadAlerts);
loadAlerts();
