import { useState, useRef, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, CartesianGrid } from "recharts";

/* ── helpers ── */
const safeGet=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const safeDel=(k)=>{try{localStorage.removeItem(k);}catch{}};

const COLORS=["#00C896","#6C63FF","#FFD93D","#FF6B6B","#4ECDC4","#A78BFA","#F97316","#22D3EE","#FB923C","#34D399","#E879F9","#38BDF8"];
const CURRENCIES={NGN:{sym:"₦",name:"Nigerian Naira"},USD:{sym:"$",name:"US Dollar"},GBP:{sym:"£",name:"British Pound"},EUR:{sym:"€",name:"Euro"},GHS:{sym:"₵",name:"Ghanaian Cedi"},KES:{sym:"KSh",name:"Kenyan Shilling"}};
const CATEGORIES={
  expense:["Food & Dining","Transport","Housing","Shopping","Entertainment","Healthcare","Utilities","Education","Gift & Donations","Business Expense","Electronics & Gadgets","Personal Care","Other Expense"],
  income:["Salary","Freelance","Business Income","Investment Returns","Gift Received","Rental Income","Side Hustle","Other Income"]
};

/* ── SMART AMOUNT PARSER (v5 fix: no more iPhone 16 = ₦16) ──
   Strategy:
   1. Look for amount AFTER price keywords: "for", "cost", "spent", "worth", "paid", "at"
   2. Expand shorthand: 3m → 3000000, 50k → 50000, "three million" → 3000000
   3. Prefer numbers with ₦ sign or price keywords over bare model numbers
   4. If text has model-number pattern (brand + short number < 100), skip those
*/
function smartParseAmount(text) {
  let t = text;

  // Step 1: expand written-out numbers (Nigerian common patterns)
  const writtenMap = {
    "one hundred thousand": 100000, "two hundred thousand": 200000, "three hundred thousand": 300000,
    "four hundred thousand": 400000, "five hundred thousand": 500000, "six hundred thousand": 600000,
    "seven hundred thousand": 700000, "eight hundred thousand": 800000, "nine hundred thousand": 900000,
    "one million": 1000000, "two million": 2000000, "three million": 3000000, "four million": 4000000,
    "five million": 5000000, "ten million": 10000000, "fifty thousand": 50000, "twenty thousand": 20000,
    "thirty thousand": 30000, "forty thousand": 40000, "fifteen thousand": 15000, "ten thousand": 10000,
    "five thousand": 5000, "two thousand": 2000, "one thousand": 1000, "hundred thousand": 100000,
    "half million": 500000, "quarter million": 250000,
  };
  for (const [phrase, val] of Object.entries(writtenMap)) {
    if (t.toLowerCase().includes(phrase)) {
      t = t.toLowerCase().replace(phrase, String(val));
    }
  }

  // Step 2: expand k/m shorthand
  t = t.replace(/(\d+\.?\d*)\s*million\b/gi, (_,n) => String(parseFloat(n)*1000000));
  t = t.replace(/(\d+\.?\d*)\s*thousand\b/gi, (_,n) => String(parseFloat(n)*1000));
  t = t.replace(/(\d+\.?\d*)\s*m\b/gi, (_,n) => String(parseFloat(n)*1000000));
  t = t.replace(/(\d+\.?\d*)\s*k\b/gi, (_,n) => String(parseFloat(n)*1000));

  const lower = t.toLowerCase();

  // Step 3: Find numbers that are DEFINITELY amounts (have ₦ sign right before/after)
  const currencyMatch = t.match(/[₦$£€₵]\s?(\d[\d,\.]*)/);
  if (currencyMatch) {
    const amt = parseFloat(currencyMatch[1].replace(/,/g,""));
    if (amt > 0) return amt;
  }

  // Step 4: Find amount AFTER price keywords
  const priceKeywords = /\b(for|cost|costs|costing|spent|spend|paid|pay|worth|price|priced|at|about|around|approximately|roughly)\s+[₦$£€₵]?\s?(\d[\d,\.]*)/i;
  const afterKeyword = t.match(priceKeywords);
  if (afterKeyword) {
    const amt = parseFloat(afterKeyword[2].replace(/,/g,""));
    if (amt > 100) return amt; // model numbers are usually < 100 or 2-4 digits like "16", "14 Pro"
  }

  // Step 5: Find the LARGEST number in the string (most likely the price, not model number)
  // But exclude numbers that look like model identifiers (directly attached to brand names)
  const brandModelPattern = /\b(iphone|samsung|tecno|infinix|itel|huawei|xiaomi|oppo|vivo|realme|nokia|toyota|honda|lexus|benz|ford|hyundai|kia|ps|playstation|xbox|galaxy|redmi|poco|note)\s*\d+/gi;
  const cleanedText = t.replace(brandModelPattern, (match) => {
    // Replace the model number part with placeholder so it won't be picked
    return match.replace(/\d+/g, "MODEL");
  });

  const allNums = [];
  const numRx = /(\d[\d,\.]*)/g;
  let m;
  while ((m = numRx.exec(cleanedText)) !== null) {
    const n = parseFloat(m[1].replace(/,/g,""));
    if (!isNaN(n) && n > 0) allNums.push(n);
  }

  if (allNums.length === 0) return 0;

  // Return largest number (most likely to be a price)
  const largest = Math.max(...allNums);
  return largest > 0 ? largest : 0;
}

/* ── LOCAL PARSER v5 ── */
function localParse(text) {
  const lower = text.toLowerCase();
  const amount = smartParseAmount(text);

  const isIncome = /\b(earn|receiv|got paid|salary|income|made|credit|profit|sold|sale|freelance revenue|paid me|transferred|transfer in|received|got)\b/.test(lower);
  const type = isIncome ? "income" : "expense";
  let category = type==="income" ? "Other Income" : "Other Expense";

  // Electronics detection FIRST (before generic "buy/purchase" rules)
  const electronicsRx = /\b(iphone|samsung|tecno|infinix|itel|huawei|xiaomi|oppo|vivo|realme|nokia|phone|smartphone|laptop|computer|tablet|ipad|macbook|dell|hp|lenovo|asus|tv|television|screen|monitor|headphone|earphone|airpod|speaker|camera|playstation|xbox|ps\d|console|gadget|electronics|charger|power bank|powerbank|memory card|hard drive|ssd|router|modem|printer|keyboard|mouse|watch|smartwatch)\b/;

  const rules=[
    [electronicsRx, "Electronics & Gadgets"],
    [/\b(food|eat|restaurant|groceries|lunch|dinner|breakfast|bukka|market|shoprite|suya|rice|beans|pepper|snack|drink|beer|wine|water sachet|pure water|biscuit|indomie|bread|egg|chicken|fish|meat|vegetable|fruit|juice|soda|eatery|canteen|cafeteria)\b/,"Food & Dining"],
    [/\b(uber|bolt|taxi|bus|transport|fuel|petrol|keke|okada|danfo|ride|traffic|brt|road|car wash|parking|vehicle|motorcycle|bike|tyre|mechanic|engine oil|auto|ferry|boat)\b/,"Transport"],
    [/\b(rent|house|apartment|landlord|property|estate|hostel|lodge|accommodation|furniture|appliance|cleaning|maintenance|repair|generator|diesel|kerosene)\b/,"Housing"],
    [/\b(salary|paycheck|wage|payroll|allowance|bonus|13th month)\b/,"Salary"],
    [/\b(freelance|project|client|design|contract|gig|commission|consultation|service charge|professional)\b/,"Freelance"],
    [/\b(invest|dividend|stock|crypto|piggybank|cowrywise|shares|interest|return|roi|forex)\b/,"Investment Returns"],
    [/\b(shop|cloth|fashion|shoe|bag|zara|jumia|konga|primark|h&m|uniqlo|cloth|dress|shirt|trouser|jean|skirt|blouse|native|aso|cap|hat|belt|wallet|sunglass)\b/,"Shopping"],
    [/\b(netflix|movie|cinema|fun|entertain|spotify|concert|party|outing|hangout|game|gaming|steam|club|bar|lounge|karaoke|bowling|event|ticket)\b/,"Entertainment"],
    [/\b(doctor|hospital|pharmacy|drug|health|clinic|medic|medicine|test|scan|surgery|dental|eye|optical|malaria|paracetamol|lab|chemist)\b/,"Healthcare"],
    [/\b(electric|nepa|phcn|water bill|internet|wifi|mtn|airtel|glo|9mobile|data|bill|utility|subscription|dstv|gotv|startimes|cable|toll|waste|sanitation)\b/,"Utilities"],
    [/\b(school|tuition|book|course|training|education|exam|waec|jamb|neco|uni|university|college|study|lesson|tutorial|certification)\b/,"Education"],
    [/\b(church|tithe|offering|donate|charity|gift|present|birthday|anniversary|wedding|funeral|contribution|levy|dues)\b/,"Gift & Donations"],
    [/\b(business|sale|product|revenue|profit|stock|inventory|raw material|goods|wholesale|retail|trade|market stall)\b/,"Business Income"],
    [/\b(hair|barber|salon|spa|massage|nails|manicure|pedicure|skincare|makeup|perfume|cream|lotion|deodorant|soap|shampoo|personal)\b/,"Personal Care"],
  ];

  for(const [rx,cat] of rules){ if(rx.test(lower)){ category=cat; break; } }

  // Route to AI if: has brand+model pattern, or amount is 0, or unclear
  const hasModelNumber = /\b(iphone|samsung|galaxy|tecno|infinix|macbook|ipad)\s*\d+/i.test(text);
  const confidence = amount > 0 ? (hasModelNumber ? 0.6 : 0.9) : 0.2;

  return { type, amount, category, note:text, date:new Date().toISOString().split("T")[0], confidence };
}

/* ── AI CALL ── */
async function callAI(messages, apiKey) {
  // Try Vercel serverless first
  try {
    const r = await fetch("/api/ai", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ messages, max_tokens:400 }),
    });
    if (r.ok) { const d=await r.json(); return d.content?.[0]?.text||""; }
  } catch {}
  // Fallback: direct Anthropic API
  if (!apiKey) throw new Error("No API key");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body: JSON.stringify({ model:"claude-haiku-3-5-20241022", max_tokens:400, messages }),
  });
  if (!r.ok) throw new Error(`API ${r.status}`);
  const d=await r.json();
  return d.content?.[0]?.text||"";
}

/* ── STYLES ── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0A0E1A;color:#E8EAF0;font-family:'DM Sans',sans-serif;min-height:100vh;overflow-x:hidden;}
.app{max-width:430px;margin:0 auto;min-height:100vh;position:relative;}
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px;margin-bottom:12px;}
.field{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 15px;color:#E8EAF0;font-family:'DM Sans',sans-serif;font-size:15px;outline:none;resize:none;transition:border-color .2s;}
.field:focus{border-color:rgba(0,200,150,.5);}
.btn-green{background:linear-gradient(135deg,#00C896,#00A878);border:none;border-radius:14px;padding:13px 20px;color:#0A0E1A;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;cursor:pointer;width:100%;transition:opacity .2s,transform .1s;}
.btn-green:hover{opacity:.92;}
.btn-green:active{transform:scale(.98);}
.btn-green:disabled{opacity:.4;cursor:not-allowed;}
.btn-ghost{background:transparent;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:11px 18px;color:#E8EAF0;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;}
.btn-ghost:hover{background:rgba(255,255,255,.05);}
.section-label{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;color:rgba(232,234,240,.35);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:12px;}
.nav-btn{background:transparent;border:none;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 10px;color:rgba(232,234,240,.35);font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;cursor:pointer;transition:color .2s;}
.nav-btn.active{color:#00C896;}
.fade{animation:fadeIn .3s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.pulse{animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
.spin{display:inline-block;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.shake{animation:shake .4s;}
@keyframes shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}
.notify{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;padding:13px 22px;border-radius:14px;font-size:14px;font-weight:600;max-width:340px;text-align:center;animation:slideDown .3s ease;}
@keyframes slideDown{from{opacity:0;transform:translate(-50%,-16px);}to{opacity:1;transform:translate(-50%,0);}}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px);}
.modal{background:#131828;border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:430px;max-height:80vh;overflow-y:auto;border-top:1px solid rgba(255,255,255,.1);}
.voice-review{background:rgba(0,200,150,.06);border:1px solid rgba(0,200,150,.2);border-radius:14px;padding:14px;margin-top:10px;}
`;

/* ── NOTIFICATION ── */
let notifyTimer;
function useNotify() {
  const [msg,setMsg]=useState(null);
  const notify=useCallback((text,type="success")=>{
    clearTimeout(notifyTimer);
    setMsg({text,type});
    notifyTimer=setTimeout(()=>setMsg(null),3200);
  },[]);
  return [msg,notify];
}

/* ── FORMAT ── */
const fmt=(n,sym)=>`${sym}${Math.abs(n).toLocaleString("en-NG")}`;

/* ── TX CARD ── */
function TxCard({t,sym,onEdit,onDelete}){
  const catIcons={
    "Food & Dining":"🍔","Transport":"🚗","Housing":"🏠","Shopping":"🛍️",
    "Entertainment":"🎬","Healthcare":"💊","Utilities":"⚡","Education":"📚",
    "Gift & Donations":"🎁","Business Expense":"💼","Electronics & Gadgets":"📱",
    "Personal Care":"💅","Salary":"💰","Freelance":"💻","Business Income":"📈",
    "Investment Returns":"📊","Gift Received":"🎁","Rental Income":"🏢",
    "Side Hustle":"⚡","Other Income":"💵","Other Expense":"💸",
  };
  return (
    <div className="card" style={{padding:"13px 15px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:11}}>
        <div style={{fontSize:22,width:38,height:38,background:"rgba(255,255,255,.05)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {catIcons[t.category]||"💸"}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:600,marginBottom:2,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.note}</div>
          <div style={{fontSize:11,color:"rgba(232,234,240,.35)"}}>{t.category} · {t.date}</div>
        </div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:15,fontWeight:700,color:t.type==="income"?"#00C896":"#FF6B6B"}}>{t.type==="income"?"+":"-"}{fmt(t.amount,sym)}</div>
        <div style={{display:"flex",gap:6,marginTop:5,justifyContent:"flex-end"}}>
          <button onClick={()=>onEdit(t)} style={{background:"transparent",border:"none",color:"rgba(232,234,240,.35)",cursor:"pointer",fontSize:13,padding:"2px 5px"}}>✏️</button>
          <button onClick={()=>onDelete(t.id)} style={{background:"transparent",border:"none",color:"rgba(255,107,107,.4)",cursor:"pointer",fontSize:13,padding:"2px 5px"}}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN APP ── */
export default function App() {
  /* ── auth ── */
  const [screen, setScreen] = useState("splash"); // splash|login|register|app|forgot
  const [accounts, setAccounts] = useState(()=>safeGet("moni_accounts",[]));
  const [currentUser, setCurrentUser] = useState(()=>safeGet("moni_user",null));
  const [authForm, setAuthForm] = useState({name:"",email:"",phone:"",password:"",confirm:""});
  const [authError, setAuthError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  /* ── app state ── */
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [inputText, setInputText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [liveTranscript, setLiveTranscript] = useState(""); // v5: live display
  const [voiceReview, setVoiceReview] = useState(null); // v5: review before submit
  const [currency, setCurrency] = useState("NGN");
  const [filterType, setFilterType] = useState("all");
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [editTx, setEditTx] = useState(null);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [apiKey, setApiKey] = useState(()=>safeGet("moni_apikey",""));
  const [msg, notify] = useNotify();
  const recRef = useRef(null);
  const sym = CURRENCIES[currency]?.sym || "₦";

  /* ── proactive nudge state ── */
  const [nudge, setNudge] = useState(null);

  /* ── load user data ── */
  useEffect(()=>{
    if(currentUser){
      const uid = currentUser.id;
      setTransactions(safeGet(`moni_tx_${uid}`,[]) );
      setBudgets(safeGet(`moni_budgets_${uid}`,{}));
      setCurrency(safeGet(`moni_currency_${uid}`,"NGN"));
    }
  },[currentUser]);

  /* ── save transactions ── */
  useEffect(()=>{ if(currentUser) safeSet(`moni_tx_${currentUser.id}`,transactions); },[transactions,currentUser]);
  useEffect(()=>{ if(currentUser) safeSet(`moni_budgets_${currentUser.id}`,budgets); },[budgets,currentUser]);
  useEffect(()=>{ if(currentUser) safeSet(`moni_currency_${currentUser.id}`,currency); },[currency,currentUser]);

  /* ── splash ── */
  useEffect(()=>{
    setTimeout(()=>{
      setScreen(currentUser?"app":"login");
    },1800);
  },[]);

  /* ── proactive nudges (v5) ── */
  useEffect(()=>{
    if(!currentUser||transactions.length===0) return;
    const today = new Date().toISOString().split("T")[0];
    const todayTx = transactions.filter(t=>t.date===today);
    const lastKey = `moni_lastnudge_${currentUser.id}`;
    const lastNudge = safeGet(lastKey,"");
    if(lastNudge === today) return; // only nudge once per day

    // Check budget alerts
    const alerts = [];
    for(const cat of CATEGORIES.expense){
      const u = getBudgetUsage(cat);
      if(u && u.pct >= 90 && u.pct < 100) alerts.push(`⚠️ You've used ${u.pct}% of your ${cat} budget`);
      if(u && u.pct >= 100) alerts.push(`🚨 ${cat} budget exceeded!`);
    }

    // No log today nudge
    if(todayTx.length===0){
      setNudge({ type:"reminder", text:"👋 Hey " + (currentUser.name?.split(" ")[0]||"there") + "! You haven't logged any transactions today. Keep your records up to date!" });
      safeSet(lastKey, today);
      return;
    }

    // Budget alert nudge
    if(alerts.length>0){
      setNudge({ type:"alert", text: alerts[0] });
      safeSet(lastKey, today);
    }
  },[currentUser,transactions,budgets]);

  /* ── derived ── */
  const now = new Date();
  const filtered = transactions.filter(t=>{
    if(filterType!=="all"&&t.type!==filterType) return false;
    if(reportPeriod==="weekly"){ const d=new Date(t.date); const diff=(now-d)/864e5; return diff<=7; }
    if(reportPeriod==="monthly"){ return t.date.startsWith(now.toISOString().slice(0,7)); }
    if(reportPeriod==="yearly"){ return t.date.startsWith(String(now.getFullYear())); }
    return true;
  });

  const periodTx = transactions.filter(t=>{
    if(reportPeriod==="weekly"){const d=new Date(t.date);return (now-d)/864e5<=7;}
    if(reportPeriod==="monthly") return t.date.startsWith(now.toISOString().slice(0,7));
    if(reportPeriod==="yearly") return t.date.startsWith(String(now.getFullYear()));
    return true;
  });

  const totalIncome = periodTx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense = periodTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance = totalIncome - totalExpense;
  const saveRate = totalIncome>0 ? Math.round((balance/totalIncome)*100) : 0;

  const expenseCats = Object.entries(
    periodTx.filter(t=>t.type==="expense").reduce((acc,t)=>{ acc[t.category]=(acc[t.category]||0)+t.amount; return acc; },{})
  ).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);

  function getBudgetUsage(cat){
    if(!budgets[cat]) return null;
    const spent = periodTx.filter(t=>t.type==="expense"&&t.category===cat).reduce((s,t)=>s+t.amount,0);
    return { spent, limit:budgets[cat], pct:Math.round((spent/budgets[cat])*100) };
  }

  /* ── PROCESS TRANSACTION (v5 smart parse) ── */
  const handleProcess = async () => {
    if(!inputText.trim()) return;
    setProcessing(true);
    try {
      const local = localParse(inputText);
      let result = local;

      // Use AI if: no amount found, low confidence, or has model numbers
      if(local.confidence < 0.75 || local.amount === 0){
        try {
          const aiText = await callAI([{
            role:"user",
            content:`Parse this Nigerian finance transaction and return ONLY valid JSON (no markdown):
"${inputText}"

Return: {"type":"income"|"expense","amount":number,"category":"<one of: ${[...CATEGORIES.income,...CATEGORIES.expense].join(", ")}>","note":"<short description>","date":"${new Date().toISOString().split("T")[0]}"}

IMPORTANT:
- Extract the PRICE/AMOUNT, not the model number. E.g. "iPhone 16 for 3 million" → amount: 3000000
- 3m = 3,000,000. 50k = 50,000. "three million" = 3,000,000
- Electronics (phones, laptops, gadgets) → category: "Electronics & Gadgets"`
          }], apiKey);
          const json = aiText.match(/\{[\s\S]*\}/)?.[0];
          if(json){ const parsed=JSON.parse(json); result={...parsed, date:parsed.date||new Date().toISOString().split("T")[0]}; }
        } catch(e){ /* use local result */ }
      }

      if(!result.amount || result.amount<=0){
        notify("Couldn't figure out the amount. Try: 'Spent ₦5,000 on food'","error");
        setProcessing(false);
        return;
      }

      const tx = { id:Date.now(), type:result.type, amount:result.amount, category:result.category||"Other Expense", note:result.note||inputText, date:result.date||new Date().toISOString().split("T")[0] };
      setTransactions(prev=>[tx,...prev]);
      setInputText("");
      setVoiceReview(null);
      notify(`${tx.type==="income"?"Income":"Expense"} of ${sym}${tx.amount.toLocaleString()} added ✓`,"success");
    } catch(e){
      notify("Something went wrong. Try again.","error");
    }
    setProcessing(false);
  };

  /* ── VOICE (v5: live transcript + review step) ── */
  const handleVoice = () => {
    if(!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)){
      notify("Voice not supported. Use Chrome browser.","error"); return;
    }
    if(recording){ recRef.current?.stop(); setRecording(false); setVoiceStatus(""); setLiveTranscript(""); return; }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-NG";
    rec.continuous = false;
    rec.interimResults = true; // v5: live transcript

    rec.onstart = () => { setRecording(true); setVoiceStatus("Listening... speak now"); setLiveTranscript(""); setVoiceReview(null); };

    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for(let i=e.resultIndex; i<e.results.length; i++){
        const t = e.results[i][0].transcript;
        if(e.results[i].isFinal) final += t;
        else interim += t;
      }
      // Show live interim transcript
      if(interim) setLiveTranscript(interim);
      if(final){
        setLiveTranscript(final);
        setInputText(final);
        // v5: show review step so user can confirm or edit before adding
        setVoiceReview(final);
        setVoiceStatus("Heard you! Review below 👇");
      }
    };

    rec.onerror = (e) => {
      setRecording(false); setVoiceStatus(""); setLiveTranscript("");
      if(e.error==="no-speech") notify("Nothing heard. Try again.","error");
      else if(e.error==="not-allowed") notify("Microphone blocked. Allow mic access in browser settings.","error");
      else notify("Couldn't hear clearly. Try again in a quiet spot.","error");
    };

    rec.onend = () => { setRecording(false); };
    recRef.current = rec;
    rec.start();
  };

  /* ── INSIGHTS ── */
  const fetchInsights = async () => {
    if(transactions.length===0){ notify("Add some transactions first!","error"); return; }
    setAiLoading(true); setAiError(""); setAiInsight("");
    try {
      const recent = transactions.slice(0,20);
      const totalInc = recent.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
      const totalExp = recent.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
      const topCats = Object.entries(recent.filter(t=>t.type==="expense").reduce((a,t)=>({...a,[t.category]:(a[t.category]||0)+t.amount}),{})).sort((a,b)=>b[1]-a[1]).slice(0,3);
      const text = await callAI([{
        role:"user",
        content:`You are Moni AI, a friendly financial advisor for Nigerians. Give personalised insights in 3-4 short paragraphs. Be encouraging, specific, and practical.

User's data:
- Total income: ${sym}${totalInc.toLocaleString()}
- Total expenses: ${sym}${totalExp.toLocaleString()}
- Balance: ${sym}${(totalInc-totalExp).toLocaleString()}
- Top spending: ${topCats.map(([k,v])=>`${k} (${sym}${v.toLocaleString()})`).join(", ")}
- Recent transactions: ${recent.slice(0,5).map(t=>`${t.type}: ${sym}${t.amount.toLocaleString()} on ${t.category}`).join("; ")}

Give: 1) spending pattern observation, 2) one specific savings tip for Nigeria, 3) one action to take this week. Keep it conversational and under 150 words.`
      }], apiKey);
      setAiInsight(text);
    } catch(e){
      setAiError(e.message.includes("API key")||e.message.includes("No API") ? "Add your Anthropic API key in Settings to use AI insights." : "Couldn't load insights. Check your connection and try again.");
    }
    setAiLoading(false);
  };

  /* ── CHART DATA ── */
  const getBarData = () => {
    const days=7; const data=[];
    for(let i=days-1;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const ds=d.toISOString().split("T")[0];
      const day=d.toLocaleDateString("en",{weekday:"short"});
      const txs=transactions.filter(t=>t.date===ds);
      data.push({day,income:txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),expense:txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)});
    }
    return data;
  };
  const getTrendData = () => {
    const months=6; const data=[];
    for(let i=months-1;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const key=d.toISOString().slice(0,7);
      const month=d.toLocaleDateString("en",{month:"short"});
      const txs=transactions.filter(t=>t.date.startsWith(key));
      const inc=txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
      const exp=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
      data.push({month,balance:inc-exp});
    }
    return data;
  };

  /* ── PDF EXPORT ── */
  const exportPDF = () => {
    const win = window.open("","_blank");
    if(!win) return;
    const rows = periodTx.map(t=>`<tr><td>${t.date}</td><td>${t.type}</td><td>${t.category}</td><td style="color:${t.type==="income"?"green":"red"}">${sym}${t.amount.toLocaleString()}</td><td>${t.note}</td></tr>`).join("");
    win.document.write(`<html><head><title>Moni Tracker Report</title><style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f2f2f2;}h1{color:#00C896;}</style></head><body><h1>Moni Tracker — ${reportPeriod} Report</h1><p>Name: ${currentUser?.name} | Period: ${reportPeriod} | Generated: ${new Date().toLocaleDateString()}</p><p>Income: ${sym}${totalIncome.toLocaleString()} | Expenses: ${sym}${totalExpense.toLocaleString()} | Balance: ${sym}${balance.toLocaleString()}</p><table><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Note</th></tr>${rows}</table></body></html>`);
    win.document.close();
    setTimeout(()=>win.print(),400);
  };

  /* ── EDIT TX ── */
  const saveEdit = () => {
    setTransactions(prev=>prev.map(t=>t.id===editTx.id?editTx:t));
    setEditTx(null);
    notify("Transaction updated ✓");
  };
  const deleteTx = (id) => {
    setTransactions(prev=>prev.filter(t=>t.id!==id));
    notify("Transaction deleted");
  };

  /* ── AUTH ── */
  const doRegister = () => {
    setAuthError("");
    if(!authForm.name||!authForm.email||!authForm.password){ setAuthError("Fill all fields"); return; }
    if(authForm.password!==authForm.confirm){ setAuthError("Passwords don't match"); return; }
    if(authForm.password.length<6){ setAuthError("Password must be at least 6 characters"); return; }
    if(accounts.find(a=>a.email===authForm.email)){ setAuthError("Email already registered"); return; }
    const user={id:Date.now(),name:authForm.name,email:authForm.email,phone:authForm.phone,password:authForm.password};
    const updated=[...accounts,user];
    setAccounts(updated); safeSet("moni_accounts",updated);
    setCurrentUser(user); safeSet("moni_user",user);
    setScreen("app");
  };
  const doLogin = () => {
    setAuthError("");
    const user = accounts.find(a=>a.email===authForm.email&&a.password===authForm.password);
    if(!user){ setAuthError("Wrong email or password"); return; }
    setCurrentUser(user); safeSet("moni_user",user);
    setScreen("app");
  };
  const doLogout = () => {
    safeDel("moni_user"); setCurrentUser(null); setTransactions([]); setScreen("login");
  };
  const doReset = () => {
    setResetMsg("");
    const user = accounts.find(a=>a.email===resetEmail);
    if(!user){ setResetMsg("No account found with that email."); return; }
    setResetMsg(`✅ Found your account! Your registered name is: ${user.name}. Please contact support to reset your password, or use the override below.`);
  };

  /* ── SCREENS ── */

  // SPLASH
  if(screen==="splash") return (
    <div style={{background:"linear-gradient(160deg,#0A0E1A 0%,#111827 100%)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:36,fontWeight:800,color:"#00C896",marginBottom:8}}>Moni</div>
      <div style={{fontSize:13,color:"rgba(232,234,240,.4)",letterSpacing:2}}>TRACKER</div>
      <div style={{marginTop:30,width:40,height:3,background:"rgba(0,200,150,.3)",borderRadius:2,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",background:"#00C896",borderRadius:2,animation:"load 1.5s ease forwards"}}/>
      </div>
      <style>{`@keyframes load{from{width:0}to{width:100%}}`}</style>
    </div>
  );

  // LOGIN
  if(screen==="login") return (
    <div className="app" style={{padding:"30px 24px"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{marginBottom:36,marginTop:20}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:30,fontWeight:800,color:"#00C896",marginBottom:4}}>Welcome back 👋</div>
        <div style={{fontSize:14,color:"rgba(232,234,240,.4)"}}>Sign in to your Moni Tracker account</div>
      </div>
      {authError&&<div style={{background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.3)",borderRadius:12,padding:"11px 14px",marginBottom:14,fontSize:13,color:"#FF6B6B"}}>{authError}</div>}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:12,color:"rgba(232,234,240,.5)",marginBottom:6,fontWeight:600}}>EMAIL</div>
        <input className="field" type="email" placeholder="you@example.com" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:12,color:"rgba(232,234,240,.5)",marginBottom:6,fontWeight:600}}>PASSWORD</div>
        <input className="field" type="password" placeholder="••••••••" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
      </div>
      <button className="btn-green" onClick={doLogin}>Sign In</button>
      <button onClick={()=>{setScreen("forgot");setAuthError("");}} style={{background:"transparent",border:"none",color:"rgba(0,200,150,.7)",fontFamily:"DM Sans",fontSize:13,cursor:"pointer",width:"100%",marginTop:12}}>Forgot password?</button>
      <div style={{textAlign:"center",marginTop:24,fontSize:14,color:"rgba(232,234,240,.4)"}}>
        Don't have an account? <span onClick={()=>{setScreen("register");setAuthError("");}} style={{color:"#00C896",cursor:"pointer",fontWeight:700}}>Sign Up</span>
      </div>
    </div>
  );

  // FORGOT PASSWORD
  if(screen==="forgot") return (
    <div className="app" style={{padding:"30px 24px"}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={()=>setScreen("login")} style={{background:"transparent",border:"none",color:"rgba(232,234,240,.5)",fontFamily:"DM Sans",fontSize:14,cursor:"pointer",marginBottom:24,display:"flex",alignItems:"center",gap:6}}>← Back to Login</button>
      <div style={{marginBottom:32}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800,marginBottom:6}}>Forgot Password?</div>
        <div style={{fontSize:13,color:"rgba(232,234,240,.4)"}}>Enter your email to find your account</div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,color:"rgba(232,234,240,.5)",marginBottom:6,fontWeight:600}}>YOUR EMAIL</div>
        <input className="field" type="email" placeholder="you@example.com" value={resetEmail} onChange={e=>setResetEmail(e.target.value)}/>
      </div>
      <button className="btn-green" onClick={doReset}>Find My Account</button>
      {resetMsg&&<div style={{background:"rgba(0,200,150,.08)",border:"1px solid rgba(0,200,150,.2)",borderRadius:12,padding:"13px 15px",marginTop:14,fontSize:13,color:"rgba(232,234,240,.8)",lineHeight:1.7}}>{resetMsg}</div>}
      <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:16,marginTop:20}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>💡 Quick Tip</div>
        <div style={{fontSize:12,color:"rgba(232,234,240,.5)",lineHeight:1.7}}>Since Moni Tracker saves data locally on your device, your password is stored here. If you remember roughly what you used, try: your phone number, your name, or "password123".</div>
      </div>
    </div>
  );

  // REGISTER
  if(screen==="register") return (
    <div className="app" style={{padding:"30px 24px"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{marginBottom:32,marginTop:20}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,color:"#00C896",marginBottom:4}}>Create Account ✨</div>
        <div style={{fontSize:14,color:"rgba(232,234,240,.4)"}}>Start tracking your money smarter</div>
      </div>
      {authError&&<div style={{background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.3)",borderRadius:12,padding:"11px 14px",marginBottom:14,fontSize:13,color:"#FF6B6B"}}>{authError}</div>}
      {[{k:"name",l:"FULL NAME",p:"e.g. Thomas James",t:"text"},{k:"email",l:"EMAIL",p:"you@gmail.com",t:"email"},{k:"phone",l:"PHONE (optional)",p:"+234 800 000 0000",t:"tel"},{k:"password",l:"PASSWORD",p:"Min. 6 characters",t:"password"},{k:"confirm",l:"CONFIRM PASSWORD",p:"Re-enter password",t:"password"}].map(f=>(
        <div key={f.k} style={{marginBottom:12}}>
          <div style={{fontSize:12,color:"rgba(232,234,240,.5)",marginBottom:6,fontWeight:600}}>{f.l}</div>
          <input className="field" type={f.t} placeholder={f.p} value={authForm[f.k]} onChange={e=>setAuthForm(prev=>({...prev,[f.k]:e.target.value}))}/>
        </div>
      ))}
      <div style={{marginTop:4}}>
        <button className="btn-green" onClick={doRegister}>Create My Account</button>
      </div>
      <div style={{textAlign:"center",marginTop:20,fontSize:14,color:"rgba(232,234,240,.4)"}}>
        Already have an account? <span onClick={()=>{setScreen("login");setAuthError("");}} style={{color:"#00C896",cursor:"pointer",fontWeight:700}}>Sign In</span>
      </div>
    </div>
  );

  // MAIN APP
  return (
    <div className="app">
      <style>{GLOBAL_CSS}</style>

      {/* Notification */}
      {msg&&<div className="notify" style={{background:msg.type==="error"?"rgba(255,107,107,.95)":"rgba(0,200,150,.95)",color:msg.type==="error"?"#fff":"#0A0E1A"}}>{msg.text}</div>}

      {/* Proactive nudge banner (v5) */}
      {nudge&&(
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:998,background:nudge.type==="alert"?"rgba(255,107,107,.97)":"rgba(108,99,255,.97)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",backdropFilter:"blur(10px)"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#fff",flex:1,paddingRight:8}}>{nudge.text}</div>
          <button onClick={()=>setNudge(null)} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>
        </div>
      )}

      {/* HEADER */}
      <div style={{padding:"16px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"rgba(10,14,26,.95)",backdropFilter:"blur(20px)",zIndex:100,borderBottom:"1px solid rgba(255,255,255,.05)"}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:"#00C896"}}>Moni</div>
          <div style={{fontSize:10,color:"rgba(232,234,240,.3)",letterSpacing:1.5}}>TRACKER</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"6px 10px",color:"#E8EAF0",fontFamily:"DM Sans",fontSize:13,cursor:"pointer"}}>
            {Object.entries(CURRENCIES).map(([k,v])=><option key={k} value={k}>{v.sym} {k}</option>)}
          </select>
          <button onClick={()=>setShowSettings(true)} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"6px 11px",color:"rgba(232,234,240,.6)",fontFamily:"DM Sans",fontSize:13,cursor:"pointer"}}>⚙️</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"14px 16px",paddingBottom:90,paddingTop: nudge ? 60 : 14}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&<div className="fade">
          {/* Balance card */}
          <div style={{background:"linear-gradient(135deg,#00C896 0%,#059669 100%)",borderRadius:22,padding:"22px 22px 18px",marginBottom:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,background:"rgba(255,255,255,.08)",borderRadius:"50%"}}/>
            <div style={{fontSize:12,fontWeight:700,color:"rgba(10,14,26,.6)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Total Balance</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:36,fontWeight:800,color:"#0A0E1A",marginBottom:14}}>{sym}{Math.abs(balance).toLocaleString("en-NG")}</div>
            <div style={{display:"flex",gap:20}}>
              <div><div style={{fontSize:11,color:"rgba(10,14,26,.5)",marginBottom:2}}>Income</div><div style={{fontSize:15,fontWeight:700,color:"#0A0E1A"}}>↑ {sym}{totalIncome.toLocaleString("en-NG")}</div></div>
              <div><div style={{fontSize:11,color:"rgba(10,14,26,.5)",marginBottom:2}}>Expenses</div><div style={{fontSize:15,fontWeight:700,color:"#0A0E1A"}}>↓ {sym}{totalExpense.toLocaleString("en-NG")}</div></div>
              <div><div style={{fontSize:11,color:"rgba(10,14,26,.5)",marginBottom:2}}>Save Rate</div><div style={{fontSize:15,fontWeight:700,color:"#0A0E1A"}}>{saveRate}%</div></div>
            </div>
          </div>

          {/* Period filter */}
          <div style={{display:"flex",gap:7,marginBottom:14}}>
            {["weekly","monthly","yearly"].map(p=>(
              <button key={p} onClick={()=>setReportPeriod(p)} style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:reportPeriod===p?"rgba(0,200,150,.2)":"rgba(255,255,255,.05)",color:reportPeriod===p?"#00C896":"rgba(232,234,240,.5)",fontFamily:"DM Sans",fontWeight:700,fontSize:11,cursor:"pointer",textTransform:"capitalize",transition:"all .2s"}}>{p}</button>
            ))}
          </div>

          {/* Budget alerts */}
          {CATEGORIES.expense.filter(c=>{ const u=getBudgetUsage(c); return u&&u.pct>=80; }).slice(0,2).map(c=>{ const u=getBudgetUsage(c); return (
            <div key={c} style={{background:u.pct>=100?"rgba(255,107,107,.08)":"rgba(255,217,61,.08)",border:`1px solid ${u.pct>=100?"rgba(255,107,107,.3)":"rgba(255,217,61,.3)"}`,borderRadius:13,padding:"11px 15px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:600,color:u.pct>=100?"#FF6B6B":"#FFD93D"}}>{u.pct>=100?"🚨":"⚠️"} {c} {u.pct>=100?"exceeded!":"at "+u.pct+"%"}</span>
              <span style={{fontSize:12,color:"rgba(232,234,240,.5)"}}>{sym}{u.spent.toLocaleString()} / {sym}{u.limit.toLocaleString()}</span>
            </div>
          ); })}

          {/* INPUT BOX */}
          <div className="card" style={{marginBottom:16}}>
            <div className="section-label">ADD TRANSACTION</div>
            <textarea className="field" rows={2}
              placeholder={`Try: "Bought iPhone 16 for ₦3 million" · "Received ₦150k salary"`}
              value={inputText}
              onChange={e=>{ setInputText(e.target.value); setVoiceReview(null); }}
            />

            {/* v5: Live transcript while recording */}
            {recording && liveTranscript && (
              <div style={{fontSize:13,color:"rgba(0,200,150,.8)",marginTop:8,padding:"8px 12px",background:"rgba(0,200,150,.06)",borderRadius:10,fontStyle:"italic"}}>
                🎙️ "{liveTranscript}"
              </div>
            )}

            {/* v5: Voice status */}
            {voiceStatus&&!voiceReview&&<div style={{fontSize:12,color:recording?"#FF6B6B":"#00C896",marginTop:8,display:"flex",alignItems:"center",gap:6}}>
              {recording&&<span className="pulse">🔴</span>} {voiceStatus}
            </div>}

            {/* v5: Review step after voice capture */}
            {voiceReview&&(
              <div className="voice-review">
                <div style={{fontSize:12,color:"rgba(0,200,150,.8)",fontWeight:700,marginBottom:6}}>✅ I heard you say:</div>
                <div style={{fontSize:14,color:"#E8EAF0",marginBottom:10,lineHeight:1.6}}>"{voiceReview}"</div>
                <div style={{fontSize:12,color:"rgba(232,234,240,.45)",marginBottom:10}}>You can edit the text above if needed, then tap "Add with AI"</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={handleVoice} className="btn-ghost" style={{flex:1,fontSize:13,padding:"9px"}}>🎙️ Re-record</button>
                  <button onClick={()=>{setVoiceReview(null);setInputText("");setVoiceStatus("");}} className="btn-ghost" style={{flex:1,fontSize:13,padding:"9px",color:"#FF6B6B",borderColor:"rgba(255,107,107,.3)"}}>✕ Cancel</button>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10,marginTop:10}}>
              <button className="btn-ghost" onClick={handleVoice}
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px",borderColor:recording?"rgba(255,107,107,.4)":"rgba(255,255,255,.15)",color:recording?"#FF6B6B":"#E8EAF0"}}>
                <span style={{fontSize:17}}>{recording?"⏹":"🎙️"}</span>
                <span style={{fontSize:13}}>{recording?"Stop":"Voice"}</span>
              </button>
              <button className="btn-green" onClick={handleProcess} disabled={!inputText.trim()||processing}
                style={{flex:2,borderRadius:12,padding:"11px",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {processing?<><span className="spin">⟳</span> Processing...</>:<>✦ Add with AI</>}
              </button>
            </div>
            {/* Quick tags */}
            <div style={{display:"flex",gap:7,marginTop:10,flexWrap:"wrap"}}>
              {["Food","Transport","Salary","Electronics"].map(c=>(
                <button key={c} onClick={()=>setInputText(`Spent on ${c}`)}
                  style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:20,padding:"6px 12px",color:"rgba(232,234,240,.65)",fontFamily:"DM Sans",fontSize:12,cursor:"pointer"}}>+ {c}</button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {transactions.length===0&&(
            <div style={{textAlign:"center",padding:"36px 20px"}}>
              <div style={{fontSize:48,marginBottom:16}}>📊</div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:8}}>Start tracking your money</div>
              <div style={{fontSize:14,color:"rgba(232,234,240,.4)",lineHeight:1.7}}>Try typing or saying: <span style={{color:"#00C896"}}>"Received ₦50,000 salary"</span> or <span style={{color:"#00C896"}}>"Bought iPhone 16 for 3 million"</span></div>
            </div>
          )}

          {/* Recent transactions */}
          {transactions.length>0&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div className="section-label" style={{marginBottom:0}}>RECENT</div>
              <button onClick={()=>setTab("transactions")} style={{background:"transparent",border:"none",color:"#00C896",fontSize:12,cursor:"pointer",fontFamily:"DM Sans",fontWeight:700}}>See all →</button>
            </div>
            {transactions.slice(0,5).map(t=><TxCard key={t.id} t={t} sym={sym} onEdit={setEditTx} onDelete={deleteTx}/>)}
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
          {filtered.map(t=><TxCard key={t.id} t={t} sym={sym} onEdit={setEditTx} onDelete={deleteTx}/>)}
        </div>}

        {/* ── REPORTS ── */}
        {tab==="reports"&&<div className="fade">
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {["weekly","monthly","yearly"].map(p=>(
              <button key={p} onClick={()=>setReportPeriod(p)} style={{flex:1,padding:"9px",borderRadius:11,border:"none",background:reportPeriod===p?"#00C896":"rgba(255,255,255,.06)",color:reportPeriod===p?"#0A0E1A":"#E8EAF0",fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize",transition:"all .2s"}}>{p}</button>
            ))}
          </div>
          <button onClick={exportPDF} style={{width:"100%",marginBottom:14,padding:"13px",borderRadius:13,border:"1px solid rgba(0,200,150,.3)",background:"rgba(0,200,150,.07)",color:"#00C896",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            📄 Export {reportPeriod} Report as PDF
          </button>
          <button onClick={()=>setShowBudgets(true)} style={{width:"100%",marginBottom:16,padding:"13px",borderRadius:13,border:"1px solid rgba(108,99,255,.3)",background:"rgba(108,99,255,.07)",color:"#A78BFA",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            🎯 Manage Monthly Budgets
          </button>
          {transactions.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"rgba(232,234,240,.35)"}}>
            <div style={{fontSize:36,marginBottom:10}}>📊</div>Add transactions to see your reports
          </div>}
          {transactions.length>0&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[{l:"Income",v:fmt(totalIncome,sym),c:"#00C896",i:"↑"},{l:"Expenses",v:fmt(totalExpense,sym),c:"#FF6B6B",i:"↓"},{l:"Balance",v:fmt(balance,sym),c:balance>=0?"#6C63FF":"#FF6B6B",i:"★"},{l:"Save Rate",v:`${saveRate}%`,c:"#FFD93D",i:"%"}].map(s=>(
                <div key={s.l} className="card" style={{textAlign:"center",padding:16}}>
                  <div style={{fontSize:18,color:s.c,marginBottom:4}}>{s.i}</div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:"rgba(232,234,240,.4)",marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
            {expenseCats.length>0&&<div className="card" style={{marginBottom:12}}>
              <div className="section-label">EXPENSE BREAKDOWN</div>
              <ResponsiveContainer width="100%" height={185}>
                <PieChart><Pie data={expenseCats} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                  {expenseCats.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie><Tooltip formatter={v=>`${sym}${v.toLocaleString()}`} contentStyle={{background:"#1A1F2E",border:"none",borderRadius:10,color:"#E8EAF0"}}/></PieChart>
              </ResponsiveContainer>
              {expenseCats.slice(0,5).map((c,i)=><div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,background:COLORS[i%COLORS.length]}}/><span style={{fontSize:13}}>{c.name}</span></div><span style={{fontSize:13,fontWeight:700}}>{sym}{c.value.toLocaleString()}</span></div>)}
            </div>}
            <div className="card" style={{marginBottom:12}}>
              <div className="section-label">INCOME VS EXPENSES (7 DAYS)</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={getBarData()} barSize={12}><XAxis dataKey="day" tick={{fill:"rgba(232,234,240,.4)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:"#1A1F2E",border:"none",borderRadius:10,color:"#E8EAF0"}} formatter={v=>`${sym}${v.toLocaleString()}`}/><Bar dataKey="income" fill="#00C896" radius={[5,5,0,0]} name="Income"/><Bar dataKey="expense" fill="#FF6B6B" radius={[5,5,0,0]} name="Expense"/><Legend wrapperStyle={{fontSize:12,color:"rgba(232,234,240,.4)"}}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="section-label">6-MONTH BALANCE TREND</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={getTrendData()}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis dataKey="month" tick={{fill:"rgba(232,234,240,.4)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:"#1A1F2E",border:"none",borderRadius:10,color:"#E8EAF0"}} formatter={v=>`${sym}${v.toLocaleString()}`}/><Line type="monotone" dataKey="balance" stroke="#6C63FF" strokeWidth={2.5} dot={{fill:"#6C63FF",r:3}}/></LineChart>
              </ResponsiveContainer>
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
              <div style={{fontSize:13,color:"rgba(232,234,240,.4)",marginBottom:16}}>{transactions.length===0?"Add some transactions first, then get personalised AI analysis.":"Tap below to get your personalised AI financial advice."}</div>
              <button className="btn-green" onClick={fetchInsights} disabled={transactions.length===0} style={{borderRadius:12,padding:"12px 24px",width:"auto"}}>Get My Insights ✨</button>
            </div>}
          </div>

          {/* Budget overview */}
          {Object.keys(budgets).length>0&&<div className="card" style={{marginBottom:12}}>
            <div className="section-label">BUDGET TRACKER</div>
            {Object.keys(budgets).map((cat,i)=>{ const u=getBudgetUsage(cat); if(!u) return null; return (
              <div key={cat} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13}}>{cat}</span><span style={{fontSize:12,fontWeight:700,color:u.pct>=100?"#FF6B6B":u.pct>=80?"#FFD93D":"#00C896"}}>{sym}{u.spent.toLocaleString()} / {sym}{u.limit.toLocaleString()}</span></div>
                <div style={{height:7,background:"rgba(255,255,255,.07)",borderRadius:10}}><div style={{height:"100%",borderRadius:10,background:u.pct>=100?"#FF6B6B":u.pct>=80?"#FFD93D":COLORS[i%COLORS.length],width:`${Math.min(u.pct,100)}%`,transition:"width .8s"}}/></div>
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
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,14,26,.96)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,.06)",padding:"6px 0 14px",display:"flex",justifyContent:"space-around",zIndex:100}}>
        {[{id:"dashboard",icon:"⊞",l:"Home"},{id:"transactions",icon:"↕",l:"History"},{id:"reports",icon:"◎",l:"Reports"},{id:"insights",icon:"✦",l:"Insights"}].map(n=>(
          <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:20}}>{n.icon}</span><span>{n.l}</span>
          </button>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editTx&&(
        <div className="modal-bg" onClick={()=>setEditTx(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:18}}>Edit Transaction</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6}}>NOTE</div>
              <input className="field" value={editTx.note} onChange={e=>setEditTx(p=>({...p,note:e.target.value}))}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6}}>AMOUNT ({sym})</div>
              <input className="field" type="number" value={editTx.amount} onChange={e=>setEditTx(p=>({...p,amount:parseFloat(e.target.value)||0}))}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6}}>TYPE</div>
              <select className="field" value={editTx.type} onChange={e=>setEditTx(p=>({...p,type:e.target.value}))}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6}}>CATEGORY</div>
              <select className="field" value={editTx.category} onChange={e=>setEditTx(p=>({...p,category:e.target.value}))}>
                {[...CATEGORIES.income,...CATEGORIES.expense].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6}}>DATE</div>
              <input className="field" type="date" value={editTx.date} onChange={e=>setEditTx(p=>({...p,date:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn-ghost" onClick={()=>setEditTx(null)} style={{flex:1}}>Cancel</button>
              <button className="btn-green" onClick={saveEdit} style={{flex:2}}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* BUDGETS MODAL */}
      {showBudgets&&(
        <div className="modal-bg" onClick={()=>setShowBudgets(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>Monthly Budgets 🎯</div>
            <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:18}}>Set spending limits to get alerts</div>
            {CATEGORIES.expense.map(cat=>(
              <div key={cat} style={{marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,fontSize:13}}>{cat}</div>
                <input className="field" type="number" placeholder="0"
                  value={budgets[cat]||""}
                  onChange={e=>{ const v=parseFloat(e.target.value)||0; setBudgets(prev=>v?{...prev,[cat]:v}:(({[cat]:_,...rest})=>rest)(prev)); }}
                  style={{width:130,padding:"9px 12px",fontSize:13}}
                />
              </div>
            ))}
            <button className="btn-green" onClick={()=>setShowBudgets(false)} style={{marginTop:6}}>Save Budgets</button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings&&(
        <div className="modal-bg" onClick={()=>setShowSettings(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:18}}>Settings ⚙️</div>
            <div style={{marginBottom:14,padding:"13px 15px",background:"rgba(255,255,255,.04)",borderRadius:12}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{currentUser?.name}</div>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)"}}>{currentUser?.email}</div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:600}}>ANTHROPIC API KEY (for AI features)</div>
              <input className="field" type="password" placeholder="sk-ant-..." value={apiKey}
                onChange={e=>{ setApiKey(e.target.value); safeSet("moni_apikey",e.target.value); }}/>
              <div style={{fontSize:11,color:"rgba(232,234,240,.3)",marginTop:5,lineHeight:1.6}}>Add your key from console.anthropic.com to enable AI insights. Your key stays on your device only.</div>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:600}}>CURRENCY</div>
              <select className="field" value={currency} onChange={e=>setCurrency(e.target.value)}>
                {Object.entries(CURRENCIES).map(([k,v])=><option key={k} value={k}>{v.sym} — {v.name}</option>)}
              </select>
            </div>
            <button onClick={doLogout} style={{width:"100%",padding:"12px",borderRadius:13,border:"1px solid rgba(255,107,107,.3)",background:"rgba(255,107,107,.07)",color:"#FF6B6B",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:10}}>Sign Out</button>
            <button className="btn-ghost" onClick={()=>setShowSettings(false)} style={{width:"100%"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
