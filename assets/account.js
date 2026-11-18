import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient("https://brdzufxstglpzkjjvrmw.supabase.co", "sb_publishable_cP7aeVtzL4s6JPVfVZoRDQ_ex6N5sHI", { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } });
const el = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status = (message, error=false) => { el("accountStatus").textContent = message; el("accountStatus").style.color = error ? "#ffaaa3" : ""; };
let currentUser = null;
async function refresh() {
  const {data:{user},error} = await supabase.auth.getUser();
  currentUser = error ? null : user;
  el("signedOut").hidden = !!currentUser;
  el("signedIn").hidden = !currentUser;
  el("accountEmail").textContent = currentUser?.email || "";
  el("cloudPlans").innerHTML = "";
  if (currentUser) await listPlans();
}
async function listPlans() {
  const {data,error} = await supabase.from("saved_meal_plans").select("id,title,servings,selected_days,created_at").order("created_at",{ascending:false}).limit(50);
  if (error) { status("Unable to load plans: " + error.message,true); return; }
  el("cloudPlans").replaceChildren();
  if (!data.length) { el("cloudPlans").textContent = "No saved plans yet."; return; }
  for (const plan of data) {
    const row = document.createElement("div"); row.className = "cloud-plan";
    const title = document.createElement("span"); title.textContent = plan.title + " · " + plan.servings + " servings";
    const button = document.createElement("button"); button.type="button"; button.textContent="Delete";
    button.onclick = async () => {
      if (!confirm("Delete this saved plan?")) return;
      const {error} = await supabase.from("saved_meal_plans").delete().eq("id",plan.id);
      if (error) status(error.message,true); else {status("Plan deleted."); await listPlans();}
    };
    row.append(title,button); el("cloudPlans").append(row);
  }
}
el("accountForm").addEventListener("submit",async e => {
  e.preventDefault();
  const email=el("accountLoginEmail").value.trim(), password=el("accountPassword").value;
  if (!email || !password) return status("Enter your email and password.",true);
  const button=e.submitter; const action=button?.value || "login";
  el("accountLogin").disabled=true; el("accountSignup").disabled=true;
  try {
    const result = action==="signup"
      ? await supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname+"#account"}})
      : await supabase.auth.signInWithPassword({email,password});
    if (result.error) throw result.error;
    status(action==="signup" && !result.data.session ? "Account created. Check your email to confirm your address." : "Signed in successfully.");
    await refresh();
  } catch (err) {status(err.message || "Authentication failed.",true);}
  finally {el("accountLogin").disabled=false; el("accountSignup").disabled=false;}
});
el("accountReset").onclick = async () => {
  const email=el("accountLoginEmail").value.trim();
  if (!email) return status("Enter your email first, then select Reset password.",true);
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+"#account"});
  status(error ? error.message : "If this account exists, a password reset email will arrive.",!!error);
};
el("accountLogout").onclick=async()=>{const {error}=await supabase.auth.signOut();status(error?error.message:"Signed out.",!!error);await refresh();};
el("saveCloudPlan").onclick=async()=>{
  if (!currentUser) return status("Sign in first.",true);
  const title=el("cloudPlanTitle").value.trim();
  const servings=Math.max(1,Math.min(30,Number(el("servings").value)||4));
  if (!title || title.length>120) return status("Enter a plan name up to 120 characters.",true);
  const {error}=await supabase.from("saved_meal_plans").insert({user_id:currentUser.id,title,servings,selected_days:Array.from({length:30},(_,i)=>i+1)});
  if(error) return status("Could not save plan: "+error.message,true);
  status("30-day meal plan saved to your account.");await listPlans();
};
el("saveCloudLocation").onclick=async()=>{
  if(!currentUser)return status("Sign in first.",true);
  const latitude=Number(el("lat").value),longitude=Number(el("lng").value);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return status("Enter valid coordinates.",true);
  const {error}=await supabase.from("saved_locations").insert({user_id:currentUser.id,latitude,longitude,label:"Research location"});
  status(error?"Could not save location: "+error.message:"Research location saved to your account. Water and land status remain unverified.",!!error);
};
el("accountChangePassword").onclick=async()=>{
  const password=prompt("Enter a new password (at least 8 characters):");
  if(password===null)return;
  if(password.length<8)return status("Password must be at least 8 characters.",true);
  const {error}=await supabase.auth.updateUser({password});
  status(error?error.message:"Password updated.",!!error);
};
supabase.auth.onAuthStateChange((_event,session)=>{
  currentUser=session?.user||null;
  el("signedOut").hidden=!!currentUser;el("signedIn").hidden=!currentUser;
  el("accountEmail").textContent=currentUser?.email||"";
});
await refresh();
if(location.hash==="#account")el("account")?.scrollIntoView();
