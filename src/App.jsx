import { useState, useRef, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, CartesianGrid } from "recharts";

/* ── helpers ── */
const safeGet=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const safeDel=(k)=>{try{localStorage.removeItem(k);}catch{}};

const COLORS=["#00C896","#6C63FF","#FFD93D","#FF6B6B","#4ECDC4","#A78BFA","#F97316","#22D3EE","#FB923C","#34D399","#E879F9","#38BDF8","#FBBF24","#60A5FA","#F472B6"];

/* ── WORLD CURRENCIES ── */
const CURRENCIES = {
  // 🌍 Africa
  NGN:{sym:"₦",name:"Nigerian Naira",flag:"🇳🇬"},
  GHS:{sym:"₵",name:"Ghanaian Cedi",flag:"🇬🇭"},
  KES:{sym:"KSh",name:"Kenyan Shilling",flag:"🇰🇪"},
  ZAR:{sym:"R",name:"South African Rand",flag:"🇿🇦"},
  EGP:{sym:"E£",name:"Egyptian Pound",flag:"🇪🇬"},
  ETB:{sym:"Br",name:"Ethiopian Birr",flag:"🇪🇹"},
  TZS:{sym:"TSh",name:"Tanzanian Shilling",flag:"🇹🇿"},
  UGX:{sym:"USh",name:"Ugandan Shilling",flag:"🇺🇬"},
  RWF:{sym:"FRw",name:"Rwandan Franc",flag:"🇷🇼"},
  XOF:{sym:"CFA",name:"West African CFA Franc",flag:"🌍"},
  XAF:{sym:"FCFA",name:"Central African CFA Franc",flag:"🌍"},
  MAD:{sym:"MAD",name:"Moroccan Dirham",flag:"🇲🇦"},
  DZD:{sym:"DA",name:"Algerian Dinar",flag:"🇩🇿"},
  TND:{sym:"DT",name:"Tunisian Dinar",flag:"🇹🇳"},
  ZMW:{sym:"ZK",name:"Zambian Kwacha",flag:"🇿🇲"},
  MWK:{sym:"MK",name:"Malawian Kwacha",flag:"🇲🇼"},
  MZN:{sym:"MT",name:"Mozambican Metical",flag:"🇲🇿"},
  BWP:{sym:"P",name:"Botswana Pula",flag:"🇧🇼"},
  NAD:{sym:"N$",name:"Namibian Dollar",flag:"🇳🇦"},
  // 🌎 Americas
  USD:{sym:"$",name:"US Dollar",flag:"🇺🇸"},
  CAD:{sym:"CA$",name:"Canadian Dollar",flag:"🇨🇦"},
  BRL:{sym:"R$",name:"Brazilian Real",flag:"🇧🇷"},
  MXN:{sym:"MX$",name:"Mexican Peso",flag:"🇲🇽"},
  ARS:{sym:"$",name:"Argentine Peso",flag:"🇦🇷"},
  COP:{sym:"$",name:"Colombian Peso",flag:"🇨🇴"},
  CLP:{sym:"$",name:"Chilean Peso",flag:"🇨🇱"},
  PEN:{sym:"S/",name:"Peruvian Sol",flag:"🇵🇪"},
  // 🌍 Europe
  EUR:{sym:"€",name:"Euro",flag:"🇪🇺"},
  GBP:{sym:"£",name:"British Pound",flag:"🇬🇧"},
  CHF:{sym:"Fr",name:"Swiss Franc",flag:"🇨🇭"},
  SEK:{sym:"kr",name:"Swedish Krona",flag:"🇸🇪"},
  NOK:{sym:"kr",name:"Norwegian Krone",flag:"🇳🇴"},
  DKK:{sym:"kr",name:"Danish Krone",flag:"🇩🇰"},
  PLN:{sym:"zł",name:"Polish Złoty",flag:"🇵🇱"},
  CZK:{sym:"Kč",name:"Czech Koruna",flag:"🇨🇿"},
  HUF:{sym:"Ft",name:"Hungarian Forint",flag:"🇭🇺"},
  RON:{sym:"lei",name:"Romanian Leu",flag:"🇷🇴"},
  TRY:{sym:"₺",name:"Turkish Lira",flag:"🇹🇷"},
  RUB:{sym:"₽",name:"Russian Ruble",flag:"🇷🇺"},
  UAH:{sym:"₴",name:"Ukrainian Hryvnia",flag:"🇺🇦"},
  // 🌏 Asia & Middle East
  CNY:{sym:"¥",name:"Chinese Yuan",flag:"🇨🇳"},
  JPY:{sym:"¥",name:"Japanese Yen",flag:"🇯🇵"},
  KRW:{sym:"₩",name:"South Korean Won",flag:"🇰🇷"},
  INR:{sym:"₹",name:"Indian Rupee",flag:"🇮🇳"},
  IDR:{sym:"Rp",name:"Indonesian Rupiah",flag:"🇮🇩"},
  MYR:{sym:"RM",name:"Malaysian Ringgit",flag:"🇲🇾"},
  THB:{sym:"฿",name:"Thai Baht",flag:"🇹🇭"},
  PHP:{sym:"₱",name:"Philippine Peso",flag:"🇵🇭"},
  SGD:{sym:"S$",name:"Singapore Dollar",flag:"🇸🇬"},
  HKD:{sym:"HK$",name:"Hong Kong Dollar",flag:"🇭🇰"},
  TWD:{sym:"NT$",name:"New Taiwan Dollar",flag:"🇹🇼"},
  VND:{sym:"₫",name:"Vietnamese Dong",flag:"🇻🇳"},
  PKR:{sym:"₨",name:"Pakistani Rupee",flag:"🇵🇰"},
  BDT:{sym:"৳",name:"Bangladeshi Taka",flag:"🇧🇩"},
  LKR:{sym:"Rs",name:"Sri Lankan Rupee",flag:"🇱🇰"},
  NPR:{sym:"Rs",name:"Nepalese Rupee",flag:"🇳🇵"},
  AED:{sym:"د.إ",name:"UAE Dirham",flag:"🇦🇪"},
  SAR:{sym:"﷼",name:"Saudi Riyal",flag:"🇸🇦"},
  QAR:{sym:"﷼",name:"Qatari Riyal",flag:"🇶🇦"},
  KWD:{sym:"KD",name:"Kuwaiti Dinar",flag:"🇰🇼"},
  ILS:{sym:"₪",name:"Israeli Shekel",flag:"🇮🇱"},
  // 🌏 Oceania
  AUD:{sym:"A$",name:"Australian Dollar",flag:"🇦🇺"},
  NZD:{sym:"NZ$",name:"New Zealand Dollar",flag:"🇳🇿"},
};

const CATEGORIES={
  expense:["Food & Dining","Transport","Housing","Shopping","Entertainment","Healthcare","Utilities","Education","Gift & Donations","Business Expense","Electronics & Gadgets","Personal Care","Other Expense"],
  income:["Salary","Freelance","Business Income","Investment Returns","Gift Received","Rental Income","Side Hustle","Property Sale","Other Income"]
};

/* ── SMART AMOUNT PARSER v6 ── */
function smartParseAmount(text) {
  let t = text;

  // Expand written-out amounts (Nigerian style)
  const writtenMap = {
    "two hundred and thirty million": 230000000,
    "one hundred and fifty million": 150000000,
    "two hundred million": 200000000,
    "one hundred million": 100000000,
    "fifty million": 50000000, "twenty million": 20000000,
    "ten million": 10000000, "five million": 5000000,
    "four million": 4000000, "three million": 3000000,
    "two million": 2000000, "one million": 1000000,
    "half million": 500000, "quarter million": 250000,
    "nine hundred thousand": 900000, "eight hundred thousand": 800000,
    "seven hundred thousand": 700000, "six hundred thousand": 600000,
    "five hundred thousand": 500000, "four hundred thousand": 400000,
    "three hundred thousand": 300000, "two hundred thousand": 200000,
    "one hundred thousand": 100000, "hundred thousand": 100000,
    "ninety thousand": 90000, "eighty thousand": 80000,
    "seventy thousand": 70000, "sixty thousand": 60000,
    "fifty thousand": 50000, "forty thousand": 40000,
    "thirty thousand": 30000, "twenty thousand": 20000,
    "fifteen thousand": 15000, "ten thousand": 10000,
    "five thousand": 5000, "two thousand": 2000, "one thousand": 1000,
  };
  const lower = t.toLowerCase();
  for (const [phrase, val] of Object.entries(writtenMap)) {
    if (lower.includes(phrase)) {
      t = t.toLowerCase().replace(phrase, String(val));
      break;
    }
  }

  // Expand shorthand
  t = t.replace(/(\d+\.?\d*)\s*billion\b/gi, (_,n) => String(parseFloat(n)*1e9));
  t = t.replace(/(\d+\.?\d*)\s*million\b/gi, (_,n) => String(parseFloat(n)*1e6));
  t = t.replace(/(\d+\.?\d*)\s*thousand\b/gi, (_,n) => String(parseFloat(n)*1e3));
  t = t.replace(/(\d+\.?\d*)\s*m\b/gi, (_,n) => String(parseFloat(n)*1e6));
  t = t.replace(/(\d+\.?\d*)\s*k\b/gi, (_,n) => String(parseFloat(n)*1e3));

  // Priority 1: number directly after currency symbol
  const currencyMatch = t.match(/[₦$£€₵₹₺₩₫﷼₨฿₱]\s?(\d[\d,\.]*)/);
  if (currencyMatch) {
    const amt = parseFloat(currencyMatch[1].replace(/,/g,""));
    if (amt > 0) return amt;
  }

  // Priority 2: number after price keywords
  const priceKw = t.match(/\b(?:for|cost[s]?|spent|spend|paid|pay|worth|price[d]?|at|about|around|approximately)\s+[₦$£€₵₹]?\s?(\d[\d,\.]*)/i);
  if (priceKw) {
    const amt = parseFloat(priceKw[1].replace(/,/g,""));
    if (amt > 100) return amt;
  }

  // Priority 3: strip brand+model, then take largest remaining number
  const cleaned = t.replace(/\b(iphone|samsung|tecno|infinix|itel|huawei|xiaomi|oppo|vivo|realme|nokia|galaxy|redmi|poco|note|pro|max|plus|ultra|toyota|honda|lexus|benz|ford|kia|hyundai|ps|playstation|xbox|macbook|ipad|dell|hp|lenovo|asus)\s*\d+\w*/gi, "MODEL");

  const nums = [];
  const rx = /(\d[\d,\.]*)/g;
  let m;
  while ((m = rx.exec(cleaned)) !== null) {
    const n = parseFloat(m[1].replace(/,/g,""));
    if (!isNaN(n) && n > 0) nums.push(n);
  }
  if (nums.length === 0) return 0;
  return Math.max(...nums);
}

/* ── LOCAL PARSER v6 — income/type detected BEFORE category rules ── */
function localParse(text) {
  const lower = text.toLowerCase();

  // Income detection (stronger — must detect BEFORE housing/etc. rules)
  const incomeSignals = /\b(earn|receiv|got paid|salary|income|credit|profit|sold|sale|sell|revenue|freelance revenue|paid me|transferred to me|transfer in|got|collected|payment received|invoice paid|client paid|customer paid|wage|bonus|dividend|interest earned|return|proceeds|property sale|sold house|sold car|sold land|sold property)\b/;
  const isIncome = incomeSignals.test(lower);
  const type = isIncome ? "income" : "expense";

  const amount = smartParseAmount(text);

  let category = type==="income" ? "Other Income" : "Other Expense";

  const expenseRules=[
    [/\b(iphone|samsung|tecno|infinix|itel|huawei|xiaomi|oppo|vivo|realme|nokia|phone|smartphone|laptop|computer|tablet|ipad|macbook|dell|hp|lenovo|asus|tv|television|screen|monitor|headphone|earphone|airpod|earpod|speaker|camera|playstation|xbox|ps\d|console|gadget|electronics|charger|power\s?bank|memory\s?card|hard\s?drive|ssd|router|modem|printer|keyboard|mouse|watch|smartwatch|projector|generator|inverter)\b/,"Electronics & Gadgets"],
    [/\b(food|eat|restaurant|groceries|lunch|dinner|breakfast|bukka|market|shoprite|spar|suya|rice|beans|pepper|snack|drink|beer|wine|water|pure water|biscuit|indomie|bread|egg|chicken|fish|meat|vegetable|fruit|juice|soda|eatery|canteen|cafeteria|pizza|burger|shawarma|pepper soup|egusi|pounded|ofada|jollof|amala|eba)\b/,"Food & Dining"],
    [/\b(uber|bolt|taxi|bus|transport|fuel|petrol|keke|okada|danfo|ride|traffic|brt|road|car wash|parking|vehicle|motorcycle|bike|tyre|mechanic|engine oil|auto|ferry|boat|bike man|tricycle|lorry|truck|move|fare)\b/,"Transport"],
    [/\b(rent|house rent|apartment|landlord|estate|hostel|lodge|accommodation|furniture|appliance|cleaning|maintenance|repair|generator fuel|diesel|kerosene|service charge)\b/,"Housing"],
    [/\b(shop|cloth|fashion|shoe|bag|zara|jumia|konga|h&m|dress|shirt|trouser|jean|skirt|blouse|native|aso ebi|cap|hat|belt|wallet|sunglass|jewellery|jewelry|accessories|fabric)\b/,"Shopping"],
    [/\b(netflix|dstv|gotv|startimes|movie|cinema|fun|entertain|spotify|apple music|concert|party|outing|hangout|game|gaming|steam|club|bar|lounge|karaoke|bowling|event|ticket|show|comedy)\b/,"Entertainment"],
    [/\b(doctor|hospital|pharmacy|drug|health|clinic|medic|medicine|test|scan|surgery|dental|eye|optical|malaria|paracetamol|lab|chemist|blood|treatment|prescription|vaccine|injection)\b/,"Healthcare"],
    [/\b(electric|nepa|phcn|water bill|internet|wifi|mtn|airtel|glo|9mobile|data|airtime|recharge|dstv bill|cable|toll|waste|sanitation|gas|cooking gas)\b/,"Utilities"],
    [/\b(school|tuition|book|course|training|education|exam|waec|jamb|neco|uni|university|college|study|lesson|tutorial|certification|seminar|workshop|learning)\b/,"Education"],
    [/\b(church|tithe|offering|mosque|donate|charity|gift for|present|birthday gift|wedding gift|contribution|levy|dues|welfare)\b/,"Gift & Donations"],
    [/\b(business expense|office|stationery|printing|marketing|advert|ad spend|promotion|logistics|delivery|packaging|raw material|inventory purchase|stock purchase)\b/,"Business Expense"],
    [/\b(hair|barber|salon|spa|massage|nails|manicure|pedicure|skincare|makeup|perfume|cream|lotion|deodorant|soap|shampoo|personal care|grooming|waxing)\b/,"Personal Care"],
  ];

  const incomeRules=[
    [/\b(salary|paycheck|wage|payroll|allowance|monthly pay|annual pay)\b/,"Salary"],
    [/\b(freelance|project payment|client payment|design fee|contract payment|gig|commission|consultation fee|service fee|professional fee)\b/,"Freelance"],
    [/\b(business income|business revenue|business profit|sales revenue|product sale|shop revenue|store income)\b/,"Business Income"],
    [/\b(invest|dividend|stock|crypto|shares|interest earned|investment return|roi|forex profit|trading profit|cowrywise|piggybank)\b/,"Investment Returns"],
    [/\b(gift received|gift money|birthday money|surprise money|blessing)\b/,"Gift Received"],
    [/\b(rent collected|rent income|property income|tenant paid|house rent received)\b/,"Rental Income"],
    [/\b(sold house|sold land|sold car|sold property|property sale|land sale|house sale)\b/,"Property Sale"],
    [/\b(side hustle|side income|extra income|gig income|part time|part-time)\b/,"Side Hustle"],
  ];

  const rules = type === "income" ? incomeRules : expenseRules;
  for(const [rx,cat] of rules){ if(rx.test(lower)){ category=cat; break; } }

  const hasModelNumber = /\b(iphone|samsung|galaxy|tecno|infinix|macbook|ipad|note)\s*\d+/i.test(text);
  const confidence = amount > 0 ? (hasModelNumber ? 0.6 : 0.9) : 0.2;

  return { type, amount, category, note:text, date:new Date().toISOString().split("T")[0], confidence };
}

/* ── AI CALL v6 ── */
async function callAI(messages, userApiKey) {
  // 1. Try Vercel serverless (uses ANTHROPIC_API_KEY env var — no user key needed)
  try {
    const r = await fetch("/api/ai", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ messages, max_tokens:600 }),
    });
    if (r.ok) {
      const d = await r.json();
      const text = d.content?.[0]?.text;
      if (text) return text;
    }
  } catch {}

  // 2. Fallback: user's own API key
  if (!userApiKey) throw new Error("NO_KEY");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":userApiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body: JSON.stringify({ model:"claude-haiku-3-5-20241022", max_tokens:600, messages }),
  });
  if (!r.ok) throw new Error(`API_${r.status}`);
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

/* ── STYLES ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#080C18;color:#E8EAF0;font-family:'DM Sans',sans-serif;min-height:100vh;overflow-x:hidden;}
.app{max-width:430px;margin:0 auto;min-height:100vh;position:relative;}
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:18px;margin-bottom:12px;}
.field{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 15px;color:#E8EAF0;font-family:'DM Sans',sans-serif;font-size:15px;outline:none;resize:none;transition:border-color .2s;}
.field:focus{border-color:rgba(0,200,150,.5);background:rgba(0,200,150,.04);}
.btn-green{background:linear-gradient(135deg,#00C896,#00A070);border:none;border-radius:14px;padding:13px 20px;color:#080C18;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;cursor:pointer;width:100%;transition:all .2s;}
.btn-green:hover{opacity:.9;transform:translateY(-1px);}
.btn-green:active{transform:scale(.98);}
.btn-green:disabled{opacity:.35;cursor:not-allowed;transform:none;}
.btn-ghost{background:transparent;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:11px 18px;color:#E8EAF0;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;}
.btn-ghost:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.25);}
.section-label{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;color:rgba(232,234,240,.3);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:12px;}
.nav-btn{background:transparent;border:none;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 12px;color:rgba(232,234,240,.3);font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;cursor:pointer;transition:all .2s;}
.nav-btn.active{color:#00C896;}
.fade{animation:fadeIn .25s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.pulse{animation:pulse 1.2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.2;}}
.spin{display:inline-block;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.notify{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;padding:13px 22px;border-radius:16px;font-size:14px;font-weight:700;max-width:360px;text-align:center;animation:slideDown .25s ease;box-shadow:0 8px 32px rgba(0,0,0,.4);}
@keyframes slideDown{from{opacity:0;transform:translate(-50%,-20px);}to{opacity:1;transform:translate(-50%,0);}}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:1000;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px);}
.modal{background:#111827;border-radius:24px 24px 0 0;padding:26px;width:100%;max-width:430px;max-height:85vh;overflow-y:auto;border-top:1px solid rgba(255,255,255,.08);}
.voice-indicator{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;margin-top:10px;}
.voice-bar{width:3px;border-radius:4px;animation:voiceBar 0.6s ease-in-out infinite alternate;}
@keyframes voiceBar{from{height:6px;opacity:.4;}to{height:22px;opacity:1;}}
`;

let notifyTimer;
function useNotify(){
  const [m,setM]=useState(null);
  const notify=useCallback((text,type="success")=>{ clearTimeout(notifyTimer); setM({text,type}); notifyTimer=setTimeout(()=>setM(null),3000); },[]);
  return [m,notify];
}

const fmt=(n,sym)=>`${sym}${Math.abs(n).toLocaleString("en-NG")}`;

/* ── CATEGORY ICON MAP ── */
const CAT_ICONS={
  "Food & Dining":"🍔","Transport":"🚗","Housing":"🏠","Shopping":"🛍️",
  "Entertainment":"🎬","Healthcare":"💊","Utilities":"⚡","Education":"📚",
  "Gift & Donations":"🎁","Business Expense":"💼","Electronics & Gadgets":"📱",
  "Personal Care":"💅","Salary":"💰","Freelance":"💻","Business Income":"📈",
  "Investment Returns":"📊","Gift Received":"🎁","Rental Income":"🏢",
  "Side Hustle":"⚡","Property Sale":"🏠","Other Income":"💵","Other Expense":"💸",
};

/* ── TX CARD ── */
function TxCard({t,sym,onEdit,onDelete}){
  return (
    <div className="card" style={{padding:"13px 15px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:11,flex:1,minWidth:0}}>
        <div style={{fontSize:21,width:40,height:40,background:"rgba(255,255,255,.05)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {CAT_ICONS[t.category]||"💸"}
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{t.note}</div>
          <div style={{fontSize:11,color:"rgba(232,234,240,.35)"}}>{t.category} · {t.date}</div>
        </div>
      </div>
      <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
        <div style={{fontSize:14,fontWeight:700,color:t.type==="income"?"#00C896":"#FF6B6B"}}>{t.type==="income"?"+":"-"}{fmt(t.amount,sym)}</div>
        <div style={{display:"flex",gap:4,marginTop:5,justifyContent:"flex-end"}}>
          <button onClick={()=>onEdit(t)} style={{background:"transparent",border:"none",color:"rgba(232,234,240,.3)",cursor:"pointer",fontSize:14,padding:"2px 4px"}}>✏️</button>
          <button onClick={()=>onDelete(t.id)} style={{background:"transparent",border:"none",color:"rgba(255,107,107,.35)",cursor:"pointer",fontSize:14,padding:"2px 4px"}}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
export default function App() {
  /* auth */
  const [screen,setScreen]=useState("splash");
  const [accounts,setAccounts]=useState(()=>safeGet("moni_accounts",[]));
  const [currentUser,setCurrentUser]=useState(()=>safeGet("moni_user",null));
  const [authForm,setAuthForm]=useState({name:"",email:"",phone:"",password:"",confirm:""});
  const [authErr,setAuthErr]=useState("");
  const [resetEmail,setResetEmail]=useState("");
  const [resetMsg,setResetMsg]=useState("");

  /* app */
  const [tab,setTab]=useState("dashboard");
  const [transactions,setTransactions]=useState([]);
  const [budgets,setBudgets]=useState({});
  const [inputText,setInputText]=useState("");
  const [processing,setProcessing]=useState(false);
  const [currency,setCurrency]=useState("NGN");
  const [filterType,setFilterType]=useState("all");
  const [reportPeriod,setReportPeriod]=useState("monthly");
  const [editTx,setEditTx]=useState(null);
  const [showBudgets,setShowBudgets]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [showCurrencyPicker,setShowCurrencyPicker]=useState(false);
  const [currencySearch,setCurrencySearch]=useState("");
  const [aiInsight,setAiInsight]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiError,setAiError]=useState("");
  const [apiKey,setApiKey]=useState(()=>safeGet("moni_apikey",""));
  const [nudge,setNudge]=useState(null);
  const [msg,notify]=useNotify();

  /* voice v6 */
  const [recording,setRecording]=useState(false);
  const [voiceStatus,setVoiceStatus]=useState("");
  const [liveTranscript,setLiveTranscript]=useState("");
  const [voiceReview,setVoiceReview]=useState(null);
  const [voiceRetry,setVoiceRetry]=useState(0);
  const recRef=useRef(null);

  const sym=CURRENCIES[currency]?.sym||"₦";

  /* load data */
  useEffect(()=>{
    if(currentUser){
      const uid=currentUser.id;
      setTransactions(safeGet(`moni_tx_${uid}`,[]));
      setBudgets(safeGet(`moni_budgets_${uid}`,{}));
      setCurrency(safeGet(`moni_currency_${uid}`,"NGN"));
    }
  },[currentUser]);

  useEffect(()=>{ if(currentUser) safeSet(`moni_tx_${currentUser.id}`,transactions); },[transactions,currentUser]);
  useEffect(()=>{ if(currentUser) safeSet(`moni_budgets_${currentUser.id}`,budgets); },[budgets,currentUser]);
  useEffect(()=>{ if(currentUser) safeSet(`moni_currency_${currentUser.id}`,currency); },[currency,currentUser]);

  /* splash */
  useEffect(()=>{ setTimeout(()=>setScreen(currentUser?"app":"login"),1600); },[]);

  /* proactive nudge */
  useEffect(()=>{
    if(!currentUser||transactions.length===0) return;
    const today=new Date().toISOString().split("T")[0];
    const lastKey=`moni_lastnudge_${currentUser.id}`;
    if(safeGet(lastKey,""===today)) return;
    const todayTx=transactions.filter(t=>t.date===today);
    const firstName=currentUser.name?.split(" ")[0]||"there";
    for(const cat of CATEGORIES.expense){
      const u=getBudgetUsage(cat,transactions,budgets,reportPeriod);
      if(u&&u.pct>=100){ setNudge({type:"alert",text:`🚨 ${firstName}, your ${cat} budget is exceeded! You've spent ${sym}${u.spent.toLocaleString()}.`}); safeSet(lastKey,today); return; }
      if(u&&u.pct>=80){ setNudge({type:"warn",text:`⚠️ ${firstName}, you've used ${u.pct}% of your ${cat} budget.`}); safeSet(lastKey,today); return; }
    }
    if(todayTx.length===0){
      setNudge({type:"reminder",text:`👋 Hey ${firstName}! Track your money today — you haven't logged anything yet.`});
      safeSet(lastKey,today);
    }
  },[currentUser,transactions,budgets]);

  /* derived */
  const now=new Date();
  function inPeriod(date,period){
    if(period==="weekly"){const d=new Date(date);return (now-d)/864e5<=7;}
    if(period==="monthly") return date.startsWith(now.toISOString().slice(0,7));
    if(period==="yearly") return date.startsWith(String(now.getFullYear()));
    return true;
  }
  const periodTx=transactions.filter(t=>inPeriod(t.date,reportPeriod));
  const filtered=transactions.filter(t=>{ if(filterType!=="all"&&t.type!==filterType) return false; return true; });
  const totalIncome=periodTx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense=periodTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance=totalIncome-totalExpense;
  const saveRate=totalIncome>0?Math.round((balance/totalIncome)*100):0;
  const expenseCats=Object.entries(periodTx.filter(t=>t.type==="expense").reduce((a,t)=>({...a,[t.category]:(a[t.category]||0)+t.amount}),{})).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);

  function getBudgetUsage(cat,txs,bgs,period){
    if(!bgs||!bgs[cat]) return null;
    const pt=(txs||transactions).filter(t=>inPeriod(t.date,period||reportPeriod));
    const spent=pt.filter(t=>t.type==="expense"&&t.category===cat).reduce((s,t)=>s+t.amount,0);
    return {spent,limit:bgs[cat],pct:Math.round((spent/bgs[cat])*100)};
  }

  /* ── VOICE v6 (improved: retry + multiple attempts + clear feedback) ── */
  const startVoice = useCallback((isRetry=false) => {
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){
      notify("Voice only works in Chrome browser. Please open monitracker.com in Chrome.","error");
      return;
    }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec=new SR();
    rec.lang="en-NG";
    rec.continuous=false;
    rec.interimResults=true;
    rec.maxAlternatives=5; // Get multiple guesses, pick best

    rec.onstart=()=>{
      setRecording(true);
      setVoiceStatus(isRetry?"Listening again... speak clearly 🎤":"Listening... speak now 🎤");
      setLiveTranscript("");
    };

    rec.onresult=(e)=>{
      let interimText="";
      let finalText="";
      // Collect all results
      for(let i=0;i<e.results.length;i++){
        // Pick the alternative with highest confidence
        let best=e.results[i][0];
        for(let j=1;j<e.results[i].length;j++){
          if(e.results[i][j].confidence>best.confidence) best=e.results[i][j];
        }
        if(e.results[i].isFinal) finalText+=best.transcript;
        else interimText+=best.transcript;
      }
      if(interimText||finalText) setLiveTranscript(finalText||interimText);
      if(finalText){
        setInputText(finalText.trim());
        setVoiceReview(finalText.trim());
        setVoiceStatus("✅ Got it! Check below and tap 'Add with AI'");
        setVoiceRetry(0);
      }
    };

    rec.onerror=(e)=>{
      setRecording(false);
      setLiveTranscript("");
      if(e.error==="not-allowed"){
        setVoiceStatus("");
        notify("🔒 Microphone blocked. In Chrome: tap the 🔒 lock icon → allow microphone → refresh page.","error");
        return;
      }
      if(e.error==="no-speech"){
        const attempt=voiceRetry+1;
        if(attempt<3){
          setVoiceRetry(attempt);
          setVoiceStatus(`Nothing heard (try ${attempt}/3). Speak louder and closer to mic...`);
          setTimeout(()=>startVoice(true),800); // Auto retry
        } else {
          setVoiceRetry(0);
          setVoiceStatus("");
          notify("Still can't hear. Try typing instead — or move to a quieter spot.","error");
        }
        return;
      }
      setVoiceStatus("");
      notify("Couldn't hear clearly. Speak directly into mic and try again.","error");
    };

    rec.onend=()=>{ setRecording(false); };
    recRef.current=rec;
    try { rec.start(); }
    catch(e){ notify("Microphone error. Close other apps using mic and try again.","error"); }
  },[voiceRetry,notify]);

  const handleVoice=()=>{
    if(recording){ recRef.current?.stop(); setRecording(false); setVoiceStatus(""); setLiveTranscript(""); return; }
    setVoiceReview(null);
    setVoiceRetry(0);
    startVoice(false);
  };

  /* ── PROCESS TRANSACTION ── */
  const handleProcess=async()=>{
    if(!inputText.trim()) return;
    setProcessing(true);
    try {
      const local=localParse(inputText);
      let result=local;
      if(local.confidence<0.75||local.amount===0){
        try {
          const aiText=await callAI([{role:"user",content:`Parse this Nigerian finance transaction. Return ONLY valid JSON, no markdown fences.
Text: "${inputText}"

Rules:
- Extract the PRICE, not model numbers (iPhone 16 for 3 million → amount: 3000000)
- "sold house/car/land" → type: income, category: "Property Sale"
- 3m=3000000, 50k=50000, "three million"=3000000
- Electronics (phones, laptops, gadgets) → "Electronics & Gadgets"

Return: {"type":"income"|"expense","amount":number,"category":"${[...CATEGORIES.income,...CATEGORIES.expense].join("|")}","note":"short clean description","date":"${new Date().toISOString().split("T")[0]}"}`
          }],apiKey);
          const json=aiText.match(/\{[\s\S]*?\}/)?.[0];
          if(json){ result={...JSON.parse(json),date:new Date().toISOString().split("T")[0]}; }
        } catch {}
      }
      if(!result.amount||result.amount<=0){
        notify("Couldn't find the amount. Try: 'Spent ₦5,000 on food'","error");
        setProcessing(false); return;
      }
      const tx={id:Date.now(),type:result.type||"expense",amount:result.amount,category:result.category||"Other Expense",note:result.note||inputText,date:result.date||new Date().toISOString().split("T")[0]};
      setTransactions(prev=>[tx,...prev]);
      setInputText(""); setVoiceReview(null); setLiveTranscript("");
      notify(`${tx.type==="income"?"✅ Income":"✅ Expense"} of ${sym}${tx.amount.toLocaleString()} added!`);
    } catch(e){
      notify("Something went wrong. Please try again.","error");
    }
    setProcessing(false);
  };

  /* ── AI INSIGHTS ── */
  const fetchInsights=async()=>{
    if(transactions.length===0){notify("Add some transactions first!","error");return;}
    setAiLoading(true);setAiError("");setAiInsight("");
    try {
      const inc=periodTx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
      const exp=periodTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
      const topCats=Object.entries(periodTx.filter(t=>t.type==="expense").reduce((a,t)=>({...a,[t.category]:(a[t.category]||0)+t.amount}),{})).sort((a,b)=>b[1]-a[1]).slice(0,3);
      const text=await callAI([{role:"user",content:`You are Moni AI, a warm, smart Nigerian financial advisor. Give friendly, practical insights in 3 short paragraphs (under 150 words total). Use naira amounts where relevant.

User data (${reportPeriod}):
- Income: ${sym}${inc.toLocaleString()}
- Expenses: ${sym}${exp.toLocaleString()}
- Balance: ${sym}${(inc-exp).toLocaleString()}
- Top spending: ${topCats.map(([k,v])=>`${k}: ${sym}${v.toLocaleString()}`).join(", ")||"none yet"}

Give: 1) What's going well, 2) One specific saving opportunity for Nigeria, 3) One action to take this week. Keep it encouraging and real.`
      }],apiKey);
      setAiInsight(text);
    } catch(e){
      if(e.message==="NO_KEY"){
        setAiError("AI Advisor needs setup. Ask your admin to configure the API key in Vercel, or add your own key in Settings.");
      } else {
        setAiError("Couldn't connect to AI. Check your internet and try again.");
      }
    }
    setAiLoading(false);
  };

  /* ── CHART DATA ── */
  const getBarData=()=>{
    const data=[];
    for(let i=6;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      const ds=d.toISOString().split("T")[0];
      const txs=transactions.filter(t=>t.date===ds);
      data.push({day:d.toLocaleDateString("en",{weekday:"short"}),income:txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),expense:txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)});
    }
    return data;
  };
  const getTrendData=()=>{
    const data=[];
    for(let i=5;i>=0;i--){
      const d=new Date();d.setMonth(d.getMonth()-i);
      const key=d.toISOString().slice(0,7);
      const txs=transactions.filter(t=>t.date.startsWith(key));
      const inc=txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
      const exp=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
      data.push({month:d.toLocaleDateString("en",{month:"short"}),balance:inc-exp});
    }
    return data;
  };

  const exportPDF=()=>{
    const win=window.open("","_blank");
    if(!win)return;
    const rows=periodTx.map(t=>`<tr><td>${t.date}</td><td>${t.type}</td><td>${t.category}</td><td style="color:${t.type==="income"?"#00a870":"#e53e3e"}">${sym}${t.amount.toLocaleString()}</td><td>${t.note}</td></tr>`).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Moni Tracker Report</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#1a202c;}h1{color:#00a870;font-size:24px;margin-bottom:4px;}p{margin:4px 0;color:#666;font-size:13px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#f7fafc;padding:10px 12px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #e2e8f0;}td{padding:10px 12px;border-bottom:1px solid #f0f4f8;font-size:13px;}.summary{display:flex;gap:20px;margin:16px 0;}.stat{background:#f7fafc;border-radius:10px;padding:12px 18px;}.stat-label{font-size:11px;color:#999;}.stat-value{font-size:20px;font-weight:700;}</style></head><body><h1>📊 Moni Tracker — ${reportPeriod.charAt(0).toUpperCase()+reportPeriod.slice(1)} Report</h1><p>Account: ${currentUser?.name} | Generated: ${new Date().toLocaleDateString("en-NG",{dateStyle:"full"})}</p><div class="summary"><div class="stat"><div class="stat-label">INCOME</div><div class="stat-value" style="color:#00a870">${sym}${totalIncome.toLocaleString()}</div></div><div class="stat"><div class="stat-label">EXPENSES</div><div class="stat-value" style="color:#e53e3e">${sym}${totalExpense.toLocaleString()}</div></div><div class="stat"><div class="stat-label">BALANCE</div><div class="stat-value">${sym}${balance.toLocaleString()}</div></div></div><table><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th></tr>${rows}</table></body></html>`);
    win.document.close();
    setTimeout(()=>win.print(),400);
  };

  /* auth */
  const doRegister=()=>{
    setAuthErr("");
    if(!authForm.name||!authForm.email||!authForm.password){setAuthErr("Please fill all required fields");return;}
    if(authForm.password!==authForm.confirm){setAuthErr("Passwords don't match");return;}
    if(authForm.password.length<6){setAuthErr("Password must be at least 6 characters");return;}
    if(accounts.find(a=>a.email.toLowerCase()===authForm.email.toLowerCase())){setAuthErr("This email is already registered");return;}
    const user={id:Date.now(),name:authForm.name,email:authForm.email,phone:authForm.phone,password:authForm.password};
    const upd=[...accounts,user];
    setAccounts(upd);safeSet("moni_accounts",upd);
    setCurrentUser(user);safeSet("moni_user",user);
    setScreen("app");
  };
  const doLogin=()=>{
    setAuthErr("");
    const user=accounts.find(a=>a.email.toLowerCase()===authForm.email.toLowerCase()&&a.password===authForm.password);
    if(!user){setAuthErr("Wrong email or password. Check and try again.");return;}
    setCurrentUser(user);safeSet("moni_user",user);
    setScreen("app");
  };
  const doLogout=()=>{ safeDel("moni_user");setCurrentUser(null);setTransactions([]);setScreen("login"); };
  const doReset=()=>{
    setResetMsg("");
    const user=accounts.find(a=>a.email.toLowerCase()===resetEmail.toLowerCase());
    if(!user){setResetMsg("❌ No account found with that email.");return;}
    setResetMsg(`✅ Account found for "${user.name}".\n\nYour password hint: it's saved on this device. Try your phone number, your name, or a common password you use.`);
  };
  const saveEdit=()=>{ setTransactions(p=>p.map(t=>t.id===editTx.id?editTx:t)); setEditTx(null); notify("Transaction updated ✓"); };
  const deleteTx=(id)=>{ setTransactions(p=>p.filter(t=>t.id!==id)); notify("Transaction deleted"); };

  const filteredCurrencies=Object.entries(CURRENCIES).filter(([k,v])=>
    !currencySearch||(k+v.name+v.flag).toLowerCase().includes(currencySearch.toLowerCase())
  );

  /* ═══════════ SPLASH ═══════════ */
  if(screen==="splash") return (
    <div style={{background:"#080C18",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{position:"relative"}}>
        <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#00C896,#059669)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,boxShadow:"0 0 60px rgba(0,200,150,.3)"}}>
          <span style={{fontSize:36}}>₦</span>
        </div>
      </div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:32,fontWeight:800,color:"#E8EAF0"}}>Moni<span style={{color:"#00C896"}}>Tracker</span></div>
      <div style={{fontSize:12,color:"rgba(232,234,240,.3)",letterSpacing:3,marginTop:4}}>AI-POWERED FINANCE</div>
      <div style={{marginTop:32,width:48,height:3,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",background:"linear-gradient(90deg,#00C896,#6C63FF)",borderRadius:4,animation:"load 1.4s ease forwards"}}/>
      </div>
      <style>{`@keyframes load{from{width:0}to{width:100%}}`}</style>
      <div style={{position:"absolute",bottom:24,fontSize:11,color:"rgba(232,234,240,.2)",letterSpacing:1}}>BUILT FOR AFRICA</div>
    </div>
  );

  /* ═══════════ LOGIN ═══════════ */
  if(screen==="login") return (
    <div className="app" style={{padding:"40px 24px 30px"}}>
      <style>{CSS}</style>
      <div style={{marginBottom:40}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:32,fontWeight:800,marginBottom:6}}>Welcome back 👋</div>
        <div style={{fontSize:14,color:"rgba(232,234,240,.4)"}}>Sign in to MoniTracker</div>
      </div>
      {authErr&&<div style={{background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.3)",borderRadius:13,padding:"13px 15px",marginBottom:16,fontSize:13,color:"#FF6B6B",fontWeight:500}}>{authErr}</div>}
      {[{k:"email",l:"Email address",p:"you@gmail.com",t:"email"},{k:"password",l:"Password",p:"••••••••",t:"password"}].map(f=>(
        <div key={f.k} style={{marginBottom:14}}>
          <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:7,fontWeight:700,letterSpacing:.5}}>{f.l.toUpperCase()}</div>
          <input className="field" type={f.t} placeholder={f.p} value={authForm[f.k]} onChange={e=>setAuthForm(p=>({...p,[f.k]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        </div>
      ))}
      <div style={{marginTop:6}}><button className="btn-green" onClick={doLogin}>Sign In →</button></div>
      <button onClick={()=>{setScreen("forgot");setAuthErr("");}} style={{background:"transparent",border:"none",color:"rgba(0,200,150,.7)",fontFamily:"DM Sans",fontSize:13,cursor:"pointer",width:"100%",marginTop:14,fontWeight:600}}>Forgot password?</button>
      <div style={{textAlign:"center",marginTop:28,fontSize:14,color:"rgba(232,234,240,.35)"}}>
        No account? <span onClick={()=>{setScreen("register");setAuthErr("");}} style={{color:"#00C896",cursor:"pointer",fontWeight:700}}>Create one free</span>
      </div>
    </div>
  );

  /* ═══════════ FORGOT ═══════════ */
  if(screen==="forgot") return (
    <div className="app" style={{padding:"40px 24px 30px"}}>
      <style>{CSS}</style>
      <button onClick={()=>setScreen("login")} style={{background:"transparent",border:"none",color:"rgba(232,234,240,.4)",fontFamily:"DM Sans",fontSize:14,cursor:"pointer",marginBottom:32,display:"flex",alignItems:"center",gap:6}}>← Back</button>
      <div style={{marginBottom:32}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,marginBottom:6}}>Forgot Password?</div>
        <div style={{fontSize:13,color:"rgba(232,234,240,.35)"}}>Find your account by email</div>
      </div>
      <div style={{marginBottom:14}}>
        <input className="field" type="email" placeholder="your@email.com" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doReset()}/>
      </div>
      <button className="btn-green" onClick={doReset}>Find My Account</button>
      {resetMsg&&<div style={{background:"rgba(0,200,150,.07)",border:"1px solid rgba(0,200,150,.2)",borderRadius:13,padding:"15px",marginTop:14,fontSize:13,color:"rgba(232,234,240,.8)",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{resetMsg}</div>}
    </div>
  );

  /* ═══════════ REGISTER ═══════════ */
  if(screen==="register") return (
    <div className="app" style={{padding:"40px 24px 30px"}}>
      <style>{CSS}</style>
      <div style={{marginBottom:36}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,color:"#00C896",marginBottom:6}}>Create Account ✨</div>
        <div style={{fontSize:13,color:"rgba(232,234,240,.35)"}}>Track your money smarter with AI</div>
      </div>
      {authErr&&<div style={{background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.3)",borderRadius:13,padding:"13px 15px",marginBottom:16,fontSize:13,color:"#FF6B6B"}}>{authErr}</div>}
      {[{k:"name",l:"Full Name",p:"Thomas James",t:"text"},{k:"email",l:"Email Address",p:"you@gmail.com",t:"email"},{k:"phone",l:"Phone (optional)",p:"+234...",t:"tel"},{k:"password",l:"Password",p:"Min. 6 characters",t:"password"},{k:"confirm",l:"Confirm Password",p:"Same password again",t:"password"}].map(f=>(
        <div key={f.k} style={{marginBottom:12}}>
          <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:700,letterSpacing:.5}}>{f.l.toUpperCase()}</div>
          <input className="field" type={f.t} placeholder={f.p} value={authForm[f.k]} onChange={e=>setAuthForm(p=>({...p,[f.k]:e.target.value}))}/>
        </div>
      ))}
      <div style={{marginTop:8}}><button className="btn-green" onClick={doRegister}>Create Account →</button></div>
      <div style={{textAlign:"center",marginTop:22,fontSize:14,color:"rgba(232,234,240,.35)"}}>
        Already registered? <span onClick={()=>{setScreen("login");setAuthErr("");}} style={{color:"#00C896",cursor:"pointer",fontWeight:700}}>Sign In</span>
      </div>
    </div>
  );

  /* ═══════════ MAIN APP ═══════════ */
  return (
    <div className="app">
      <style>{CSS}</style>

      {msg&&<div className="notify" style={{background:msg.type==="error"?"rgba(220,38,38,.97)":"rgba(0,180,130,.97)",color:"#fff"}}>{msg.text}</div>}

      {nudge&&(
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:998,background:nudge.type==="alert"?"#DC2626":nudge.type==="warn"?"#D97706":"#6C63FF",padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#fff",flex:1,paddingRight:8,lineHeight:1.5}}>{nudge.text}</div>
          <button onClick={()=>setNudge(null)} style={{background:"rgba(0,0,0,.2)",border:"none",color:"#fff",cursor:"pointer",fontSize:16,borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
        </div>
      )}

      {/* HEADER */}
      <div style={{padding:"14px 18px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"rgba(8,12,24,.96)",backdropFilter:"blur(20px)",zIndex:100,borderBottom:"1px solid rgba(255,255,255,.05)"}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800}}>Moni<span style={{color:"#00C896"}}>Tracker</span></div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>{setShowCurrencyPicker(true);setCurrencySearch("");}} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"6px 12px",color:"#E8EAF0",fontFamily:"DM Sans",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <span>{CURRENCIES[currency]?.flag||"🌍"}</span> {sym}
          </button>
          <button onClick={()=>setShowSettings(true)} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(232,234,240,.5)",cursor:"pointer",fontSize:16}}>⚙️</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"14px 16px 100px",paddingTop:nudge?62:14}}>

        {/* ═══ DASHBOARD ═══ */}
        {tab==="dashboard"&&<div className="fade">
          {/* Balance card */}
          <div style={{background:"linear-gradient(135deg,#00C896 0%,#047857 100%)",borderRadius:24,padding:"22px 22px 20px",marginBottom:14,position:"relative",overflow:"hidden",boxShadow:"0 12px 40px rgba(0,200,150,.2)"}}>
            <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,background:"rgba(255,255,255,.07)",borderRadius:"50%"}}/>
            <div style={{position:"absolute",bottom:-20,left:-10,width:100,height:100,background:"rgba(0,0,0,.08)",borderRadius:"50%"}}/>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(8,12,24,.55)",letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>Total Balance</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:34,fontWeight:800,color:"#080C18",marginBottom:16,lineHeight:1.1}}>{balance<0?"- ":""}{fmt(Math.abs(balance),sym)}</div>
            <div style={{display:"flex",gap:18}}>
              {[{l:"Income",v:fmt(totalIncome,sym),arrow:"↑"},{l:"Expenses",v:fmt(totalExpense,sym),arrow:"↓"},{l:"Save",v:`${saveRate}%`,arrow:"%"}].map(s=>(
                <div key={s.l}><div style={{fontSize:10,color:"rgba(8,12,24,.5)",marginBottom:2}}>{s.l}</div><div style={{fontSize:13,fontWeight:700,color:"rgba(8,12,24,.85)"}}>{s.arrow} {s.v}</div></div>
              ))}
            </div>
          </div>

          {/* Period filter */}
          <div style={{display:"flex",gap:6,marginBottom:14,background:"rgba(255,255,255,.04)",borderRadius:12,padding:4}}>
            {["weekly","monthly","yearly"].map(p=>(
              <button key={p} onClick={()=>setReportPeriod(p)} style={{flex:1,padding:"8px",borderRadius:9,border:"none",background:reportPeriod===p?"rgba(0,200,150,.15)":"transparent",color:reportPeriod===p?"#00C896":"rgba(232,234,240,.4)",fontFamily:"DM Sans",fontWeight:700,fontSize:11,cursor:"pointer",textTransform:"capitalize",transition:"all .2s"}}>{p}</button>
            ))}
          </div>

          {/* Budget alerts */}
          {CATEGORIES.expense.filter(c=>{const u=getBudgetUsage(c,transactions,budgets,reportPeriod);return u&&u.pct>=80;}).slice(0,2).map(c=>{
            const u=getBudgetUsage(c,transactions,budgets,reportPeriod);
            return(
              <div key={c} style={{background:u.pct>=100?"rgba(220,38,38,.07)":"rgba(217,119,6,.07)",border:`1px solid ${u.pct>=100?"rgba(220,38,38,.25)":"rgba(217,119,6,.25)"}`,borderRadius:13,padding:"11px 15px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:600,color:u.pct>=100?"#EF4444":"#F59E0B"}}>{u.pct>=100?"🚨":"⚠️"} {c} {u.pct>=100?"exceeded!":u.pct+"% used"}</span>
                <span style={{fontSize:12,color:"rgba(232,234,240,.4)"}}>{sym}{u.spent.toLocaleString()} / {sym}{u.limit.toLocaleString()}</span>
              </div>
            );
          })}

          {/* INPUT BOX */}
          <div className="card" style={{marginBottom:16}}>
            <div className="section-label">ADD TRANSACTION</div>
            <textarea className="field" rows={2}
              placeholder={`"Bought iPhone 16 for ₦3 million" · "Received ₦150k salary"`}
              value={inputText}
              onChange={e=>{setInputText(e.target.value);if(!recording)setVoiceReview(null);}}
            />

            {/* Live transcript while recording */}
            {recording&&(
              <div className="voice-indicator" style={{background:"rgba(255,107,107,.07)",border:"1px solid rgba(255,107,107,.2)"}}>
                <div style={{display:"flex",gap:3,alignItems:"center"}}>
                  {[1,2,3,4].map(i=>(
                    <div key={i} className="voice-bar" style={{background:"#FF6B6B",animationDelay:`${i*0.1}s`}}/>
                  ))}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:"#FF6B6B",fontWeight:700,marginBottom:2}}>{voiceStatus}</div>
                  {liveTranscript&&<div style={{fontSize:13,color:"rgba(232,234,240,.8)",fontStyle:"italic"}}>"{liveTranscript}"</div>}
                </div>
              </div>
            )}

            {/* Status when not recording */}
            {!recording&&voiceStatus&&!voiceReview&&(
              <div style={{fontSize:12,color:"#00C896",marginTop:8,fontWeight:600}}>{voiceStatus}</div>
            )}

            {/* Voice review step */}
            {voiceReview&&!recording&&(
              <div style={{background:"rgba(0,200,150,.06)",border:"1px solid rgba(0,200,150,.2)",borderRadius:14,padding:"14px",marginTop:10}}>
                <div style={{fontSize:12,color:"rgba(0,200,150,.8)",fontWeight:700,marginBottom:6}}>✅ Heard:</div>
                <div style={{fontSize:14,color:"#E8EAF0",marginBottom:10,lineHeight:1.6}}>"{voiceReview}"</div>
                <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:10}}>Edit text above if needed, then tap "Add with AI"</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={handleVoice} className="btn-ghost" style={{flex:1,fontSize:12,padding:"8px"}}>🎙️ Re-record</button>
                  <button onClick={()=>{setVoiceReview(null);setInputText("");setVoiceStatus("");}} className="btn-ghost" style={{flex:1,fontSize:12,padding:"8px",color:"#EF4444",borderColor:"rgba(239,68,68,.3)"}}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10,marginTop:10}}>
              <button className="btn-ghost" onClick={handleVoice}
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",borderColor:recording?"rgba(255,107,107,.4)":"rgba(255,255,255,.12)",color:recording?"#FF6B6B":"#E8EAF0",background:recording?"rgba(255,107,107,.06)":"transparent"}}>
                <span style={{fontSize:18}}>{recording?"⏹":"🎙️"}</span>
                <span style={{fontSize:13,fontWeight:600}}>{recording?"Stop":"Voice"}</span>
              </button>
              <button className="btn-green" onClick={handleProcess} disabled={!inputText.trim()||processing}
                style={{flex:2,borderRadius:12,padding:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:14}}>
                {processing?<><span className="spin">⟳</span> Processing...</>:<>✦ Add with AI</>}
              </button>
            </div>

            <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
              {["Food","Transport","Salary","Electronics","Business"].map(c=>(
                <button key={c} onClick={()=>setInputText(`Spent on ${c}`)}
                  style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:"6px 12px",color:"rgba(232,234,240,.5)",fontFamily:"DM Sans",fontSize:12,cursor:"pointer",transition:"all .2s"}}>+ {c}</button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {transactions.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:52,marginBottom:16}}>📊</div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:8}}>Start tracking your money</div>
              <div style={{fontSize:13,color:"rgba(232,234,240,.35)",lineHeight:1.8}}>Speak or type your first transaction.<br/><span style={{color:"#00C896"}}>"Received ₦50,000 salary today"</span></div>
            </div>
          )}

          {transactions.length>0&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div className="section-label" style={{marginBottom:0}}>RECENT</div>
              <button onClick={()=>setTab("transactions")} style={{background:"transparent",border:"none",color:"#00C896",fontSize:12,cursor:"pointer",fontFamily:"DM Sans",fontWeight:700}}>See all →</button>
            </div>
            {transactions.slice(0,5).map(t=><TxCard key={t.id} t={t} sym={sym} onEdit={setEditTx} onDelete={deleteTx}/>)}
          </>}
        </div>}

        {/* ═══ HISTORY ═══ */}
        {tab==="transactions"&&<div className="fade">
          <div style={{display:"flex",gap:6,marginBottom:14,background:"rgba(255,255,255,.04)",borderRadius:12,padding:4}}>
            {["all","income","expense"].map(f=>(
              <button key={f} onClick={()=>setFilterType(f)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:filterType===f?f==="income"?"rgba(0,200,150,.2)":f==="expense"?"rgba(239,68,68,.2)":"rgba(108,99,255,.2)":"transparent",color:filterType===f?f==="income"?"#00C896":f==="expense"?"#EF4444":"#A78BFA":"rgba(232,234,240,.4)",fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize",transition:"all .2s"}}>{f}</button>
            ))}
          </div>
          <div className="section-label">{filtered.length} TRANSACTION{filtered.length!==1?"S":""}</div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"rgba(232,234,240,.3)"}}>
            <div style={{fontSize:40,marginBottom:10}}>📭</div>No transactions yet
          </div>}
          {filtered.map(t=><TxCard key={t.id} t={t} sym={sym} onEdit={setEditTx} onDelete={deleteTx}/>)}
        </div>}

        {/* ═══ REPORTS ═══ */}
        {tab==="reports"&&<div className="fade">
          <div style={{display:"flex",gap:6,marginBottom:16,background:"rgba(255,255,255,.04)",borderRadius:12,padding:4}}>
            {["weekly","monthly","yearly"].map(p=>(
              <button key={p} onClick={()=>setReportPeriod(p)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:reportPeriod===p?"rgba(0,200,150,.2)":"transparent",color:reportPeriod===p?"#00C896":"rgba(232,234,240,.4)",fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize",transition:"all .2s"}}>{p}</button>
            ))}
          </div>
          <button onClick={exportPDF} style={{width:"100%",marginBottom:10,padding:"13px",borderRadius:13,border:"1px solid rgba(0,200,150,.3)",background:"rgba(0,200,150,.06)",color:"#00C896",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            📄 Export Report as PDF
          </button>
          <button onClick={()=>setShowBudgets(true)} style={{width:"100%",marginBottom:16,padding:"13px",borderRadius:13,border:"1px solid rgba(108,99,255,.3)",background:"rgba(108,99,255,.06)",color:"#A78BFA",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            🎯 Set Monthly Budgets
          </button>
          {transactions.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"rgba(232,234,240,.3)"}}>
            <div style={{fontSize:40,marginBottom:10}}>📊</div>Add transactions to see reports
          </div>}
          {transactions.length>0&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{l:"Income",v:fmt(totalIncome,sym),c:"#00C896",i:"↑"},{l:"Expenses",v:fmt(totalExpense,sym),c:"#EF4444",i:"↓"},{l:"Balance",v:fmt(Math.abs(balance),sym),c:balance>=0?"#6C63FF":"#EF4444",i:balance>=0?"✓":"!"},{l:"Save Rate",v:`${saveRate}%`,c:"#F59E0B",i:"%"}].map(s=>(
                <div key={s.l} className="card" style={{textAlign:"center",padding:16}}>
                  <div style={{fontSize:20,color:s.c,marginBottom:4}}>{s.i}</div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:17,fontWeight:800,color:s.c,marginBottom:3}}>{s.v}</div>
                  <div style={{fontSize:10,color:"rgba(232,234,240,.35)",letterSpacing:1}}>{s.l.toUpperCase()}</div>
                </div>
              ))}
            </div>
            {expenseCats.length>0&&<div className="card" style={{marginBottom:12}}>
              <div className="section-label">SPENDING BREAKDOWN</div>
              <ResponsiveContainer width="100%" height={185}>
                <PieChart><Pie data={expenseCats} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                  {expenseCats.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie><Tooltip formatter={v=>`${sym}${v.toLocaleString()}`} contentStyle={{background:"#1A2035",border:"none",borderRadius:10,color:"#E8EAF0",fontSize:12}}/></PieChart>
              </ResponsiveContainer>
              {expenseCats.slice(0,5).map((c,i)=>(
                <div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:9}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:9,height:9,borderRadius:3,background:COLORS[i%COLORS.length],flexShrink:0}}/><span style={{fontSize:13}}>{c.name}</span></div>
                  <span style={{fontSize:13,fontWeight:700}}>{sym}{c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>}
            <div className="card" style={{marginBottom:12}}>
              <div className="section-label">INCOME VS EXPENSES — 7 DAYS</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={getBarData()} barSize={11}><XAxis dataKey="day" tick={{fill:"rgba(232,234,240,.3)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:"#1A2035",border:"none",borderRadius:10,color:"#E8EAF0",fontSize:12}} formatter={v=>`${sym}${v.toLocaleString()}`}/><Bar dataKey="income" fill="#00C896" radius={[5,5,0,0]} name="Income"/><Bar dataKey="expense" fill="#EF4444" radius={[5,5,0,0]} name="Expense"/><Legend wrapperStyle={{fontSize:11,color:"rgba(232,234,240,.4)"}}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="section-label">6-MONTH BALANCE TREND</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={getTrendData()}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis dataKey="month" tick={{fill:"rgba(232,234,240,.3)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:"#1A2035",border:"none",borderRadius:10,color:"#E8EAF0",fontSize:12}} formatter={v=>`${sym}${v.toLocaleString()}`}/><Line type="monotone" dataKey="balance" stroke="#6C63FF" strokeWidth={2.5} dot={{fill:"#6C63FF",r:3}}/></LineChart>
              </ResponsiveContainer>
            </div>
          </>}
        </div>}

        {/* ═══ INSIGHTS ═══ */}
        {tab==="insights"&&<div className="fade">
          <div style={{background:"linear-gradient(135deg,rgba(108,99,255,.15),rgba(0,200,150,.06))",border:"1px solid rgba(108,99,255,.2)",borderRadius:22,padding:22,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:48,height:48,background:"linear-gradient(135deg,#6C63FF,#00C896)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>✨</div>
              <div><div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800}}>Moni AI Advisor</div><div style={{fontSize:12,color:"rgba(232,234,240,.35)"}}>Personalised financial insights</div></div>
            </div>
            {aiLoading&&<div style={{textAlign:"center",padding:32}}><div style={{fontSize:32,marginBottom:10}} className="pulse">🤖</div><div style={{color:"rgba(232,234,240,.4)",fontSize:13}}>Analysing your finances...</div></div>}
            {!aiLoading&&aiError&&(
              <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:13,padding:16,marginBottom:12}}>
                <div style={{color:"#EF4444",fontWeight:700,marginBottom:8}}>⚠️ AI not connected</div>
                <div style={{fontSize:13,color:"rgba(232,234,240,.5)",marginBottom:14,lineHeight:1.7}}>{aiError}</div>
                <button className="btn-green" onClick={fetchInsights} style={{borderRadius:10,padding:"10px"}}>Try Again</button>
              </div>
            )}
            {!aiLoading&&!aiError&&aiInsight&&<>
              <div style={{fontSize:14,lineHeight:1.9,color:"rgba(232,234,240,.85)",whiteSpace:"pre-wrap"}}>{aiInsight}</div>
              <button className="btn-ghost" onClick={fetchInsights} style={{marginTop:14,width:"100%",fontSize:13}}>↻ Refresh Insights</button>
            </>}
            {!aiLoading&&!aiError&&!aiInsight&&<div style={{textAlign:"center",padding:24}}>
              <div style={{fontSize:13,color:"rgba(232,234,240,.4)",marginBottom:16,lineHeight:1.7}}>{transactions.length===0?"Add some transactions first to unlock personalised AI advice.":"Get personalised financial advice based on your spending."}</div>
              <button className="btn-green" onClick={fetchInsights} disabled={transactions.length===0} style={{borderRadius:12,padding:"12px 28px",width:"auto"}}>Get My Insights ✨</button>
            </div>}
          </div>

          {Object.keys(budgets).length>0&&<div className="card" style={{marginBottom:12}}>
            <div className="section-label">BUDGET TRACKER</div>
            {Object.keys(budgets).map((cat,i)=>{ const u=getBudgetUsage(cat,transactions,budgets,reportPeriod); if(!u) return null; return (
              <div key={cat} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13}}>{cat}</span><span style={{fontSize:12,fontWeight:700,color:u.pct>=100?"#EF4444":u.pct>=80?"#F59E0B":"#00C896"}}>{sym}{u.spent.toLocaleString()} / {sym}{u.limit.toLocaleString()}</span></div>
                <div style={{height:7,background:"rgba(255,255,255,.06)",borderRadius:10}}><div style={{height:"100%",borderRadius:10,background:u.pct>=100?"#EF4444":u.pct>=80?"#F59E0B":COLORS[i%COLORS.length],width:`${Math.min(u.pct,100)}%`,transition:"width .8s"}}/></div>
              </div>
            ); })}
            <button onClick={()=>setShowBudgets(true)} className="btn-ghost" style={{width:"100%",fontSize:13,marginTop:4}}>Edit Budgets</button>
          </div>}

          {expenseCats.length>0&&<div className="card">
            <div className="section-label">TOP SPENDING</div>
            {expenseCats.slice(0,5).map((c,i)=>(
              <div key={c.name} style={{marginBottom:13}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13}}>{c.name}</span><span style={{fontSize:13,fontWeight:700,color:"#EF4444"}}>{sym}{c.value.toLocaleString()}</span></div>
                <div style={{height:5,background:"rgba(255,255,255,.06)",borderRadius:10}}><div style={{height:"100%",borderRadius:10,background:COLORS[i],width:`${(c.value/expenseCats[0].value)*100}%`,transition:"width .8s"}}/></div>
              </div>
            ))}
          </div>}
          {transactions.length===0&&<div style={{textAlign:"center",padding:"30px 20px",color:"rgba(232,234,240,.3)"}}>
            <div style={{fontSize:40,marginBottom:10}}>💡</div>Add transactions to unlock insights
          </div>}
        </div>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:430,margin:"0 auto",left:"50%",transform:"translateX(-50%)",background:"rgba(8,12,24,.97)",backdropFilter:"blur(24px)",borderTop:"1px solid rgba(255,255,255,.05)",padding:"8px 0 16px",display:"flex",justifyContent:"space-around",zIndex:100}}>
        {[{id:"dashboard",icon:"⊞",l:"Home"},{id:"transactions",icon:"↕",l:"History"},{id:"reports",icon:"◎",l:"Reports"},{id:"insights",icon:"✦",l:"Insights"}].map(n=>(
          <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:22}}>{n.icon}</span><span>{n.l}</span>
          </button>
        ))}
      </div>

      {/* ── EDIT MODAL ── */}
      {editTx&&(
        <div className="modal-bg" onClick={()=>setEditTx(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:20}}>Edit Transaction ✏️</div>
            {[{l:"Note / Description",k:"note",t:"text"},{l:"Amount",k:"amount",t:"number"}].map(f=>(
              <div key={f.k} style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:700,letterSpacing:.5}}>{f.l.toUpperCase()}</div>
                <input className="field" type={f.t} value={editTx[f.k]} onChange={e=>setEditTx(p=>({...p,[f.k]:f.t==="number"?parseFloat(e.target.value)||0:e.target.value}))}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:700,letterSpacing:.5}}>TYPE</div>
              <select className="field" value={editTx.type} onChange={e=>setEditTx(p=>({...p,type:e.target.value}))}>
                <option value="income">Income</option><option value="expense">Expense</option>
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:700,letterSpacing:.5}}>CATEGORY</div>
              <select className="field" value={editTx.category} onChange={e=>setEditTx(p=>({...p,category:e.target.value}))}>
                {[...CATEGORIES.income,...CATEGORIES.expense].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:700,letterSpacing:.5}}>DATE</div>
              <input className="field" type="date" value={editTx.date} onChange={e=>setEditTx(p=>({...p,date:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn-ghost" onClick={()=>setEditTx(null)} style={{flex:1}}>Cancel</button>
              <button className="btn-green" onClick={saveEdit} style={{flex:2}}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BUDGETS MODAL ── */}
      {showBudgets&&(
        <div className="modal-bg" onClick={()=>setShowBudgets(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>Monthly Budgets 🎯</div>
            <div style={{fontSize:13,color:"rgba(232,234,240,.35)",marginBottom:18}}>Set limits to get alerts when you're close</div>
            {CATEGORIES.expense.map(cat=>{
              const u=getBudgetUsage(cat,transactions,budgets,reportPeriod);
              return (
                <div key={cat} style={{marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{CAT_ICONS[cat]||"•"} {cat}</div>
                    {u&&<div style={{fontSize:11,color:u.pct>=100?"#EF4444":"rgba(232,234,240,.3)",marginTop:2}}>Spent: {sym}{u.spent.toLocaleString()}</div>}
                  </div>
                  <input className="field" type="number" placeholder="0"
                    value={budgets[cat]||""}
                    onChange={e=>{ const v=parseFloat(e.target.value)||0; setBudgets(p=>v?{...p,[cat]:v}:(({[cat]:_,...rest})=>rest)(p)); }}
                    style={{width:120,padding:"9px 12px",fontSize:13}}
                  />
                </div>
              );
            })}
            <button className="btn-green" onClick={()=>setShowBudgets(false)} style={{marginTop:8}}>Save Budgets ✓</button>
          </div>
        </div>
      )}

      {/* ── CURRENCY PICKER MODAL ── */}
      {showCurrencyPicker&&(
        <div className="modal-bg" onClick={()=>setShowCurrencyPicker(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxHeight:"90vh"}}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:14}}>Choose Currency 🌍</div>
            <input className="field" placeholder="Search currency..." value={currencySearch} onChange={e=>setCurrencySearch(e.target.value)} style={{marginBottom:12}}/>
            <div style={{maxHeight:"55vh",overflowY:"auto"}}>
              {filteredCurrencies.map(([k,v])=>(
                <button key={k} onClick={()=>{setCurrency(k);setShowCurrencyPicker(false);}}
                  style={{width:"100%",background:currency===k?"rgba(0,200,150,.1)":"transparent",border:`1px solid ${currency===k?"rgba(0,200,150,.3)":"rgba(255,255,255,.07)"}`,borderRadius:12,padding:"11px 14px",marginBottom:6,display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left",color:"#E8EAF0",fontFamily:"DM Sans"}}>
                  <span style={{fontSize:20}}>{v.flag}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{v.name}</div>
                    <div style={{fontSize:11,color:"rgba(232,234,240,.4)"}}>{k} · {v.sym}</div>
                  </div>
                  {currency===k&&<span style={{color:"#00C896",fontSize:16}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ── */}
      {showSettings&&(
        <div className="modal-bg" onClick={()=>setShowSettings(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:18}}>Settings ⚙️</div>
            <div style={{marginBottom:16,padding:"13px 15px",background:"rgba(0,200,150,.05)",border:"1px solid rgba(0,200,150,.15)",borderRadius:13,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,background:"linear-gradient(135deg,#00C896,#047857)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#080C18",flexShrink:0}}>
                {currentUser?.name?.charAt(0)||"U"}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>{currentUser?.name}</div>
                <div style={{fontSize:12,color:"rgba(232,234,240,.4)"}}>{currentUser?.email}</div>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:700,letterSpacing:.5}}>ANTHROPIC API KEY (optional)</div>
              <input className="field" type="password" placeholder="sk-ant-... (only needed if AI server isn't set up)"
                value={apiKey} onChange={e=>{setApiKey(e.target.value);safeSet("moni_apikey",e.target.value);}}/>
              <div style={{fontSize:11,color:"rgba(232,234,240,.25)",marginTop:5,lineHeight:1.7}}>AI works automatically when the Vercel API key is configured. Only add your own key as backup. Get one at console.anthropic.com</div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,color:"rgba(232,234,240,.4)",marginBottom:6,fontWeight:700,letterSpacing:.5}}>CURRENCY</div>
              <button onClick={()=>{setShowSettings(false);setTimeout(()=>setShowCurrencyPicker(true),200);}} style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"13px 15px",color:"#E8EAF0",fontFamily:"DM Sans",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10,justifyContent:"space-between"}}>
                <span>{CURRENCIES[currency]?.flag} {CURRENCIES[currency]?.name}</span>
                <span style={{color:"rgba(232,234,240,.3)"}}>Change →</span>
              </button>
            </div>
            <button onClick={doLogout} style={{width:"100%",padding:"13px",borderRadius:13,border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.06)",color:"#EF4444",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:10}}>Sign Out</button>
            <button className="btn-ghost" onClick={()=>setShowSettings(false)} style={{width:"100%"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}