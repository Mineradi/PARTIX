// ---------- CONFIG ----------
const API_URL = "https://script.google.com/macros/s/AKfycbwM4IXqq9j9ET7yp8C4eX0H3-CVbDYt0Q1DutsfLBxqZOjKc9FenT_XiomG1ZVuFb9g/exec"; 
const ADMIN_ID = "PTX-0000";
const ADMIN_PASS = "AdigoPTX701843405914";

// ---------- API ----------
async function apiFetchAllEmployees(){
  const r = await fetch(API_URL);
  return await r.json();
}
async function apiRegisterEmployee({name,password,earning}){
  const r = await fetch(API_URL, {method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({name,password,earning})});
  return await r.text();
}
async function apiUpdateEarning(id,newEarning){
  const r = await fetch(API_URL, {method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({action:"updateEarning",id,earning:newEarning})});
  return await r.text();
}
async function apiFetchHistory(){
  const r = await fetch(API_URL+"?history=1");
  return await r.json();
}

// ---------- LOGIN ----------
document.getElementById("loginForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const id = loginId.value.trim();
  const pass = loginPassword.value.trim();
  if(id===ADMIN_ID && pass===ADMIN_PASS){
    sessionStorage.setItem("user",JSON.stringify({role:"admin"}));
    showPage("adminPage"); loadEmployees(); return;
  }
  const list = await apiFetchAllEmployees();
  const user = list.find(u=>String(u.id)===id);
  if(!user){loginMsg.textContent="ID not found";return;}
  if(user.password!==pass){loginMsg.textContent="Wrong password";return;}
  sessionStorage.setItem("user",JSON.stringify({role:"emp",id:user.id,name:user.name}));
  loadDashboard();
  showPage("dashboardPage");
});

// ---------- ADMIN PANEL ----------
async function loadEmployees(){
  const div = employeesList;
  div.innerHTML="Loading...";
  const list = await apiFetchAllEmployees();
  div.innerHTML="";
  list.forEach(emp=>{
    const card=document.createElement("div");
    card.className="employee-card p-3 border rounded";
    card.dataset.name=emp.name.toLowerCase();
    card.dataset.id=String(emp.id).toLowerCase();
    card.innerHTML=`
      <div>
        <b>${emp.name}</b> <span class="text-xs text-gray-500">(${emp.id})</span><br>
        Earning: ₹ <span id="earn-${emp.id}">${emp.earning}</span>
      </div>
      <div>
        <input id="amt-${emp.id}" type="number" placeholder="amount" class="border rounded px-2 w-20">
        <select id="op-${emp.id}" class="border rounded"><option value="add">+</option><option value="sub">-</option><option value="set">=</option></select>
        <button onclick="updateEmp('${emp.id}')" class="bg-blue-600 text-white px-2 rounded">Apply</button>
        <button onclick="toggleHistory('${emp.id}')" class="bg-gray-500 text-white px-2 rounded">History</button>
        <div id="hist-${emp.id}" class="hidden mt-2 text-xs"></div>
      </div>`;
    div.appendChild(card);
  });
}
async function updateEmp(id){
  let cur=parseFloat(document.getElementById("earn-"+id).textContent)||0;
  const amt=parseFloat(document.getElementById("amt-"+id).value);
  const op=document.getElementById("op-"+id).value;
  let newE=cur;
  if(op==="add") newE=cur+amt;
  if(op==="sub") newE=cur-amt;
  if(op==="set") newE=amt;
  const res=await apiUpdateEarning(id,newE);
  if(res==="Updated"){document.getElementById("earn-"+id).textContent=newE;}
}
async function toggleHistory(id){
  const box=document.getElementById("hist-"+id);
  if(!box.classList.contains("hidden")){box.classList.add("hidden");return;}
  box.classList.remove("hidden");
  box.textContent="Loading...";
  const hist=await apiFetchHistory();
  const filt=hist.filter(h=>String(h.id)===String(id));
  box.innerHTML=filt.map(h=>`${h.timestamp}: ₹${h.oldEarning} → ₹${h.newEarning}`).join("<br>");
}
searchInput.addEventListener("input",()=>{
  const t=searchInput.value.toLowerCase();
  document.querySelectorAll(".employee-card").forEach(c=>{
    c.style.display=(c.dataset.name.includes(t)||c.dataset.id.includes(t))?"":"none";
  });
});
openRegister.onclick=()=>showPage("registerPage");
logoutAdmin.onclick=()=>{sessionStorage.clear();showPage("loginPage");};

// ---------- REGISTER ----------
regForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const name=fullName.value.trim();
  const pass=password.value.trim();
  const earn=parseFloat(earning.value)||0;
  const newId=await apiRegisterEmployee({name,password:pass,earning:earn});
  regMsg.innerHTML=`✅ Registered! ID: <b>${newId}</b>`;
});
backToAdmin.onclick=()=>{showPage("adminPage");loadEmployees();};

// ---------- DASHBOARD ----------
async function loadDashboard(){
  const u=JSON.parse(sessionStorage.getItem("user"));
  const list=await apiFetchAllEmployees();
  const me=list.find(e=>String(e.id)===String(u.id));
  dashName.textContent=me.name;
  dashId.textContent=me.id;
  todayE.textContent="₹ "+me.earning;
  totalE.textContent="₹ "+me.earning;
  updated.textContent=me.timestamp;
}
logoutDash.onclick=()=>{sessionStorage.clear();showPage("loginPage");};

// ---------- PAGE SWITCH ----------
function showPage(id){
  ["loginPage","adminPage","registerPage","dashboardPage"].forEach(pid=>{
    document.getElementById(pid).classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");
}
document.getElementById("regForm").addEventListener("submit", registerEmployee);
