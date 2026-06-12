import { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const COLORS = ["#00C896","#FF6B6B","#FFD93D","#6C63FF","#FF9F43","#54A0FF","#5F27CD","#00D2D3","#FF6B9D","#C0392B"];
const CURRENCIES = [
  { code:"NGN", symbol:"₦",  name:"Nigerian Naira",    flag:"🇳🇬" },
  { code:"USD", symbol:"$",  name:"US Dollar",          flag:"🇺🇸" },
  { code:"EUR", symbol:"€",  name:"Euro",               flag:"🇪🇺" },
  { code:"GBP", symbol:"£",  name:"British Pound",      flag:"🇬🇧" },
  { code:"GHS", symbol:"₵",  name:"Ghanaian Cedi",      flag:"🇬🇭" },
  { code:"KES", symbol:"KSh",name:"Kenyan Shilling",    flag:"🇰🇪" },
  { code:"ZAR", symbol:"R",  name:"South African Rand", flag:"🇿🇦" },
  { code:"CAD", symbol:"CA$",name:"Canadian Dollar",    flag:"🇨🇦" },
  { code:"AUD", symbol:"A$", name:"Australian Dollar",  flag:"🇦🇺" },
  { code:"INR", symbol:"₹",  name:"Indian Rupee",       flag:"🇮🇳" },
];
const CATEGORIES = {
  income:  ["Salary","Freelance","Business","Investment","Gift","Other Income"],
  expense: ["Food & Dining","Transport","Housing","Healthcare","Entertainment","Shopping","Education","Utilities","Other Expense"],
};
const ALL_CATS = [...CATEGORIES.income, ...CATEGORIES.expense];
const ONBOARDING = [
  { icon:"💰", title:"Welcome to Moni Tracker", desc:"Your AI-powered financial companion. Track income and expenses — all in one place.", btn:"Let's Go" },
  { icon:"🎙️", title:"Log with Voice or Text",   desc:'Say "Spent ₦5,000 on food" or type it. AI instantly categorises and saves it.', btn:"Nice!" },
  { icon:"📊", title:"Smart Reports & Insights", desc:"See where your money goes with beautiful charts and personalised AI advice.", btn:"Get Started 🚀" },
];
const PLANS = {
  free: { name:"Free", price:"₦0/mo",      color:"#00C896", features:["Unlimited transactions","AI categorisation","Reports & charts","Voice input","PDF export","Multi-currency"] },
  pro:  { name:"Pro",  price:"₦2,500/mo",  color:"#6C63FF", features:["Everything in Free","Team access (up to 5)","Advanced analytics","Priority AI insights","Custom categories","Dedicated support"] },
};
const DEMO_TX = [
  { id:"d1",  type:"income",  amount:150000, category:"Salary",        note:"Monthly salary",        date:"2026-05-01" },
  { id:"d2",  type:"expense", amount:45000,  category:"Housing",       note:"Rent payment",          date:"2026-05-02" },
  { id:"d3",  type:"expense", amount:12000,  category:"Food & Dining", note:"Groceries — Shoprite",  date:"2026-05-03" },
  { id:"d4",  type:"income",  amount:35000,  category:"Freelance",     note:"Design project",        date:"2026-05-05" },
  { id:"d5",  type:"expense", amount:8000,   category:"Transport",     note:"Uber rides",            date:"2026-05-06" },
  { id:"d6",  type:"expense", amount:15000,  category:"Shopping",      note:"Clothes",               date:"2026-05-08" },
  { id:"d7",  type:"expense", amount:7500,   category:"Entertainment", note:"Cinema & dinner",       date:"2026-05-10" },
  { id:"d8",  type:"income",  amount:20000,  category:"Investment",    note:"Piggybank payout",      date:"2026-05-12" },
  { id:"d9",  type:"expense", amount:5500,   category:"Healthcare",    note:"Pharmacy",              date:"2026-05-14" },
  { id:"d10", type:"expense", amount:6000,   category:"Utilities",     note:"NEPA & internet",       date:"2026-05-16" },
];
const DEMO_USER = { id:"demo", name:"Demo User", email:"demo@moni.app", password:"demo123", plan:"free", joinDate:"2026-01-01" };

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const fmt = (n, sym) => `${sym}${Number(n).toLocaleString()}`;

function localParse(text) {
  const lower = text.toLowerCase();
  const expanded = text
    .replace(/(\d+\.?\d*)\s*k\b/gi, (_,n)=>String(parseFloat(n)*1000))
    .replace(/(\d+\.?\d*)\s*m\b/gi, (_,n)=>String(parseFloat(n)*1000000));
  const m = expanded.match(/[\$£€₦₵₹]?\s?(\d[\d,\.]*)/);
  const amount = m ? parseFloat(m[1].replace(/,/g,"")) : 0;
  const isIncome = /\b(earn|receiv|got paid|salary|income|made|credit|profit|sold|sale|freelance revenue|paid me)\b/.test(lower);
  const type = isIncome ? "income" : "expense";
  let category = type==="income" ? "Other Income" : "Other Expense";
  const rules=[
    [/food|eat|restaurant|groceries|lunch|dinner|breakfast|bukka|market|shoprite|suya|rice|beans|pepper|snack/,"Food & Dining"],
    [/uber|bolt|taxi|bus|transport|fuel|petrol|keke|okada|danfo|ride|traffic/,"Transport"],
    [/rent|house|apartment|landlord|property/,"Housing"],
    [/salary|paycheck|wage|payroll/,"Salary"],
    [/freelance|project|client|design|contract|gig/,"Freelance"],
    [/invest|dividend|stock|crypto|piggybank|cowrywise|shares/,"Investment"],
    [/shop|cloth|fashion|shoe|bag|zara|jumia|buy|purchase/,"Shopping"],
    [/netflix|movie|cinema|fun|entertain|spotify|concert|party/,"Entertainment"],
    [/doctor|hospital|pharmacy|drug|health|clinic|medic/,"Healthcare"],
    [/electric|nepa|phcn|water|internet|wifi|mtn|airtel|glo|data|bill|utility/,"Utilities"],
    [/school|tuition|book|course|training|education/,"Education"],
    [/church|tithe|offering|donate|gift/,"Gift"],
    [/business|sale|product|revenue|profit/,"Business"],
  ];
  for(const [rx,cat] of rules){ if(rx.test(lower)){ category=cat; break; } }
  return { type, amount, category, note:text, date:new Date().toISOString().split("T")[0], confidence: amount>0?0.9:0.2 };
}

async function callAI(messages, maxTokens=800) {
  // Try Vercel serverless first (production), fall back to direct call (Claude artifact)
  try {
    const r = await fetch("/api/ai", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({messages, maxTokens}) });
    if(r.ok){ const d=await r.json(); return d.text||""; }
  } catch{}
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, messages })
    });
    const d = await r.json();
    if(d.error) return null;
    return d.content?.[0]?.text||"";
  } catch{ return null; }
}

function exportPDF(transactions, currency, period, userName) {
  const sym=currency.symbol;
  const inc=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const exp=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const bal=inc-exp;
  const rate=inc>0?Math.round((bal/inc)*100):0;
  const catMap={};
  transactions.filter(t=>t.type==="expense").forEach(t=>{ catMap[t.category]=(catMap[t.category]||0)+t.amount; });
  const cats=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=Syne:wght@700;800&display=swap');
  body{font-family:'DM Sans',sans-serif;color:#1a1a2e;padding:40px;max-width:800px;margin:0 auto}
  .hdr{background:linear-gradient(135deg,#0A0E1A,#1a1f35);color:#fff;border-radius:20px;padding:32px;margin-bottom:28px}
  .logo{font-family:'Syne',sans-serif;font-size:28px;font-weight:800}.logo span{color:#00C896}
  .meta{margin-top:10px;font-size:13px;color:rgba(255,255,255,0.5)}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
  .s{border-radius:14px;padding:16px;text-align:center}
  .si{background:#f0fdf8;border:2px solid #00C896}.se{background:#fff5f5;border:2px solid #FF6B6B}
  .sb{background:#f5f3ff;border:2px solid #6C63FF}.sr{background:#fefce8;border:2px solid #FFD93D}
  .sl{font-size:10px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:4px}
  .sv{font-family:'Syne',sans-serif;font-size:18px;font-weight:800}
  h3{font-family:'Syne',sans-serif;font-size:15px;margin:20px 0 10px;padding-bottom:6px;border-bottom:2px solid #f0f0f0}
  table{width:100%;border-collapse:collapse}th{background:#f8f9fa;padding:8px;text-align:left;font-size:11px;color:#888;font-weight:700;letter-spacing:.5px}
  td{padding:8px;font-size:12px;border-bottom:1px solid #f0f0f0}
  .inc{color:#00C896;font-weight:700}.exp{color:#FF6B6B;font-weight:700}
  .foot{margin-top:28px;text-align:center;font-size:11px;color:#ccc;border-top:1px solid #f0f0f0;padding-top:16px}
  </style></head><body>
  <div class="hdr"><div class="logo"><span>Moni</span> Tracker</div>
  <div class="meta">${period.charAt(0).toUpperCase()+period.slice(1)} Report &nbsp;·&nbsp; ${userName} &nbsp;·&nbsp; ${currency.code} &nbsp;·&nbsp; ${new Date().toLocaleDateString("en-NG",{year:"numeric",month:"long",day:"numeric"})}</div></div>
  <div class="stats">
    <div class="s si"><div class="sl">INCOME</div><div class="sv" style="color:#00C896">${sym}${inc.toLocaleString()}</div></div>
    <div class="s se"><div class="sl">EXPENSES</div><div class="sv" style="color:#FF6B6B">${sym}${exp.toLocaleString()}</div></div>
    <div class="s sb"><div class="sl">BALANCE</div><div class="sv" style="color:#6C63FF">${sym}${bal.toLocaleString()}</div></div>
    <div class="s sr"><div class="sl">SAVE RATE</div><div class="sv" style="color:#b45309">${rate}%</div></div>
  </div>
  <h3>Expense Breakdown</h3>
  <table><tr><th>CATEGORY</th><th style="text-align:right">AMOUNT</th><th style="text-align:right">%</th></tr>
  ${cats.map(([n,v])=>`<tr><td>${n}</td><td style="text-align:right;font-weight:600">${sym}${v.toLocaleString()}</td><td style="text-align:right;color:#888">${exp>0?Math.round((v/exp)*100):0}%</td></tr>`).join("")}
  </table>
  <h3>Transactions</h3>
  <table><tr><th>DATE</th><th>CATEGORY</th><th>NOTE</th><th style="text-align:right">AMOUNT</th></tr>
  ${transactions.slice(0,30).map(t=>`<tr><td>${t.date}</td><td>${t.category}</td><td style="color:#555">${t.note}</td><td style="text-align:right" class="${t.type==="income"?"inc":"exp"}">${t.type==="income"?"+":"-"}${sym}${Number(t.amount).toLocaleString()}</td></tr>`).join("")}
  </table>
  <div class="foot">Moni Tracker · AI-powered finance for Africa · monitracker.com · ${new Date().getFullYear()}</div>
  </body></html>`;
  const w=window.open("","_blank"); if(w){ w.document.write(html); w.document.close(); setTimeout(()=>w.print(),600); }
}

/* ═══════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0A0E1A}::-webkit-scrollbar-thumb{background:#00C896;border-radius:4px}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:20px;transition:border-color .25s}
.card:hover{border-color:rgba(0,200,150,0.2)}
.btn-green{background:#00C896;color:#0A0E1A;border:none;border-radius:13px;padding:15px 24px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:all .2s;width:100%}
.btn-green:hover:not(:disabled){background:#00E5AD;transform:translateY(-1px)}
.btn-green:disabled{opacity:.5;cursor:not-allowed}
.btn-ghost{background:transparent;color:#E8EAF0;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:12px 18px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all .2s}
.btn-ghost:hover{border-color:#00C896;color:#00C896}
.nav-btn{background:transparent;border:none;padding:8px 12px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:11px;cursor:pointer;color:rgba(232,234,240,0.4);display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .2s;flex:1}
.nav-btn.active{background:rgba(0,200,150,0.12);color:#00C896}
.field{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:13px;padding:14px 16px;color:#E8EAF0;font-family:'DM Sans',sans-serif;font-size:15px;outline:none}
.field:focus{border-color:#00C896}
.field::placeholder{color:rgba(232,234,240,0.3)}
textarea.field{resize:none}
select.field{cursor:pointer}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:300;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px)}
.sheet{background:#141824;border-radius:24px 24px 0 0;padding:28px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto}
.fade{animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.pulse{animation:pulse 1.4s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.spin{animation:spin 1s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
.tag-i{background:rgba(0,200,150,.15);color:#00C896;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.tag-e{background:rgba(255,107,107,.15);color:#FF6B6B;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.section-label{font-size:11px;font-weight:700;color:rgba(232,234,240,.4);letter-spacing:.6px;margin-bottom:12px}
`;

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function MoniTracker() {
  // storage
  const safeGet = (k) => { try{ const v=localStorage.getItem(k); return v?{value:v}:null; }catch{ return null; } };
  const safeSet = (k,v) => { try{ localStorage.setItem(k,v); }catch{} };
  const safeDel = (k)   => { try{ localStorage.removeItem(k); }catch{} };

  // auth state
  const [users,       setUsers]       = useState([DEMO_USER]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn,    setLoggedIn]    = useState(false);
  const [screen,      setScreen]      = useState("loading"); // loading|landing|auth|onboard|app
  const [authMode,    setAuthMode]    = useState("login");   // login|signup|forgot
  const [authForm,    setAuthForm]    = useState({name:"",email:"",phone:"",password:"",newPassword:""});
  const [authError,   setAuthError]   = useState("");
  const [onboardStep, setOnboardStep] = useState(0);
  const [storageReady,setStorageReady]= useState(false);

  // app state
  const [tab,          setTab]          = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [budgets,      setBudgets]      = useState({});
  const [currency,     setCurrency]     = useState(CURRENCIES[0]);
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [aiInsight,    setAiInsight]    = useState("");
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiError,      setAiError]      = useState("");
  const [notification, setNotification] = useState(null);
  const [filterType,   setFilterType]   = useState("all");

  // input state
  const [inputText,   setInputText]   = useState("");
  const [recording,   setRecording]   = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(""); // "listening"|"processing"|""
  const [processing,  setProcessing]  = useState(false);
  const [parsedEntry, setParsedEntry] = useState(null);
  const [showAddSheet,setShowAddSheet]= useState(false);
  const [editTx,      setEditTx]      = useState(null);
  const [deleteTx,    setDeleteTx]    = useState(null);

  // sheet state
  const [showCurrency, setShowCurrency] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBudgets,  setShowBudgets]  = useState(false);
  const [showPlans,    setShowPlans]    = useState(false);
  const [budgetEdit,   setBudgetEdit]   = useState({});

  const recRef = useRef(null);
  const sym = currency.symbol;

  /* ── init ── */
  useEffect(()=>{
    (async()=>{
      const uRes = safeGet("mt:users");
      let loadedUsers = [DEMO_USER];
      if(uRes){ try{ const p=JSON.parse(uRes.value); loadedUsers=[DEMO_USER,...p.filter(u=>u.id!=="demo")]; }catch{} }
      setUsers(loadedUsers);
      safeSet("mt:users", JSON.stringify(loadedUsers));
      const sRes = safeGet("mt:session");
      if(sRes){
        try{
          const sess=JSON.parse(sRes.value);
          const user=loadedUsers.find(u=>u.id===sess.userId);
          if(user){
            setCurrentUser(user); setLoggedIn(true);
            const txRes  = safeGet(`mt:tx:${user.id}`);
            const budRes = safeGet(`mt:budgets:${user.id}`);
            const prfRes = safeGet(`mt:prefs:${user.id}`);
            setTransactions(txRes ? JSON.parse(txRes.value) : (user.id==="demo" ? DEMO_TX : []));
            setBudgets(budRes ? JSON.parse(budRes.value) : {});
            if(prfRes){ const p=JSON.parse(prfRes.value); if(p.currency) setCurrency(CURRENCIES.find(c=>c.code===p.currency)||CURRENCIES[0]); }
            setScreen(sess.onboarded?"app":"onboard");
          } else setScreen("landing");
        }catch{ setScreen("landing"); }
      } else setScreen("landing");
      setStorageReady(true);
    })();
  },[]);

  const saveTx  = (uid,arr)  => safeSet(`mt:tx:${uid}`, JSON.stringify(arr));
  const saveBud = (uid,b)    => safeSet(`mt:budgets:${uid}`, JSON.stringify(b));
  const savePrf = (uid,p)    => safeSet(`mt:prefs:${uid}`, JSON.stringify(p));

  /* ── notify ── */
  const notify=(msg,type="success")=>{ setNotification({msg,type}); setTimeout(()=>setNotification(null),3500); };

  /* ── derived ── */
  const totalIncome  = transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense = transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance      = totalIncome - totalExpense;
  const saveRate     = totalIncome>0 ? Math.round((balance/totalIncome)*100) : 0;
  const filtered     = filterType==="all" ? transactions : transactions.filter(t=>t.type===filterType);
  const getCats = (type)=>{ const m={}; transactions.filter(t=>t.type===type).forEach(t=>{ m[t.category]=(m[t.category]||0)+t.amount; }); return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value); };
  const expenseCats = getCats("expense");

  const getBarData = ()=>{ const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; return days.map((d,i)=>({ day:d, income:transactions.filter(t=>t.type==="income"&&new Date(t.date).getDay()===((i+1)%7)).reduce((s,t)=>s+t.amount,0)||0, expense:transactions.filter(t=>t.type==="expense"&&new Date(t.date).getDay()===((i+1)%7)).reduce((s,t)=>s+t.amount,0)||0 })); };
  const getTrendData = ()=>["Jan","Feb","Mar","Apr","May","Jun"].map((m,i)=>({ month:m, income:transactions.filter(t=>new Date(t.date).getMonth()===i&&t.type==="income").reduce((s,t)=>s+t.amount,0), expense:transactions.filter(t=>new Date(t.date).getMonth()===i&&t.type==="expense").reduce((s,t)=>s+t.amount,0), balance:transactions.filter(t=>new Date(t.date).getMonth()===i&&t.type==="income").reduce((s,t)=>s+t.amount,0)-transactions.filter(t=>new Date(t.date).getMonth()===i&&t.type==="expense").reduce((s,t)=>s+t.amount,0) }));

  const getBudgetUsage=(cat)=>{ if(!budgets[cat]) return null; const ms=new Date(); const start=new Date(ms.getFullYear(),ms.getMonth(),1).toISOString().split("T")[0]; const spent=transactions.filter(t=>t.type==="expense"&&t.category===cat&&t.date>=start).reduce((s,t)=>s+t.amount,0); return {spent,limit:budgets[cat],pct:Math.min((spent/budgets[cat])*100,100)}; };

  /* ── auth ── */
  const handleLogin=()=>{
    const user=users.find(u=>u.email.toLowerCase()===authForm.email.toLowerCase()&&u.password===authForm.password);
    if(!user){ setAuthError("Invalid email or password."); return; }
    setCurrentUser(user); setLoggedIn(true); setAuthError("");
    const txRes=safeGet(`mt:tx:${user.id}`); const budRes=safeGet(`mt:budgets:${user.id}`); const prfRes=safeGet(`mt:prefs:${user.id}`);
    setTransactions(txRes?JSON.parse(txRes.value):(user.id==="demo"?DEMO_TX:[]));
    setBudgets(budRes?JSON.parse(budRes.value):{});
    if(prfRes){ const p=JSON.parse(prfRes.value); if(p.currency) setCurrency(CURRENCIES.find(c=>c.code===p.currency)||CURRENCIES[0]); }
    safeSet("mt:session", JSON.stringify({userId:user.id,onboarded:true}));
    setScreen("app");
  };
  const handleSignup=()=>{
    if(!authForm.name||!authForm.email||!authForm.phone||!authForm.password){ setAuthError("All fields are required."); return; }
    if(!/^[0-9+]{7,15}$/.test(authForm.phone.replace(/\s/g,""))){ setAuthError("Enter a valid phone number."); return; }
    if(authForm.password.length<6){ setAuthError("Password must be at least 6 characters."); return; }
    if(users.find(u=>u.email.toLowerCase()===authForm.email.toLowerCase())){ setAuthError("Email already registered."); return; }
    const nu={id:`u_${Date.now()}`,name:authForm.name,email:authForm.email,phone:authForm.phone,password:authForm.password,plan:"free",joinDate:new Date().toISOString().split("T")[0]};
    const updated=[...users,nu]; setUsers(updated); setCurrentUser(nu); setLoggedIn(true); setAuthError("");
    safeSet("mt:users",JSON.stringify(updated));
    safeSet(`mt:tx:${nu.id}`,JSON.stringify([])); // NEW users start EMPTY — no sample data
    safeSet("mt:session",JSON.stringify({userId:nu.id,onboarded:false}));
    setTransactions([]); setBudgets({});
    setOnboardStep(0); setScreen("onboard");
  };
  const handleForgotPassword=()=>{
    const user=users.find(u=>u.email.toLowerCase()===authForm.email.toLowerCase());
    if(!user){ setAuthError("No account found with that email."); return; }
    if(!authForm.newPassword||authForm.newPassword.length<6){ setAuthError("New password must be at least 6 characters."); return; }
    const updated=users.map(u=>u.email.toLowerCase()===authForm.email.toLowerCase()?{...u,password:authForm.newPassword}:u);
    setUsers(updated); safeSet("mt:users",JSON.stringify(updated));
    setAuthError(""); notify("Password reset! You can now sign in. ✅");
    setAuthMode("login"); setAuthForm({name:"",email:authForm.email,password:"",newPassword:""});
  };
  const handleLogout=()=>{ safeDel("mt:session"); setLoggedIn(false); setCurrentUser(null); setTransactions([]); setBudgets({}); setAiInsight(""); setAiError(""); setTab("dashboard"); setScreen("landing"); };
  const finishOnboard=()=>{ safeSet("mt:session",JSON.stringify({userId:currentUser.id,onboarded:true})); setScreen("app"); };

  /* ── voice ── */
  const handleVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){ notify("Voice not supported. Use Chrome browser.","error"); return; }
    if(recording){ recRef.current?.stop(); setRecording(false); setVoiceStatus(""); return; }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec=new SR(); rec.lang="en-NG"; rec.continuous=false; rec.interimResults=false;
    rec.onstart=()=>{ setRecording(true); setVoiceStatus("listening"); };
    rec.onresult=(e)=>{ const t=e.results[0][0].transcript; setInputText(t); setRecording(false); setVoiceStatus("Got it! Press 'Add with AI' to save."); setTimeout(()=>setVoiceStatus(""),4000); };
    rec.onerror=()=>{ setRecording(false); setVoiceStatus(""); notify("Couldn't hear you. Try again.","error"); };
    rec.onend=()=>{ setRecording(false); };
    recRef.current=rec; rec.start();
  };

  /* ── process ── */
  const handleProcess=async()=>{
    if(!inputText.trim()) return;
    setProcessing(true);
    const local=localParse(inputText);
    if(local.confidence>=0.9){ setParsedEntry(local); setShowAddSheet(true); setProcessing(false); return; }
    const aiText=await callAI([{role:"user",content:`Parse this Nigerian finance entry. Return ONLY valid JSON, no extra text:\nEntry: "${inputText}"\nReturn: {"type":"income"|"expense","amount":number,"category":"one of [${ALL_CATS.join(", ")}]","note":"short description","date":"${new Date().toISOString().split("T")[0]}"}`}], 300);
    if(aiText){
      try{ const p=JSON.parse(aiText.replace(/```json|```/g,"").trim()); setParsedEntry({...p,confidence:0.95}); }
      catch{ setParsedEntry(local); }
    } else { setParsedEntry(local); }
    setShowAddSheet(true); setProcessing(false);
  };

  /* ── crud ── */
  const confirmAdd=()=>{
    if(!parsedEntry||parsedEntry.amount<=0){ notify("Amount must be greater than 0","error"); return; }
    const tx={...parsedEntry,id:`tx_${Date.now()}`}; delete tx.confidence;
    const updated=[tx,...transactions]; setTransactions(updated); saveTx(currentUser.id,updated);
    setInputText(""); setParsedEntry(null); setShowAddSheet(false); notify("Transaction saved ✅");
    checkBudgetAlert(tx,updated);
  };
  const confirmEdit=()=>{ const u=transactions.map(t=>t.id===editTx.id?editTx:t); setTransactions(u); saveTx(currentUser.id,u); setEditTx(null); notify("Updated ✅"); };
  const confirmDelete=()=>{ const u=transactions.filter(t=>t.id!==deleteTx.id); setTransactions(u); saveTx(currentUser.id,u); setDeleteTx(null); notify("Deleted"); };
  const checkBudgetAlert=(tx,all)=>{ if(tx.type!=="expense") return; const lim=budgets[tx.category]; if(!lim) return; const ms=new Date(); const start=new Date(ms.getFullYear(),ms.getMonth(),1).toISOString().split("T")[0]; const spent=all.filter(t=>t.type==="expense"&&t.category===tx.category&&t.date>=start).reduce((s,t)=>s+t.amount,0); const pct=(spent/lim)*100; if(pct>=100) notify(`🚨 ${tx.category} budget exceeded!`,"error"); else if(pct>=80) notify(`⚠️ ${tx.category} at ${Math.round(pct)}% of budget`,"warn"); };

  /* ── AI insights ── */
  const fetchInsights=async()=>{
    if(transactions.length===0){ notify("Add some transactions first to get insights!","error"); return; }
    setAiLoading(true); setAiError(""); setTab("insights");
    const topCats=expenseCats.slice(0,3).map(c=>`${c.name}: ${sym}${c.value.toLocaleString()}`);
    const text=await callAI([{role:"user",content:`You are Moni, a friendly AI finance advisor for Nigerian users. Be warm, specific, and practical.\n\nFinancial summary:\n- Income: ${sym}${totalIncome.toLocaleString()} | Expenses: ${sym}${totalExpense.toLocaleString()} | Balance: ${sym}${balance.toLocaleString()}\n- Save rate: ${saveRate}% | Transactions: ${transactions.length} | Currency: ${currency.code}\n- Top expenses: ${topCats.join(", ") || "None yet"}\n\nGive exactly:\n1. Three personalised insights (with specific numbers)\n2. Three actionable money tips\n\nUse emojis. Reference Nigerian context (cost of living, local savings, POS, etc). Keep it encouraging and under 250 words.`}], 600);
    if(text){ setAiInsight(text); setAiError(""); }
    else { setAiError("Couldn't connect to AI. Check your internet and try again."); }
    setAiLoading(false);
  };

  /* ── currency ── */
  const changeCurrency=(c)=>{ setCurrency(c); setShowCurrency(false); savePrf(currentUser.id,{currency:c.code}); notify(`Currency changed to ${c.name} ${c.flag}`); };

  /* ── save budgets ── */
  const saveBudgets=()=>{ const merged={...budgets}; Object.entries(budgetEdit).forEach(([k,v])=>{ if(v&&parseFloat(v)>0) merged[k]=parseFloat(v); else if(v==="") delete merged[k]; }); setBudgets(merged); saveBud(currentUser.id,merged); setBudgetEdit({}); setShowBudgets(false); notify("Budgets saved 💰"); };

  /* ═══════════════════════════════════════════════════════
     LOADING
  ═══════════════════════════════════════════════════════ */
  if(screen==="loading") return (
    <div style={{minHeight:"100vh",background:"#0A0E1A",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Sans,sans-serif"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:32,fontWeight:800,color:"#E8EAF0"}}><span style={{color:"#00C896"}}>Moni</span> Tracker</div>
        <div style={{color:"rgba(232,234,240,.4)",fontSize:14,marginTop:8}} className="pulse">Loading...</div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     LANDING PAGE
  ═══════════════════════════════════════════════════════ */
  if(screen==="landing") return (
    <div style={{minHeight:"100vh",background:"#0A0E1A",fontFamily:"'DM Sans',sans-serif",color:"#E8EAF0",overflowX:"hidden"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:-300,left:-200,width:700,height:700,background:"radial-gradient(circle,rgba(0,200,150,.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:-200,right:-200,width:600,height:600,background:"radial-gradient(circle,rgba(108,99,255,.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
      {/* NAV */}
      <div style={{padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,.06)",position:"sticky",top:0,background:"rgba(10,14,26,.9)",backdropFilter:"blur(16px)",zIndex:10}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800}}><span style={{color:"#00C896"}}>Moni</span> Tracker</div>
        <button className="btn-ghost" onClick={()=>{setScreen("auth");setAuthMode("login");}} style={{padding:"9px 18px",fontSize:13}}>Sign In</button>
      </div>
      {/* HERO */}
      <div style={{padding:"56px 24px 40px",maxWidth:480,margin:"0 auto",textAlign:"center"}} className="fade">
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(0,200,150,.1)",border:"1px solid rgba(0,200,150,.2)",borderRadius:20,padding:"6px 16px",marginBottom:22,fontSize:13,color:"#00C896",fontWeight:700}}>🇳🇬 Built for Africa · AI-Powered</div>
        <h1 style={{fontFamily:"Syne,sans-serif",fontSize:38,fontWeight:800,lineHeight:1.15,marginBottom:18,letterSpacing:"-1px"}}>Track expenses with<br/><span style={{color:"#00C896"}}>simple English.</span></h1>
        <p style={{fontSize:15,color:"rgba(232,234,240,.6)",lineHeight:1.75,marginBottom:12}}>Say <span style={{color:"#00C896",fontWeight:600}}>"Spent ₦5,000 on food today"</span> and Moni does the rest. Instantly categorised by AI. Built for Nigerians and Africans.</p>
        <p style={{fontSize:13,color:"rgba(232,234,240,.4)",marginBottom:32}}>No accounting knowledge needed. No spreadsheets. Just talk.</p>
        <button className="btn-green" onClick={()=>{setScreen("auth");setAuthMode("signup");}} style={{fontSize:16,padding:"17px",borderRadius:16,marginBottom:10}}>Start for Free →</button>
        <div style={{fontSize:12,color:"rgba(232,234,240,.3)"}}>No credit card · Free forever plan · 2 min setup</div>
      </div>
      {/* HOW IT WORKS */}
      <div style={{padding:"0 24px 40px",maxWidth:480,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(0,200,150,.8)",letterSpacing:"1px",marginBottom:8}}>HOW IT WORKS</div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800}}>Three steps. That's it.</div>
        </div>
        {[
          {n:"1",icon:"🗣️",title:"Speak or type anything",desc:'Say "Spent ₦3,500 on transport" or type it naturally. No forms to fill.'},
          {n:"2",icon:"🤖",title:"AI categorises instantly",desc:"Our AI reads your entry, finds the amount, category and type automatically."},
          {n:"3",icon:"📊",title:"Track & grow",desc:"See beautiful reports, get AI advice, and understand your money like never before."},
        ].map(s=>(
          <div key={s.n} className="card" style={{marginBottom:12,display:"flex",gap:16,alignItems:"flex-start"}}>
            <div style={{width:44,height:44,borderRadius:14,background:"rgba(0,200,150,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.icon}</div>
            <div><div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{s.title}</div><div style={{fontSize:13,color:"rgba(232,234,240,.5)",lineHeight:1.6}}>{s.desc}</div></div>
          </div>
        ))}
      </div>
      {/* FEATURES */}
      <div style={{padding:"0 24px 40px",maxWidth:480,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800}}>Everything you need</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{icon:"🎙️",t:"Voice Logging",d:"Speak your expenses hands-free"},{icon:"🤖",t:"AI Categorisation",d:"Automatic & accurate"},{icon:"📊",t:"Smart Reports",d:"Weekly & monthly breakdowns"},{icon:"💡",t:"AI Insights",d:"Personalised money advice"},{icon:"🌍",t:"Multi-Currency",d:"NGN, USD, GHS & more"},{icon:"📄",t:"PDF Export",d:"Beautiful financial reports"}].map(f=>(
            <div key={f.t} className="card" style={{padding:"16px 14px"}}>
              <div style={{fontSize:24,marginBottom:8}}>{f.icon}</div>
              <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{f.t}</div>
              <div style={{fontSize:11,color:"rgba(232,234,240,.4)"}}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
      {/* TRUST */}
      <div style={{padding:"0 24px 40px",maxWidth:480,margin:"0 auto"}}>
        <div className="card" style={{background:"rgba(0,200,150,.05)",borderColor:"rgba(0,200,150,.2)"}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:16,textAlign:"center"}}>Your data is safe 🔒</div>
          {[{icon:"🔐",t:"Secure storage",d:"Your data is stored securely on your device and encrypted"},
            {icon:"🙈",t:"Privacy first",d:"We never sell your financial data to third parties"},
            {icon:"🇳🇬",t:"Built for Africa",d:"Designed specifically for Nigerian and African users"}].map(i=>(
            <div key={i.t} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:14}}>
              <span style={{fontSize:22}}>{i.icon}</span>
              <div><div style={{fontWeight:600,fontSize:14}}>{i.t}</div><div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginTop:2}}>{i.d}</div></div>
            </div>
          ))}
        </div>
      </div>
      {/* PRICING */}
      <div style={{padding:"0 24px 60px",maxWidth:480,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800}}>Simple pricing</div>
          <div style={{fontSize:13,color:"rgba(232,234,240,.4)",marginTop:6}}>Start free. Upgrade when you need more.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
          {Object.values(PLANS).map((p,i)=>(
            <div key={p.name} style={{padding:18,borderRadius:16,border:`2px solid ${p.color}40`,background:`${p.color}08`}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:p.color}}>{p.name}</div>
              <div style={{fontSize:17,fontWeight:700,margin:"6px 0 12px"}}>{p.price}</div>
              {p.features.slice(0,4).map(f=><div key={f} style={{fontSize:11,color:"rgba(232,234,240,.5)",marginBottom:4}}>✓ {f}</div>)}
            </div>
          ))}
        </div>
        <button className="btn-green" onClick={()=>{setScreen("auth");setAuthMode("signup");}} style={{fontSize:16,padding:"16px",borderRadius:16}}>Create Free Account →</button>
        <div style={{textAlign:"center",marginTop:12,fontSize:12,color:"rgba(232,234,240,.2)"}}>monitracker.com</div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     AUTH
  ═══════════════════════════════════════════════════════ */
  if(screen==="auth") return (
    <div style={{minHeight:"100vh",background:"#0A0E1A",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:-200,left:-200,width:600,height:600,background:"radial-gradient(circle,rgba(0,200,150,.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:420}} className="fade">
        <button onClick={()=>setScreen("landing")} style={{background:"transparent",border:"none",color:"rgba(232,234,240,.4)",fontSize:13,cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:30,fontWeight:800}}><span style={{color:"#00C896"}}>Moni</span> Tracker</div>
          <div style={{color:"rgba(232,234,240,.4)",fontSize:13,marginTop:4}}>Your financial companion</div>
        </div>
        <div className="card" style={{padding:28}}>
          {/* Tab switcher — only for login/signup */}
          {authMode!=="forgot" && (
            <div style={{display:"flex",gap:6,marginBottom:22,background:"rgba(255,255,255,.04)",borderRadius:12,padding:4}}>
              {["login","signup"].map(m=>(
                <button key={m} onClick={()=>{setAuthMode(m);setAuthError("");}} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:authMode===m?"#00C896":"transparent",color:authMode===m?"#0A0E1A":"rgba(232,234,240,.5)",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .2s"}}>
                  {m==="login"?"Sign In":"Create Account"}
                </button>
              ))}
            </div>
          )}
          {/* Forgot password header */}
          {authMode==="forgot" && (
            <div style={{marginBottom:20}}>
              <button onClick={()=>{setAuthMode("login");setAuthError("");}} style={{background:"transparent",border:"none",color:"rgba(232,234,240,.4)",fontSize:13,cursor:"pointer",marginBottom:12}}>← Back to Sign In</button>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800}}>Reset Password</div>
              <div style={{fontSize:13,color:"rgba(232,234,240,.4)",marginTop:4}}>Enter your email and choose a new password</div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {authMode==="signup" && <input className="field" placeholder="Full Name" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})}/>}
            <input className="field" type="email" placeholder="Email Address" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})}/>
            {authMode==="signup" && <input className="field" type="tel" placeholder="Phone Number (e.g. 08012345678)" value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:e.target.value})}/>}
            {authMode!=="forgot" && <input className="field" type="password" placeholder={authMode==="login"?"Password":"Password (min 6 characters)"} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} onKeyDown={e=>{ if(e.key==="Enter") authMode==="login"?handleLogin():handleSignup(); }}/>}
            {authMode==="forgot" && <input className="field" type="password" placeholder="New Password (min 6 characters)" value={authForm.newPassword} onChange={e=>setAuthForm({...authForm,newPassword:e.target.value})}/>}
            {authError && <div style={{background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.3)",borderRadius:10,padding:"10px 14px",color:"#FF6B6B",fontSize:13}}>{authError}</div>}
            <button className="btn-green" style={{marginTop:4}} onClick={authMode==="login"?handleLogin:authMode==="signup"?handleSignup:handleForgotPassword}>
              {authMode==="login"?"Sign In →":authMode==="signup"?"Create Account →":"Reset Password →"}
            </button>
            {authMode==="login" && <button onClick={()=>{setAuthMode("forgot");setAuthError("");}} style={{background:"transparent",border:"none",color:"rgba(0,200,150,.7)",fontSize:13,cursor:"pointer",textAlign:"center",padding:"4px"}}>Forgot Password?</button>}
          </div>
          {authMode==="login" && (
            <div style={{marginTop:18,padding:14,background:"rgba(0,200,150,.07)",borderRadius:12,border:"1px solid rgba(0,200,150,.15)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(232,234,240,.4)",letterSpacing:".5px",marginBottom:6}}>DEMO ACCOUNT</div>
              <div style={{fontSize:13,color:"rgba(232,234,240,.6)"}}>📧 demo@moni.app &nbsp;·&nbsp; 🔑 demo123</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     ONBOARDING
  ═══════════════════════════════════════════════════════ */
  if(screen==="onboard"){
    const step=ONBOARDING[onboardStep];
    return (
      <div style={{minHeight:"100vh",background:"#0A0E1A",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,fontFamily:"'DM Sans',sans-serif",color:"#E8EAF0"}}>
        <style>{CSS}</style>
        <div style={{maxWidth:340,width:"100%",textAlign:"center"}} className="fade" key={onboardStep}>
          <div style={{fontSize:76,marginBottom:24}}>{step.icon}</div>
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:25,fontWeight:800,marginBottom:14,lineHeight:1.2}}>{step.title}</h2>
          <p style={{fontSize:15,color:"rgba(232,234,240,.6)",lineHeight:1.75,marginBottom:36}}>{step.desc}</p>
          <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:32}}>
            {ONBOARDING.map((_,i)=><div key={i} style={{width:i===onboardStep?24:8,height:8,borderRadius:4,background:i===onboardStep?"#00C896":"rgba(255,255,255,.12)",transition:"all .3s"}}/>)}
          </div>
          <button className="btn-green" style={{fontSize:16,padding:"15px"}} onClick={()=>onboardStep<ONBOARDING.length-1?setOnboardStep(s=>s+1):finishOnboard()}>{step.btn}</button>
          {onboardStep>0&&<button onClick={()=>setOnboardStep(s=>s-1)} style={{background:"transparent",border:"none",color:"rgba(232,234,240,.25)",fontSize:13,cursor:"pointer",marginTop:14,display:"block",width:"100%"}}>← Back</button>}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     MAIN APP
  ═══════════════════════════════════════════════════════ */
  const TxCard=({t,actions=true})=>(
    <div className="card" style={{marginBottom:10,padding:"16px 18px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:13,background:t.type==="income"?"rgba(0,200,150,.15)":"rgba(255,107,107,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>
          {t.type==="income"?"💰":"💸"}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{fontSize:14,fontWeight:600}}>{t.category}</div>
            <div style={{fontSize:15,fontWeight:700,color:t.type==="income"?"#00C896":"#FF6B6B",flexShrink:0}}>{t.type==="income"?"+":"-"}{sym}{Number(t.amount).toLocaleString()}</div>
          </div>
          <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.note}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
            <div style={{fontSize:11,color:"rgba(232,234,240,.25)"}}>{t.date}</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span className={t.type==="income"?"tag-i":"tag-e"}>{t.type}</span>
              {actions&&<>
                <button onClick={()=>setEditTx({...t})} style={{background:"rgba(255,255,255,.07)",border:"none",color:"rgba(232,234,240,.6)",fontSize:11,padding:"3px 10px",borderRadius:7,cursor:"pointer",fontFamily:"DM Sans"}}>Edit</button>
                <button onClick={()=>setDeleteTx(t)} style={{background:"rgba(255,107,107,.1)",border:"none",color:"#FF6B6B",fontSize:11,padding:"3px 10px",borderRadius:7,cursor:"pointer",fontFamily:"DM Sans"}}>Delete</button>
              </>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const EditSheet=({tx,onSave,onClose})=>(
    <div className="overlay" onClick={onClose}>
      <div className="sheet fade" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800}}>{tx.id?.startsWith("tx_")?"Edit Transaction":"Confirm Transaction"}</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",color:"#E8EAF0",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:20}}>×</button>
        </div>
        {!tx.id?.startsWith("tx_")&&<div style={{fontSize:12,color:"#00C896",marginBottom:14}}>✦ AI parsed · review and confirm</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><div style={{fontSize:11,fontWeight:700,color:"rgba(232,234,240,.4)",marginBottom:6,letterSpacing:".5px"}}>TYPE</div>
            <select className="field" value={tx.type} onChange={e=>{ const u={...tx,type:e.target.value}; tx.id?.startsWith("tx_")?setEditTx(u):setParsedEntry(u); }}>
              <option value="income">💰 Income</option><option value="expense">💸 Expense</option>
            </select>
          </div>
          <div><div style={{fontSize:11,fontWeight:700,color:"rgba(232,234,240,.4)",marginBottom:6,letterSpacing:".5px"}}>AMOUNT ({sym})</div>
            <input className="field" type="number" value={tx.amount} onChange={e=>{ const u={...tx,amount:parseFloat(e.target.value)||0}; tx.id?.startsWith("tx_")?setEditTx(u):setParsedEntry(u); }}/>
          </div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,fontWeight:700,color:"rgba(232,234,240,.4)",marginBottom:6,letterSpacing:".5px"}}>CATEGORY</div>
            <select className="field" value={tx.category} onChange={e=>{ const u={...tx,category:e.target.value}; tx.id?.startsWith("tx_")?setEditTx(u):setParsedEntry(u); }}>
              {ALL_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,fontWeight:700,color:"rgba(232,234,240,.4)",marginBottom:6,letterSpacing:".5px"}}>NOTE</div>
            <input className="field" value={tx.note} onChange={e=>{ const u={...tx,note:e.target.value}; tx.id?.startsWith("tx_")?setEditTx(u):setParsedEntry(u); }}/>
          </div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,fontWeight:700,color:"rgba(232,234,240,.4)",marginBottom:6,letterSpacing:".5px"}}>DATE</div>
            <input className="field" type="date" value={tx.date} onChange={e=>{ const u={...tx,date:e.target.value}; tx.id?.startsWith("tx_")?setEditTx(u):setParsedEntry(u); }}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn-green" onClick={onSave} style={{flex:2}}>✓ {tx.id?.startsWith("tx_")?"Save Changes":"Add Transaction"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0A0E1A",fontFamily:"'DM Sans',sans-serif",color:"#E8EAF0",position:"relative"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:-200,left:-200,width:600,height:600,background:"radial-gradient(circle,rgba(0,200,150,.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:-200,right:-200,width:500,height:500,background:"radial-gradient(circle,rgba(108,99,255,.06) 0%,transparent 70%)",pointerEvents:"none"}}/>

      {/* Notification */}
      {notification&&<div className="fade" style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,background:notification.type==="error"?"#FF6B6B":notification.type==="warn"?"#FFD93D":"#00C896",color:"#0A0E1A",padding:"12px 22px",borderRadius:14,fontWeight:700,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,.4)",whiteSpace:"nowrap",maxWidth:"88vw",textAlign:"center"}}>{notification.msg}</div>}

      {/* ── Sheets ── */}
      {showCurrency&&<div className="overlay" onClick={()=>setShowCurrency(false)}><div className="sheet fade" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800}}>Choose Currency</div><button onClick={()=>setShowCurrency(false)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"#E8EAF0",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:20}}>×</button></div>
        {CURRENCIES.map(c=><div key={c.code} onClick={()=>changeCurrency(c)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:13,cursor:"pointer",background:currency.code===c.code?"rgba(0,200,150,.1)":"transparent",border:currency.code===c.code?"1px solid rgba(0,200,150,.3)":"1px solid transparent",marginBottom:4}}>
          <span style={{fontSize:24}}>{c.flag}</span><div style={{flex:1}}><div style={{fontWeight:600}}>{c.name}</div><div style={{fontSize:12,color:"rgba(232,234,240,.4)"}}>{c.code} · {c.symbol}</div></div>
          {currency.code===c.code&&<span style={{color:"#00C896",fontSize:18,fontWeight:700}}>✓</span>}
        </div>)}
      </div></div>}

      {showSettings&&<div className="overlay" onClick={()=>setShowSettings(false)}><div className="sheet fade" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800}}>Settings</div><button onClick={()=>setShowSettings(false)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"#E8EAF0",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:20}}>×</button></div>
        <div className="card" style={{marginBottom:12,padding:18}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:50,height:50,borderRadius:15,background:"linear-gradient(135deg,#00C896,#6C63FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#0A0E1A"}}>{currentUser?.name?.[0]?.toUpperCase()}</div>
            <div><div style={{fontWeight:700,fontSize:16}}>{currentUser?.name}</div><div style={{fontSize:12,color:"rgba(232,234,240,.4)"}}>{currentUser?.email}</div>
            <span style={{display:"inline-block",marginTop:4,padding:"2px 10px",borderRadius:20,background:"rgba(0,200,150,.15)",color:"#00C896",fontSize:11,fontWeight:700}}>{currentUser?.plan||"free"} plan</span></div>
          </div>
        </div>
        <div className="card" style={{marginBottom:12,padding:18}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(232,234,240,.4)",letterSpacing:".5px",marginBottom:12}}>DISPLAY CURRENCY</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{currency.flag}</span><div><div style={{fontWeight:600}}>{currency.name}</div><div style={{fontSize:12,color:"rgba(232,234,240,.4)"}}>{currency.code}</div></div></div>
            <button className="btn-ghost" onClick={()=>{setShowSettings(false);setShowCurrency(true);}} style={{padding:"8px 14px",fontSize:12}}>Change</button>
          </div>
        </div>
        <div className="card" style={{marginBottom:12,padding:18}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(232,234,240,.4)",letterSpacing:".5px",marginBottom:10}}>STATS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{l:"Transactions",v:transactions.length},{l:"Income entries",v:transactions.filter(t=>t.type==="income").length}].map(s=>(
              <div key={s.l} style={{textAlign:"center",padding:12,background:"rgba(255,255,255,.03)",borderRadius:10}}>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:"#00C896"}}>{s.v}</div>
                <div style={{fontSize:11,color:"rgba(232,234,240,.4)",marginTop:3}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=>{setShowSettings(false);setShowPlans(true);}} style={{width:"100%",padding:14,borderRadius:13,border:"1px solid rgba(108,99,255,.3)",background:"rgba(108,99,255,.08)",color:"#A78BFA",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:10}}>✦ Upgrade to Pro</button>
        <button onClick={handleLogout} style={{width:"100%",padding:14,borderRadius:13,border:"1px solid rgba(255,107,107,.3)",background:"rgba(255,107,107,.08)",color:"#FF6B6B",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:15,cursor:"pointer"}}>Sign Out</button>
      </div></div>}

      {showPlans&&<div className="overlay" onClick={()=>setShowPlans(false)}><div className="sheet fade" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800}}>Choose Your Plan</div><button onClick={()=>setShowPlans(false)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"#E8EAF0",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:20}}>×</button></div>
        {Object.values(PLANS).map((p,i)=>(
          <div key={p.name} style={{padding:20,borderRadius:16,border:`2px solid ${p.color}40`,background:`${p.color}08`,marginBottom:12,position:"relative"}}>
            {i===1&&<div style={{position:"absolute",top:12,right:14,background:p.color,color:"#0A0E1A",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>POPULAR</div>}
            <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:p.color,marginBottom:2}}>{p.name}</div>
            <div style={{fontSize:17,fontWeight:700,marginBottom:14}}>{p.price}</div>
            {p.features.map(f=><div key={f} style={{fontSize:13,color:"rgba(232,234,240,.65)",marginBottom:6}}>✓ {f}</div>)}
            <button onClick={()=>{setShowPlans(false);notify(i===0?"You're already on the Free plan ✅":"Pro plan coming soon — stay tuned! 🚀");}} style={{width:"100%",marginTop:14,padding:"12px",borderRadius:12,border:`1px solid ${p.color}`,background:i===1?p.color:"transparent",color:i===1?"#0A0E1A":p.color,fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>
              {i===0?"Current Plan":"Get Pro →"}
            </button>
          </div>
        ))}
      </div></div>}

      {showBudgets&&<div className="overlay" onClick={()=>setShowBudgets(false)}><div className="sheet fade" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800}}>Monthly Budgets</div><button onClick={()=>setShowBudgets(false)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"#E8EAF0",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:20}}>×</button></div>
        <div style={{fontSize:13,color:"rgba(232,234,240,.4)",marginBottom:20}}>Set a spending limit per category. You'll be alerted at 80% and 100%.</div>
        {CATEGORIES.expense.map(cat=>{ const u=getBudgetUsage(cat); return (
          <div key={cat} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:14,fontWeight:500}}>{cat}</span>
              {u&&<span style={{fontSize:12,fontWeight:700,color:u.pct>=100?"#FF6B6B":u.pct>=80?"#FFD93D":"#00C896"}}>{sym}{u.spent.toLocaleString()} / {sym}{u.limit.toLocaleString()}</span>}
            </div>
            <input className="field" type="number" placeholder={`Limit for ${cat} (${sym})`} value={budgetEdit[cat]??budgets[cat]??""} onChange={e=>setBudgetEdit({...budgetEdit,[cat]:e.target.value})} style={{padding:"10px 14px",fontSize:14}}/>
            {u&&<div style={{marginTop:5,height:5,background:"rgba(255,255,255,.07)",borderRadius:10}}><div style={{height:"100%",borderRadius:10,background:u.pct>=100?"#FF6B6B":u.pct>=80?"#FFD93D":"#00C896",width:`${u.pct}%`,transition:"width .6s"}}/></div>}
          </div>
        ); })}
        <button className="btn-green" onClick={saveBudgets} style={{marginTop:8}}>Save Budgets</button>
      </div></div>}

      {showAddSheet&&parsedEntry&&<EditSheet tx={parsedEntry} onSave={confirmAdd} onClose={()=>{setShowAddSheet(false);setParsedEntry(null);}}/>}
      {editTx&&<EditSheet tx={editTx} onSave={confirmEdit} onClose={()=>setEditTx(null)}/>}
      {deleteTx&&<div className="overlay" onClick={()=>setDeleteTx(null)}><div className="sheet fade" onClick={e=>e.stopPropagation()} style={{padding:28}}>
        <div style={{textAlign:"center",marginBottom:22}}><div style={{fontSize:40,marginBottom:12}}>🗑️</div><div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:8}}>Delete this transaction?</div><div style={{fontSize:14,color:"rgba(232,234,240,.5)"}}>"{deleteTx.note}"</div><div style={{fontSize:15,fontWeight:700,color:"#FF6B6B",marginTop:4}}>{sym}{Number(deleteTx.amount).toLocaleString()}</div><div style={{fontSize:13,color:"rgba(232,234,240,.3)",marginTop:6}}>This cannot be undone.</div></div>
        <div style={{display:"flex",gap:10}}><button className="btn-ghost" onClick={()=>setDeleteTx(null)} style={{flex:1}}>Cancel</button><button onClick={confirmDelete} style={{flex:2,padding:14,borderRadius:13,border:"none",background:"#FF6B6B",color:"#fff",fontFamily:"DM Sans",fontWeight:700,fontSize:15,cursor:"pointer"}}>Delete</button></div>
      </div></div>}

      {/* HEADER */}
      <div style={{padding:"18px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"rgba(10,14,26,.92)",backdropFilter:"blur(16px)",zIndex:10,borderBottom:"1px solid rgba(255,255,255,.05)"}}>
        <div><div style={{fontFamily:"Syne,sans-serif",fontSize:21,fontWeight:800}}><span style={{color:"#00C896"}}>Moni</span> Tracker</div><div style={{fontSize:11,color:"rgba(232,234,240,.3)"}}>Hi {currentUser?.name?.split(" ")[0]} 👋</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={fetchInsights} style={{background:"rgba(0,200,150,.1)",border:"1px solid rgba(0,200,150,.2)",borderRadius:11,padding:"8px 13px",color:"#00C896",fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:"pointer"}}>✦ AI</button>
          <button onClick={()=>setShowCurrency(true)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:11,padding:"7px 12px",color:"#E8EAF0",fontFamily:"DM Sans",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <span>{currency.flag}</span><span style={{fontWeight:700}}>{currency.code}</span>
          </button>
          <button onClick={()=>setShowSettings(true)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:11,width:37,height:37,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:"#E8EAF0"}}>⚙</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"18px 20px 100px",maxWidth:480,margin:"0 auto"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&<div className="fade">
          {/* Balance card */}
          <div style={{background:"linear-gradient(135deg,#00C896,#009e76)",borderRadius:22,padding:"24px 24px 22px",marginBottom:16,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,background:"rgba(255,255,255,.08)",borderRadius:"50%"}}/>
            <div style={{position:"absolute",bottom:-40,left:50,width:110,height:110,background:"rgba(255,255,255,.05)",borderRadius:"50%"}}/>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(10,14,26,.6)",letterSpacing:".5px",marginBottom:6}}>TOTAL BALANCE</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:36,fontWeight:800,color:"#0A0E1A",letterSpacing:"-1px"}}>{fmt(balance,sym)}</div>
            <div style={{display:"flex",gap:12,marginTop:16,flexWrap:"wrap"}}>
              {[{l:"INCOME",v:fmt(totalIncome,sym),e:"↑"},{l:"EXPENSES",v:fmt(totalExpense,sym),e:"↓"},{l:"SAVE RATE",v:`${saveRate}%`,e:"★"}].map(s=>(
                <div key={s.l} style={{background:"rgba(10,14,26,.18)",borderRadius:11,padding:"9px 13px"}}>
                  <div style={{fontSize:9,color:"rgba(10,14,26,.55)",fontWeight:700,marginBottom:2}}>{s.e} {s.l}</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#0A0E1A"}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget alerts */}
          {CATEGORIES.expense.filter(c=>{ const u=getBudgetUsage(c); return u&&u.pct>=80; }).slice(0,2).map(c=>{ const u=getBudgetUsage(c); return (
            <div key={c} style={{background:u.pct>=100?"rgba(255,107,107,.08)":"rgba(255,217,61,.08)",border:`1px solid ${u.pct>=100?"rgba(255,107,107,.3)":"rgba(255,217,61,.3)"}`,borderRadius:13,padding:"11px 15px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:600,color:u.pct>=100?"#FF6B6B":"#FFD93D"}}>{u.pct>=100?"🚨":"⚠️"} {c} {u.pct>=100?"exceeded":"alert"}</span>
              <span style={{fontSize:12,color:"rgba(232,234,240,.5)"}}>{sym}{u.spent.toLocaleString()} / {sym}{u.limit.toLocaleString()}</span>
            </div>
          ); })}

          {/* Input box */}
          <div className="card" style={{marginBottom:16}}>
            <div className="section-label">ADD TRANSACTION</div>
            <textarea className="field" rows={2} placeholder={`"Spent ${sym}5k on food" · "Received ${sym}150k salary"`} value={inputText} onChange={e=>setInputText(e.target.value)}/>
            {voiceStatus&&<div style={{fontSize:12,color:recording?"#FF6B6B":"#00C896",marginTop:8,display:"flex",alignItems:"center",gap:6}}>
              {recording&&<span className="pulse">🔴</span>} {voiceStatus}
            </div>}
            <div style={{display:"flex",gap:10,marginTop:10}}>
              <button className="btn-ghost" onClick={handleVoice} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px",borderColor:recording?"rgba(255,107,107,.4)":"rgba(255,255,255,.15)",color:recording?"#FF6B6B":"#E8EAF0"}}>
                <span style={{fontSize:17}}>{recording?"⏹":"🎙️"}</span>
                <span style={{fontSize:13}}>{recording?"Stop":"Voice"}</span>
              </button>
              <button className="btn-green" onClick={handleProcess} disabled={!inputText.trim()||processing} style={{flex:2,borderRadius:12,padding:"11px",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {processing?<><span className="spin">⟳</span> Processing...</>:<>✦ Add with AI</>}
              </button>
            </div>
            {/* Quick tags */}
            <div style={{display:"flex",gap:7,marginTop:10,flexWrap:"wrap"}}>
              {["Food","Transport","Salary","Shopping"].map(c=>(
                <button key={c} onClick={()=>setInputText(`Spent on ${c}`)} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:20,padding:"6px 12px",color:"rgba(232,234,240,.65)",fontFamily:"DM Sans",fontSize:12,cursor:"pointer"}}>+ {c}</button>
              ))}
            </div>
          </div>

          {/* Empty state for new users */}
          {transactions.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:48,marginBottom:16}}>📊</div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:8}}>Your balance starts at zero</div>
              <div style={{fontSize:14,color:"rgba(232,234,240,.4)",lineHeight:1.7}}>Add your first income or expense above to get started. Try saying: <span style={{color:"#00C896"}}>"Received {sym}50,000 salary"</span></div>
            </div>
          )}

          {/* Recent transactions */}
          {transactions.length>0&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div className="section-label" style={{marginBottom:0}}>RECENT</div>
              <button onClick={()=>setTab("transactions")} style={{background:"transparent",border:"none",color:"#00C896",fontSize:12,cursor:"pointer",fontFamily:"DM Sans",fontWeight:700}}>See all →</button>
            </div>
            {transactions.slice(0,5).map(t=><TxCard key={t.id} t={t}/>)}
          </>}
        </div>}

        {/* ── TRANSACTIONS ── */}
        {tab==="transactions"&&<div className="fade">
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {["all","income","expense"].map(f=>(
              <button key={f} onClick={()=>setFilterType(f)} style={{flex:1,padding:"9px",borderRadius:11,border:"none",background:filterType===f?f==="income"?"#00C896":f==="expense"?"#FF6B6B":"#6C63FF":"rgba(255,255,255,.06)",color:filterType===f?"#0A0E1A":"#E8EAF0",fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize",transition:"all .2s"}}>
                {f}
              </button>
            ))}
          </div>
          <div className="section-label">{filtered.length} TRANSACTIONS</div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"rgba(232,234,240,.35)"}}>
            <div style={{fontSize:36,marginBottom:10}}>📭</div>No transactions yet. Add one from the Home tab!
          </div>}
          {filtered.map(t=><TxCard key={t.id} t={t}/>)}
        </div>}

        {/* ── REPORTS ── */}
        {tab==="reports"&&<div className="fade">
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {["weekly","monthly","yearly"].map(p=>(
              <button key={p} onClick={()=>setReportPeriod(p)} style={{flex:1,padding:"9px",borderRadius:11,border:"none",background:reportPeriod===p?"#00C896":"rgba(255,255,255,.06)",color:reportPeriod===p?"#0A0E1A":"#E8EAF0",fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize",transition:"all .2s"}}>{p}</button>
            ))}
          </div>
          <button onClick={()=>exportPDF(transactions,currency,reportPeriod,currentUser?.name||"User")} style={{width:"100%",marginBottom:14,padding:"13px",borderRadius:13,border:"1px solid rgba(0,200,150,.3)",background:"rgba(0,200,150,.07)",color:"#00C896",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            📄 Export {reportPeriod.charAt(0).toUpperCase()+reportPeriod.slice(1)} Report as PDF
          </button>
          <button onClick={()=>setShowBudgets(true)} style={{width:"100%",marginBottom:16,padding:"13px",borderRadius:13,border:"1px solid rgba(108,99,255,.3)",background:"rgba(108,99,255,.07)",color:"#A78BFA",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            🎯 Manage Monthly Budgets
          </button>
          {transactions.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"rgba(232,234,240,.35)"}}>
            <div style={{fontSize:36,marginBottom:10}}>📊</div>Add transactions to see your reports
          </div>}
          {transactions.length>0&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[{l:"Income",v:fmt(totalIncome,sym),c:"#00C896",i:"↑"},{l:"Expenses",v:fmt(totalExpense,sym),c:"#FF6B6B",i:"↓"},{l:"Balance",v:fmt(balance,sym),c:"#6C63FF",i:"★"},{l:"Save Rate",v:`${saveRate}%`,c:"#FFD93D",i:"%"}].map(s=>(
                <div key={s.l} className="card" style={{textAlign:"center",padding:16}}>
                  <div style={{fontSize:18,color:s.c,marginBottom:4}}>{s.i}</div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:"rgba(232,234,240,.4)",marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
            {expenseCats.length>0&&<div className="card" style={{marginBottom:12}}>
              <div className="section-label">EXPENSE BREAKDOWN</div>
              <ResponsiveContainer width="100%" height={185}><PieChart><Pie data={expenseCats} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">{expenseCats.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>`${sym}${v.toLocaleString()}`} contentStyle={{background:"#1A1F2E",border:"none",borderRadius:10,color:"#E8EAF0"}}/></PieChart></ResponsiveContainer>
              {expenseCats.slice(0,5).map((c,i)=><div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,background:COLORS[i%COLORS.length]}}/><span style={{fontSize:13}}>{c.name}</span></div><span style={{fontSize:13,fontWeight:700}}>{sym}{c.value.toLocaleString()}</span></div>)}
            </div>}
            <div className="card" style={{marginBottom:12}}>
              <div className="section-label">INCOME VS EXPENSES BY DAY</div>
              <ResponsiveContainer width="100%" height={170}><BarChart data={getBarData()} barSize={12}><XAxis dataKey="day" tick={{fill:"rgba(232,234,240,.4)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:"#1A1F2E",border:"none",borderRadius:10,color:"#E8EAF0"}} formatter={v=>`${sym}${v.toLocaleString()}`}/><Bar dataKey="income" fill="#00C896" radius={[5,5,0,0]} name="Income"/><Bar dataKey="expense" fill="#FF6B6B" radius={[5,5,0,0]} name="Expense"/><Legend wrapperStyle={{fontSize:12,color:"rgba(232,234,240,.4)"}}/></BarChart></ResponsiveContainer>
            </div>
            <div className="card">
              <div className="section-label">6-MONTH BALANCE TREND</div>
              <ResponsiveContainer width="100%" height={150}><LineChart data={getTrendData()}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis dataKey="month" tick={{fill:"rgba(232,234,240,.4)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:"#1A1F2E",border:"none",borderRadius:10,color:"#E8EAF0"}} formatter={v=>`${sym}${v.toLocaleString()}`}/><Line type="monotone" dataKey="balance" stroke="#6C63FF" strokeWidth={2.5} dot={{fill:"#6C63FF",r:3}}/></LineChart></ResponsiveContainer>
            </div>
          </>}
        </div>}

        {/* ── INSIGHTS ── */}
        {tab==="insights"&&<div className="fade">
          <div style={{background:"linear-gradient(135deg,rgba(108,99,255,.18),rgba(0,200,150,.08))",border:"1px solid rgba(108,99,255,.25)",borderRadius:20,padding:22,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <span style={{fontSize:26}}>✨</span>
              <div><div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800}}>Moni AI Advisor</div><div style={{fontSize:12,color:"rgba(232,234,240,.4)"}}>Personalised for your finances</div></div>
            </div>
            {aiLoading&&<div style={{textAlign:"center",padding:36}}><div style={{fontSize:30,marginBottom:10}} className="pulse">🤖</div><div style={{color:"rgba(232,234,240,.4)",fontSize:13}}>Analysing your finances...</div></div>}
            {!aiLoading&&aiError&&<div style={{background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.25)",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{color:"#FF6B6B",fontWeight:600,marginBottom:6}}>⚠️ Couldn't load insights</div>
              <div style={{fontSize:13,color:"rgba(232,234,240,.5)",marginBottom:12}}>{aiError}</div>
              <button className="btn-green" onClick={fetchInsights} style={{borderRadius:10,padding:"10px"}}>Try Again</button>
            </div>}
            {!aiLoading&&!aiError&&aiInsight&&<>
              <div style={{fontSize:14,lineHeight:1.85,color:"rgba(232,234,240,.85)",whiteSpace:"pre-wrap"}}>{aiInsight}</div>
              <button className="btn-ghost" onClick={fetchInsights} style={{marginTop:14,width:"100%",fontSize:13}}>↻ Refresh Insights</button>
            </>}
            {!aiLoading&&!aiError&&!aiInsight&&<div style={{textAlign:"center",padding:24}}>
              <div style={{fontSize:13,color:"rgba(232,234,240,.4)",marginBottom:16}}>{transactions.length===0?"Add some transactions first, then get personalised AI analysis.":"Get personalised AI analysis of your spending habits."}</div>
              <button className="btn-green" onClick={fetchInsights} disabled={transactions.length===0} style={{borderRadius:12,padding:"12px 24px",width:"auto"}}>Get My Insights ✨</button>
            </div>}
          </div>
          {/* Budget overview */}
          {Object.keys(budgets).length>0&&<div className="card" style={{marginBottom:12}}>
            <div className="section-label">BUDGET TRACKER</div>
            {Object.keys(budgets).map((cat,i)=>{ const u=getBudgetUsage(cat); if(!u) return null; return (
              <div key={cat} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13}}>{cat}</span><span style={{fontSize:12,fontWeight:700,color:u.pct>=100?"#FF6B6B":u.pct>=80?"#FFD93D":"#00C896"}}>{sym}{u.spent.toLocaleString()} / {sym}{u.limit.toLocaleString()}</span></div>
                <div style={{height:7,background:"rgba(255,255,255,.07)",borderRadius:10}}><div style={{height:"100%",borderRadius:10,background:u.pct>=100?"#FF6B6B":u.pct>=80?"#FFD93D":COLORS[i%COLORS.length],width:`${u.pct}%`,transition:"width .8s"}}/></div>
              </div>
            ); })}
            <button onClick={()=>setShowBudgets(true)} className="btn-ghost" style={{width:"100%",fontSize:13,marginTop:4}}>Edit Budgets</button>
          </div>}
          {expenseCats.length>0&&<div className="card">
            <div className="section-label">TOP SPENDING</div>
            {expenseCats.slice(0,5).map((c,i)=>(
              <div key={c.name} style={{marginBottom:13}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13}}>{c.name}</span><span style={{fontSize:13,fontWeight:700,color:"#FF6B6B"}}>{sym}{c.value.toLocaleString()}</span></div>
                <div style={{height:6,background:"rgba(255,255,255,.07)",borderRadius:10}}><div style={{height:"100%",borderRadius:10,background:COLORS[i],width:`${(c.value/expenseCats[0].value)*100}%`,transition:"width .8s"}}/></div>
              </div>
            ))}
          </div>}
          {transactions.length===0&&!aiInsight&&<div style={{textAlign:"center",padding:"30px 20px",color:"rgba(232,234,240,.35)"}}>
            <div style={{fontSize:36,marginBottom:10}}>💡</div>Add transactions to unlock spending insights
          </div>}
        </div>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,14,26,.96)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,.06)",padding:"6px 0 14px",display:"flex",justifyContent:"space-around"}}>
        {[{id:"dashboard",icon:"⊞",l:"Home"},{id:"transactions",icon:"↕",l:"History"},{id:"reports",icon:"◎",l:"Reports"},{id:"insights",icon:"✦",l:"Insights"}].map(n=>(
          <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:20}}>{n.icon}</span><span>{n.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
