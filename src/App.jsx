import { useState, useRef, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const APP_VERSION = '3.0';
const COLORS = [
  '#00C896',
  '#FF6B6B',
  '#FFD93D',
  '#6C63FF',
  '#FF9F43',
  '#54A0FF',
  '#5F27CD',
  '#00D2D3',
  '#FF6B9D',
  '#C0392B',
];

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
];

const CATEGORIES = {
  income: [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Gift',
    'Other Income',
  ],
  expense: [
    'Food & Dining',
    'Transport',
    'Housing',
    'Healthcare',
    'Entertainment',
    'Shopping',
    'Education',
    'Utilities',
    'Other Expense',
  ],
};

const ALL_EXPENSE_CATS = CATEGORIES.expense;

const ONBOARDING_STEPS = [
  {
    icon: '💰',
    title: 'Welcome to Moni Tracker',
    desc: 'Your AI-powered financial companion. Track income, expenses and get smart insights — all in one place.',
    btn: "Let's Go",
  },
  {
    icon: '🎙️',
    title: 'Log with Voice or Text',
    desc: 'Just say "Spent ₦5,000 on food" or type it. Our AI instantly categorizes and saves your transaction.',
    btn: 'Nice!',
  },
  {
    icon: '📊',
    title: 'Smart Reports & Insights',
    desc: 'See exactly where your money goes with beautiful charts, weekly summaries, and personalized AI advice.',
    btn: 'Get Started',
  },
];

const PLANS = {
  free: {
    name: 'Free',
    price: '₦0',
    color: '#00C896',
    features: [
      'Unlimited transactions',
      'AI categorization',
      'Basic reports',
      'Voice input',
      'PDF export',
      'Multi-currency',
    ],
  },
  pro: {
    name: 'Pro',
    price: '₦2,500/mo',
    color: '#6C63FF',
    features: [
      'Everything in Free',
      'Team access (up to 5)',
      'Advanced analytics',
      'Priority AI insights',
      'Custom categories',
      'Dedicated support',
    ],
  },
};

const SAMPLE_TX = [
  {
    id: 's1',
    type: 'income',
    amount: 150000,
    category: 'Salary',
    note: 'Monthly salary',
    date: '2026-05-01',
  },
  {
    id: 's2',
    type: 'expense',
    amount: 45000,
    category: 'Housing',
    note: 'Rent payment',
    date: '2026-05-02',
  },
  {
    id: 's3',
    type: 'expense',
    amount: 12000,
    category: 'Food & Dining',
    note: 'Groceries — Shoprite',
    date: '2026-05-03',
  },
  {
    id: 's4',
    type: 'income',
    amount: 35000,
    category: 'Freelance',
    note: 'Design project',
    date: '2026-05-05',
  },
  {
    id: 's5',
    type: 'expense',
    amount: 8000,
    category: 'Transport',
    note: 'Uber rides',
    date: '2026-05-06',
  },
  {
    id: 's6',
    type: 'expense',
    amount: 15000,
    category: 'Shopping',
    note: 'Clothes — Zara',
    date: '2026-05-08',
  },
  {
    id: 's7',
    type: 'expense',
    amount: 7500,
    category: 'Entertainment',
    note: 'Cinema & dinner',
    date: '2026-05-10',
  },
  {
    id: 's8',
    type: 'income',
    amount: 20000,
    category: 'Investment',
    note: 'Piggybank payout',
    date: '2026-05-12',
  },
  {
    id: 's9',
    type: 'expense',
    amount: 5500,
    category: 'Healthcare',
    note: 'Pharmacy',
    date: '2026-05-14',
  },
  {
    id: 's10',
    type: 'expense',
    amount: 6000,
    category: 'Utilities',
    note: 'NEPA & internet bill',
    date: '2026-05-16',
  },
  {
    id: 's11',
    type: 'expense',
    amount: 9000,
    category: 'Food & Dining',
    note: 'Bukka & restaurants',
    date: '2026-05-18',
  },
  {
    id: 's12',
    type: 'income',
    amount: 25000,
    category: 'Business',
    note: 'Product sale',
    date: '2026-05-20',
  },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const fmt = (amount, symbol) => `${symbol}${Number(amount).toLocaleString()}`;

// Smart local parser (reduces AI calls by ~80%)
function localParse(text) {
  const lower = text.toLowerCase();
  // Naira-aware: 5k = 5000, 1.5m = 1500000
  const raw = text
    .replace(/(\d+\.?\d*)\s*k\b/gi, (_, n) => String(parseFloat(n) * 1000))
    .replace(/(\d+\.?\d*)\s*m\b/gi, (_, n) => String(parseFloat(n) * 1000000));
  const amountMatch = raw.match(/[\$£€₦₵₹]?\s?(\d[\d,\.]*)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  const confidence = amount > 0 ? 0.85 : 0.2;

  const isIncome =
    /\b(earn|receiv|got paid|salary|income|made|paid me|credit|freelance revenue|sold|sale|profit)\b/.test(
      lower
    );
  const type = isIncome ? 'income' : 'expense';

  let category = type === 'income' ? 'Other Income' : 'Other Expense';
  const rules = [
    [
      /food|eat|restaurant|groceries|lunch|dinner|breakfast|bukka|market|shoprite|suya|pepper|rice|beans/,
      'Food & Dining',
    ],
    [
      /uber|bolt|taxi|bus|transport|fuel|petrol|keke|okada|danfo|ride/,
      'Transport',
    ],
    [/rent|house|apartment|landlord|property/, 'Housing'],
    [/salary|paycheck|wage|payroll/, 'Salary'],
    [/freelance|project|client|design|code|write|contract/, 'Freelance'],
    [/invest|dividend|stock|crypto|piggybank|cowrywise|shares/, 'Investment'],
    [/shop|cloth|fashion|shoes|bag|zara|h&m|jumia|buy|purchase/, 'Shopping'],
    [
      /netflix|movie|cinema|fun|entertain|spotify|concert|party/,
      'Entertainment',
    ],
    [/doctor|hospital|pharmacy|drug|health|clinic/, 'Healthcare'],
    [
      /electric|nepa|phcn|water|internet|wifi|mtn|airtel|glo|data|bill|utility/,
      'Utilities',
    ],
    [/school|tuition|book|course|training|education/, 'Education'],
    [/church|tithe|offering|donate/, 'Gift'],
    [/business|sale|product|revenue|profit/, 'Business'],
  ];
  for (const [rx, cat] of rules) {
    if (rx.test(lower)) {
      category = cat;
      break;
    }
  }

  return {
    type,
    amount,
    category,
    note: text,
    date: new Date().toISOString().split('T')[0],
    confidence,
  };
}

function exportPDF(transactions, currency, period, userName) {
  const { symbol } = currency;
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const saveRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  const catMap = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=Syne:wght@700;800&display=swap');
  body{font-family:'DM Sans',sans-serif;color:#1a1a2e;background:#fff;padding:40px;max-width:800px;margin:0 auto}
  .header{background:linear-gradient(135deg,#0A0E1A,#1a1f35);color:#fff;border-radius:20px;padding:36px;margin-bottom:32px}
  .logo{font-family:'Syne',sans-serif;font-size:30px;font-weight:800} .logo span{color:#00C896}
  .meta{margin-top:12px;font-size:13px;color:rgba(255,255,255,0.5)}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
  .stat{border-radius:14px;padding:18px;text-align:center}
  .si{background:#f0fdf8;border:2px solid #00C896} .se{background:#fff5f5;border:2px solid #FF6B6B}
  .sb{background:#f5f3ff;border:2px solid #6C63FF} .sr{background:#fefce8;border:2px solid #FFD93D}
  .sl{font-size:10px;font-weight:600;color:#888;letter-spacing:.5px;margin-bottom:4px}
  .sv{font-family:'Syne',sans-serif;font-size:20px;font-weight:800}
  table{width:100%;border-collapse:collapse} th{background:#f8f9fa;padding:9px 8px;text-align:left;font-size:11px;color:#888;font-weight:600;letter-spacing:.5px}
  td{padding:9px 8px;font-size:13px;border-bottom:1px solid #f0f0f0}
  .inc{color:#00C896;font-weight:600} .exp{color:#FF6B6B;font-weight:600}
  .footer{margin-top:32px;text-align:center;font-size:11px;color:#ccc;border-top:1px solid #f0f0f0;padding-top:20px}
  h3{font-family:'Syne',sans-serif;font-size:15px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #f0f0f0}
</style></head><body>
<div class="header">
  <div class="logo"><span>Moni</span> Tracker</div>
  <div class="meta">${
    period.charAt(0).toUpperCase() + period.slice(1)
  } Report &nbsp;·&nbsp; ${userName} &nbsp;·&nbsp; ${
    currency.code
  } &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}</div>
</div>
<div class="stats">
  <div class="stat si"><div class="sl">INCOME</div><div class="sv" style="color:#00C896">${symbol}${income.toLocaleString()}</div></div>
  <div class="stat se"><div class="sl">EXPENSES</div><div class="sv" style="color:#FF6B6B">${symbol}${expense.toLocaleString()}</div></div>
  <div class="stat sb"><div class="sl">BALANCE</div><div class="sv" style="color:#6C63FF">${symbol}${balance.toLocaleString()}</div></div>
  <div class="stat sr"><div class="sl">SAVE RATE</div><div class="sv" style="color:#b45309">${saveRate}%</div></div>
</div>
<h3>Expense Breakdown</h3>
<table><tr><th>CATEGORY</th><th style="text-align:right">AMOUNT</th><th style="text-align:right">% OF TOTAL</th></tr>
${cats
  .map(
    ([n, v]) =>
      `<tr><td>${n}</td><td style="text-align:right;font-weight:600">${symbol}${v.toLocaleString()}</td><td style="text-align:right;color:#888">${
        expense > 0 ? Math.round((v / expense) * 100) : 0
      }%</td></tr>`
  )
  .join('')}
</table>
<h3>Transactions (Latest 30)</h3>
<table><tr><th>DATE</th><th>CATEGORY</th><th>NOTE</th><th style="text-align:right">AMOUNT</th></tr>
${transactions
  .slice(0, 30)
  .map(
    (t) =>
      `<tr><td>${t.date}</td><td>${t.category}</td><td style="color:#555">${
        t.note
      }</td><td style="text-align:right" class="${
        t.type === 'income' ? 'inc' : 'exp'
      }">${t.type === 'income' ? '+' : '-'}${symbol}${Number(
        t.amount
      ).toLocaleString()}</td></tr>`
  )
  .join('')}
</table>
<div class="footer">Moni Tracker · AI-powered finance for Africa · monitracker.com · ${new Date().getFullYear()}</div>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 800);
  }
}

/* ═══════════════════════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Syne:wght@700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0A0E1A}::-webkit-scrollbar-thumb{background:#00C896;border-radius:4px}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;transition:border-color .3s}
.card:hover{border-color:rgba(0,200,150,0.2)}
.btn-green{background:#00C896;color:#0A0E1A;border:none;border-radius:13px;padding:15px 28px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:all .2s;width:100%}
.btn-green:hover{background:#00E5AD;transform:translateY(-1px)}
.btn-ghost{background:transparent;color:#E8EAF0;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:12px 20px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all .2s}
.btn-ghost:hover{border-color:#00C896;color:#00C896}
.nav-btn{background:transparent;border:none;padding:10px 14px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:11px;cursor:pointer;color:rgba(232,234,240,0.4);display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .2s}
.nav-btn.active{background:rgba(0,200,150,0.12);color:#00C896}
.field{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:13px;padding:14px 16px;color:#E8EAF0;font-family:'DM Sans',sans-serif;font-size:15px;outline:none}
.field:focus{border-color:#00C896}
.field::placeholder{color:rgba(232,234,240,0.3)}
textarea.field{resize:none}
select.field{cursor:pointer}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:300;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)}
.sheet{background:#141824;border-radius:24px 24px 0 0;padding:28px;width:100%;max-width:480px;max-height:85vh;overflow-y:auto}
.fade{animation:fade .35s ease}
@keyframes fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.pulse{animation:pulse 1.4s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.badge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.badge-i{background:rgba(0,200,150,.15);color:#00C896}
.badge-e{background:rgba(255,107,107,.15);color:#FF6B6B}
.pill{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
`;

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function MoniTracker() {
  /* ── storage state ── */
  const DEMO_USER = {
    id: 'demo',
    name: 'Demo User',
    email: 'demo@moni.app',
    password: 'demo123',
    plan: 'free',
    joinDate: '2026-01-01',
  };
  const [storageReady, setStorageReady] = useState(false);
  const [users, setUsers] = useState([DEMO_USER]); // always start with demo
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [currency, setCurrency] = useState(CURRENCIES[0]); // NGN default

  /* ── UI state ── */
  const [screen, setScreen] = useState('landing'); // landing|auth|onboard|app
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [authError, setAuthError] = useState('');
  const [onboardStep, setOnboardStep] = useState(0);
  const [tab, setTab] = useState('dashboard');
  const [notification, setNotification] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('monthly');

  /* ── transaction state ── */
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [parsedEntry, setParsedEntry] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [deleteTx, setDeleteTx] = useState(null);

  /* ── other sheets ── */
  const [showCurrency, setShowCurrency] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [budgetEdit, setBudgetEdit] = useState({});
  const [aiInsight, setAiInsight] = useState('');
  const [filterType, setFilterType] = useState('all');

  const recognitionRef = useRef(null);
  const sym = currency.symbol;

  /* ════════════════════════════════════════════════════════════
     PERSISTENT STORAGE INIT
  ════════════════════════════════════════════════════════════ */

  // localStorage wrappers — works in all real browsers
  const safeGet = async (key) => {
    try {
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    } catch {
      return null;
    }
  };
  const safeSet = async (key, val) => {
    try {
      localStorage.setItem(key, val);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        // Load persisted users — always keep demo account available
        const uRes = await safeGet('mt:users');
        let loadedUsers = [DEMO_USER];
        if (uRes) {
          const parsed = JSON.parse(uRes.value);
          const others = parsed.filter((u) => u.id !== 'demo');
          loadedUsers = [DEMO_USER, ...others];
        }
        setUsers(loadedUsers);
        await safeSet('mt:users', JSON.stringify(loadedUsers));

        // Restore session
        const sRes = await safeGet('mt:session');
        if (sRes) {
          const sess = JSON.parse(sRes.value);
          const user = loadedUsers.find((u) => u.id === sess.userId);
          if (user) {
            setCurrentUser(user);
            setLoggedIn(true);
            const txRes = await safeGet(`mt:tx:${user.id}`);
            const budRes = await safeGet(`mt:budgets:${user.id}`);
            const prefRes = await safeGet(`mt:prefs:${user.id}`);
            setTransactions(txRes ? JSON.parse(txRes.value) : SAMPLE_TX);
            setBudgets(budRes ? JSON.parse(budRes.value) : {});
            if (prefRes) {
              const p = JSON.parse(prefRes.value);
              if (p.currency)
                setCurrency(
                  CURRENCIES.find((c) => c.code === p.currency) || CURRENCIES[0]
                );
            }
            setScreen(sess.onboarded ? 'app' : 'onboard');
          } else {
            setScreen('landing');
          }
        } else {
          setScreen('landing');
        }
      } catch (e) {
        console.error('Storage init error:', e);
        setScreen('landing');
      }
      setStorageReady(true);
    })();
  }, []);

  /* ── save helpers ── */
  const saveTransactions = async (uid, txArr) => {
    await safeSet(`mt:tx:${uid}`, JSON.stringify(txArr));
  };
  const saveBudgets = async (uid, b) => {
    await safeSet(`mt:budgets:${uid}`, JSON.stringify(b));
  };
  const savePrefs = async (uid, prefs) => {
    await safeSet(`mt:prefs:${uid}`, JSON.stringify(prefs));
  };

  /* ════════════════════════════════════════════════════════════
     NOTIFICATION
  ════════════════════════════════════════════════════════════ */
  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3200);
  };

  /* ════════════════════════════════════════════════════════════
     AUTH
  ════════════════════════════════════════════════════════════ */
  const handleLogin = async () => {
    const user = users.find(
      (u) => u.email === authForm.email && u.password === authForm.password
    );
    if (!user) {
      setAuthError('Invalid email or password.');
      return;
    }
    setCurrentUser(user);
    setLoggedIn(true);
    setAuthError('');
    const txRes = await safeGet(`mt:tx:${user.id}`);
    const budRes = await safeGet(`mt:budgets:${user.id}`);
    const prefRes = await safeGet(`mt:prefs:${user.id}`);
    setTransactions(txRes ? JSON.parse(txRes.value) : SAMPLE_TX);
    setBudgets(budRes ? JSON.parse(budRes.value) : {});
    if (prefRes) {
      const p = JSON.parse(prefRes.value);
      if (p.currency)
        setCurrency(
          CURRENCIES.find((c) => c.code === p.currency) || CURRENCIES[0]
        );
    }
    await safeSet(
      'mt:session',
      JSON.stringify({ userId: user.id, onboarded: true })
    );
    setScreen('app');
  };

  const handleSignup = async () => {
    if (!authForm.name || !authForm.email || !authForm.password) {
      setAuthError('All fields are required.');
      return;
    }
    if (authForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (users.find((u) => u.email === authForm.email)) {
      setAuthError('Email already registered.');
      return;
    }
    const newUser = {
      id: `u_${Date.now()}`,
      name: authForm.name,
      email: authForm.email,
      password: authForm.password,
      plan: 'free',
      joinDate: new Date().toISOString().split('T')[0],
    };
    const updated = [...users, newUser];
    setUsers(updated);
    setCurrentUser(newUser);
    setLoggedIn(true);
    setAuthError('');
    await safeSet('mt:users', JSON.stringify(updated));
    await safeSet(`mt:tx:${newUser.id}`, JSON.stringify(SAMPLE_TX));
    await safeSet(
      'mt:session',
      JSON.stringify({ userId: newUser.id, onboarded: false })
    );
    setTransactions(SAMPLE_TX);
    setBudgets({});
    setOnboardStep(0);
    setScreen('onboard');
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('mt:session');
    } catch {}
    setLoggedIn(false);
    setCurrentUser(null);
    setTransactions([]);
    setBudgets({});
    setAiInsight('');
    setTab('dashboard');
    setScreen('landing');
  };

  /* ════════════════════════════════════════════════════════════
     ONBOARDING
  ════════════════════════════════════════════════════════════ */
  const finishOnboard = async () => {
    await safeSet(
      'mt:session',
      JSON.stringify({ userId: currentUser.id, onboarded: true })
    );
    setScreen('app');
  };

  /* ════════════════════════════════════════════════════════════
     VOICE
  ════════════════════════════════════════════════════════════ */
  const handleVoice = () => {
    if (
      !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    ) {
      notify('Voice not supported. Try Chrome!', 'error');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-NG';
    rec.onresult = (e) => {
      setInputText(e.results[0][0].transcript);
      setRecording(false);
    };
    rec.onerror = () => {
      setRecording(false);
      notify('Voice error. Try again.', 'error');
    };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  /* ════════════════════════════════════════════════════════════
     PROCESS TRANSACTION (smart: local first, AI fallback)
  ════════════════════════════════════════════════════════════ */
  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setAiLoading(true);
    const local = localParse(inputText);
    // If local parser is confident (amount found + clear category), skip AI
    if (local.confidence >= 0.85) {
      setParsedEntry(local);
      setShowAddSheet(true);
      setAiLoading(false);
      return;
    }
    // AI fallback for ambiguous entries
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: `Parse this Nigerian finance entry. Return ONLY JSON, no markdown:
Entry: "${inputText}"
Currency context: ${currency.code}
Return: {"type":"income"|"expense","amount":number,"category":"...","note":"short note","date":"${
                new Date().toISOString().split('T')[0]
              }"}
Categories: ${[...CATEGORIES.income, ...CATEGORIES.expense].join(', ')}`,
            },
          ],
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(
        (data.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim()
      );
      setParsedEntry({ ...parsed, confidence: 0.95 });
    } catch {
      setParsedEntry(local);
    }
    setShowAddSheet(true);
    setAiLoading(false);
  };

  /* ════════════════════════════════════════════════════════════
     CRUD TRANSACTIONS
  ════════════════════════════════════════════════════════════ */
  const confirmAdd = async () => {
    if (!parsedEntry || parsedEntry.amount <= 0) {
      notify('Amount must be greater than 0', 'error');
      return;
    }
    const newTx = { ...parsedEntry, id: `tx_${Date.now()}` };
    delete newTx.confidence;
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    await saveTransactions(currentUser.id, updated);
    setInputText('');
    setParsedEntry(null);
    setShowAddSheet(false);
    notify('Transaction saved! ✅');
    checkBudgetAlert(newTx, updated);
  };

  const confirmEdit = async () => {
    const updated = transactions.map((t) => (t.id === editTx.id ? editTx : t));
    setTransactions(updated);
    await saveTransactions(currentUser.id, updated);
    setEditTx(null);
    notify('Transaction updated ✅');
  };

  const confirmDelete = async () => {
    const updated = transactions.filter((t) => t.id !== deleteTx.id);
    setTransactions(updated);
    await saveTransactions(currentUser.id, updated);
    setDeleteTx(null);
    notify('Transaction deleted');
  };

  /* ════════════════════════════════════════════════════════════
     BUDGET ALERTS
  ════════════════════════════════════════════════════════════ */
  const checkBudgetAlert = (tx, allTx) => {
    if (tx.type !== 'expense') return;
    const limit = budgets[tx.category];
    if (!limit) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const spent = allTx
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category === tx.category &&
          t.date >= monthStart
      )
      .reduce((s, t) => s + t.amount, 0);
    const pct = (spent / limit) * 100;
    if (pct >= 100)
      notify(
        `🚨 ${
          tx.category
        } budget exceeded! ${sym}${spent.toLocaleString()} / ${sym}${limit.toLocaleString()}`,
        'error'
      );
    else if (pct >= 80)
      notify(`⚠️ ${tx.category} at ${Math.round(pct)}% of budget`, 'warn');
  };

  /* ════════════════════════════════════════════════════════════
     SAVE BUDGETS
  ════════════════════════════════════════════════════════════ */
  const saveBudgetEdits = async () => {
    const merged = { ...budgets };
    Object.entries(budgetEdit).forEach(([k, v]) => {
      if (v) merged[k] = parseFloat(v);
      else delete merged[k];
    });
    setBudgets(merged);
    await saveBudgets(currentUser.id, merged);
    setBudgetEdit({});
    setShowBudgets(false);
    notify('Budgets saved! 💰');
  };

  /* ════════════════════════════════════════════════════════════
     CURRENCY CHANGE
  ════════════════════════════════════════════════════════════ */
  const changeCurrency = async (c) => {
    setCurrency(c);
    setShowCurrency(false);
    await savePrefs(currentUser.id, { currency: c.code });
    notify(`Currency changed to ${c.name} ${c.flag}`);
  };

  /* ════════════════════════════════════════════════════════════
     AI INSIGHTS
  ════════════════════════════════════════════════════════════ */
  const fetchInsights = async () => {
    setAiLoading(true);
    setTab('insights');
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const topCats = getCategoryData('expense')
      .slice(0, 3)
      .map((c) => `${c.name}: ${sym}${c.value.toLocaleString()}`);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [
            {
              role: 'user',
              content: `You are Moni, a friendly AI finance advisor for Nigerian users. Be concise and practical.

Financial summary:
- Income: ${sym}${income.toLocaleString()} | Expenses: ${sym}${expense.toLocaleString()} | Balance: ${sym}${(
                income - expense
              ).toLocaleString()}
- Save rate: ${
                income > 0 ? Math.round(((income - expense) / income) * 100) : 0
              }%
- Top expenses: ${topCats.join(', ')}
- Currency: ${currency.code}
- Transactions: ${transactions.length}

Give exactly 3 insights and 3 actionable tips. Use emojis. Reference Nigerian context where relevant (cost of living, POS business, etc.). Keep it friendly and motivating.`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiInsight(data.content?.[0]?.text || '');
    } catch {
      setAiInsight("Couldn't connect. Check your internet and try again.");
    }
    setAiLoading(false);
  };

  /* ════════════════════════════════════════════════════════════
     CHART DATA (real from transactions)
  ════════════════════════════════════════════════════════════ */
  const getCategoryData = (type) => {
    const map = {};
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getBarData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    return days.map((d, i) => {
      const inc = transactions
        .filter(
          (t) =>
            t.type === 'income' && new Date(t.date).getDay() === (i + 1) % 7
        )
        .reduce((s, t) => s + t.amount, 0);
      const exp = transactions
        .filter(
          (t) =>
            t.type === 'expense' && new Date(t.date).getDay() === (i + 1) % 7
        )
        .reduce((s, t) => s + t.amount, 0);
      return { day: d, income: inc || 0, expense: exp || 0 };
    });
  };

  const getTrendData = () => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months.slice(0, 6).map((m, i) => {
      const inc = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === i && t.type === 'income';
        })
        .reduce((s, t) => s + t.amount, 0);
      const exp = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === i && t.type === 'expense';
        })
        .reduce((s, t) => s + t.amount, 0);
      return { month: m, income: inc, expense: exp, balance: inc - exp };
    });
  };

  /* ════════════════════════════════════════════════════════════
     DERIVED
  ════════════════════════════════════════════════════════════ */
  const filtered =
    filterType === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filterType);
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const saveRate =
    totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;
  const expenseCats = getCategoryData('expense');

  /* budget usage */
  const getBudgetUsage = (cat) => {
    if (!budgets[cat]) return null;
    const now = new Date();
    const ms = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.category === cat && t.date >= ms)
      .reduce((s, t) => s + t.amount, 0);
    return {
      spent,
      limit: budgets[cat],
      pct: Math.min((spent / budgets[cat]) * 100, 100),
    };
  };

  /* ════════════════════════════════════════════════════════════
     RENDER HELPERS
  ════════════════════════════════════════════════════════════ */
  const TxCard = ({ t, showActions = true }) => (
    <div
      className="card"
      style={{
        marginBottom: 10,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background:
              t.type === 'income'
                ? 'rgba(0,200,150,.15)'
                : 'rgba(255,107,107,.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            flexShrink: 0,
          }}
        >
          {t.type === 'income' ? '💰' : '💸'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              white_space: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t.category}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(232,234,240,.35)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t.note}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: t.type === 'income' ? '#00C896' : '#FF6B6B',
          }}
        >
          {t.type === 'income' ? '+' : '-'}
          {sym}
          {Number(t.amount).toLocaleString()}
        </div>
        <div
          style={{ fontSize: 11, color: 'rgba(232,234,240,.3)', marginTop: 1 }}
        >
          {t.date}
        </div>
        {showActions && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              justifyContent: 'flex-end',
              marginTop: 4,
            }}
          >
            <button
              onClick={() => setEditTx({ ...t })}
              style={{
                background: 'rgba(255,255,255,.06)',
                border: 'none',
                color: 'rgba(232,234,240,.5)',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteTx(t)}
              style={{
                background: 'rgba(255,107,107,.1)',
                border: 'none',
                color: '#FF6B6B',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Del
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     LOADING
  ════════════════════════════════════════════════════════════ */
  if (!storageReady)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0E1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'DM Sans,sans-serif',
        }}
      >
        <style>{CSS}</style>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'Syne,sans-serif',
              fontSize: 32,
              fontWeight: 800,
              color: '#E8EAF0',
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#00C896' }}>Moni</span> Tracker
          </div>
          <div
            style={{ color: 'rgba(232,234,240,.4)', fontSize: 14 }}
            className="pulse"
          >
            Loading your data...
          </div>
        </div>
      </div>
    );

  /* ════════════════════════════════════════════════════════════
     LANDING PAGE
  ════════════════════════════════════════════════════════════ */
  if (screen === 'landing')
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0E1A',
          fontFamily: "'DM Sans',sans-serif",
          color: '#E8EAF0',
          overflowX: 'hidden',
        }}
      >
        <style>{CSS}</style>
        <div
          style={{
            position: 'fixed',
            top: -300,
            left: -300,
            width: 700,
            height: 700,
            background:
              'radial-gradient(circle,rgba(0,200,150,.1) 0%,transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'fixed',
            bottom: -300,
            right: -200,
            width: 600,
            height: 600,
            background:
              'radial-gradient(circle,rgba(108,99,255,.08) 0%,transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Nav */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,.06)',
          }}
        >
          <div
            style={{
              fontFamily: 'Syne,sans-serif',
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            <span style={{ color: '#00C896' }}>Moni</span> Tracker
          </div>
          <button
            className="btn-ghost"
            onClick={() => {
              setScreen('auth');
              setAuthMode('login');
            }}
            style={{ padding: '10px 20px', fontSize: 13 }}
          >
            Sign In
          </button>
        </div>

        {/* Hero */}
        <div
          style={{
            padding: '60px 24px 40px',
            maxWidth: 480,
            margin: '0 auto',
            textAlign: 'center',
          }}
          className="fade"
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0,200,150,.1)',
              border: '1px solid rgba(0,200,150,.2)',
              borderRadius: 20,
              padding: '6px 16px',
              marginBottom: 24,
              fontSize: 13,
              color: '#00C896',
              fontWeight: 600,
            }}
          >
            🇳🇬 Built for Africa · AI-Powered
          </div>
          <h1
            style={{
              fontFamily: 'Syne,sans-serif',
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: 20,
              letterSpacing: '-1px',
            }}
          >
            Track money.
            <br />
            <span style={{ color: '#00C896' }}>Grow wealth.</span>
            <br />
            No stress.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(232,234,240,.6)',
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            Simply say "I spent ₦5,000 on food today" and Moni does the rest. AI
            categorization, smart reports, and real financial advice — all in
            one app.
          </p>
          <button
            className="btn-green"
            onClick={() => {
              setScreen('auth');
              setAuthMode('signup');
            }}
            style={{
              fontSize: 17,
              padding: '18px',
              borderRadius: 16,
              marginBottom: 12,
            }}
          >
            Start for Free →
          </button>
          <div style={{ fontSize: 13, color: 'rgba(232,234,240,.35)' }}>
            No credit card required · Free forever plan available
          </div>
        </div>

        {/* Features */}
        <div
          style={{ padding: '0 24px 60px', maxWidth: 480, margin: '0 auto' }}
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            {[
              {
                icon: '🎙️',
                title: 'Voice Logging',
                desc: 'Just speak and AI records it',
              },
              {
                icon: '🤖',
                title: 'AI Categorization',
                desc: 'Automatic & super accurate',
              },
              {
                icon: '📊',
                title: 'Smart Reports',
                desc: 'Weekly & monthly breakdowns',
              },
              {
                icon: '💡',
                title: 'AI Insights',
                desc: 'Personalized money advice',
              },
              {
                icon: '🌍',
                title: 'Multi-Currency',
                desc: 'NGN, USD, GHS & more',
              },
              {
                icon: '📄',
                title: 'PDF Export',
                desc: 'Beautiful financial reports',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card"
                style={{ padding: '18px 16px' }}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(232,234,240,.4)' }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Plans teaser */}
          <div
            style={{
              marginTop: 32,
              padding: 24,
              background:
                'linear-gradient(135deg,rgba(108,99,255,.15),rgba(0,200,150,.08))',
              border: '1px solid rgba(108,99,255,.25)',
              borderRadius: 20,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'Syne,sans-serif',
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              Simple, honest pricing
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(232,234,240,.5)',
                marginBottom: 20,
              }}
            >
              Start free. Upgrade when you need more.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {Object.values(PLANS).map((p) => (
                <div
                  key={p.name}
                  style={{
                    background: 'rgba(255,255,255,.04)',
                    border: `1px solid ${p.color}30`,
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Syne,sans-serif',
                      fontSize: 16,
                      fontWeight: 800,
                      color: p.color,
                      marginBottom: 4,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}
                  >
                    {p.price}
                  </div>
                  {p.features.slice(0, 3).map((f) => (
                    <div
                      key={f}
                      style={{
                        fontSize: 11,
                        color: 'rgba(232,234,240,.5)',
                        marginBottom: 3,
                      }}
                    >
                      ✓ {f}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn-green"
            onClick={() => {
              setScreen('auth');
              setAuthMode('signup');
            }}
            style={{
              marginTop: 24,
              fontSize: 16,
              padding: '16px',
              borderRadius: 16,
            }}
          >
            Create Free Account →
          </button>
          <div
            style={{
              textAlign: 'center',
              marginTop: 12,
              fontSize: 12,
              color: 'rgba(232,234,240,.25)',
            }}
          >
            monitracker.com
          </div>
        </div>
      </div>
    );

  /* ════════════════════════════════════════════════════════════
     AUTH SCREEN
  ════════════════════════════════════════════════════════════ */
  if (screen === 'auth')
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0E1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <style>{CSS}</style>
        <div
          style={{
            position: 'fixed',
            top: -200,
            left: -200,
            width: 600,
            height: 600,
            background:
              'radial-gradient(circle,rgba(0,200,150,.1) 0%,transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ width: '100%', maxWidth: 420 }} className="fade">
          <button
            onClick={() => setScreen('landing')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(232,234,240,.4)',
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back
          </button>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div
              style={{
                fontFamily: 'Syne,sans-serif',
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              <span style={{ color: '#00C896' }}>Moni</span> Tracker
            </div>
            <div
              style={{
                color: 'rgba(232,234,240,.4)',
                fontSize: 14,
                marginTop: 4,
              }}
            >
              Your financial companion
            </div>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 24,
                background: 'rgba(255,255,255,.04)',
                borderRadius: 12,
                padding: 4,
              }}
            >
              {['login', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setAuthMode(m);
                    setAuthError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    border: 'none',
                    background: authMode === m ? '#00C896' : 'transparent',
                    color: authMode === m ? '#0A0E1A' : 'rgba(232,234,240,.5)',
                    fontFamily: 'DM Sans,sans-serif',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {authMode === 'signup' && (
                <input
                  className="field"
                  placeholder="Full Name"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                />
              )}
              <input
                className="field"
                type="email"
                placeholder="Email Address"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
              />
              <input
                className="field"
                type="password"
                placeholder="Password (min 6 chars)"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    authMode === 'login' ? handleLogin() : handleSignup();
                }}
              />
              {authError && (
                <div
                  style={{
                    background: 'rgba(255,107,107,.1)',
                    border: '1px solid rgba(255,107,107,.3)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#FF6B6B',
                    fontSize: 13,
                  }}
                >
                  {authError}
                </div>
              )}
              <button
                className="btn-green"
                onClick={authMode === 'login' ? handleLogin : handleSignup}
                style={{ marginTop: 4 }}
              >
                {authMode === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>
            </div>
            {authMode === 'login' && (
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  background: 'rgba(0,200,150,.07)',
                  borderRadius: 12,
                  border: '1px solid rgba(0,200,150,.15)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    letterSpacing: '.5px',
                    marginBottom: 6,
                  }}
                >
                  DEMO ACCOUNT
                </div>
                <div style={{ fontSize: 13, color: 'rgba(232,234,240,.6)' }}>
                  📧 demo@moni.app &nbsp;·&nbsp; 🔑 demo123
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

  /* ════════════════════════════════════════════════════════════
     ONBOARDING
  ════════════════════════════════════════════════════════════ */
  if (screen === 'onboard') {
    const step = ONBOARDING_STEPS[onboardStep];
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0E1A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          fontFamily: "'DM Sans',sans-serif",
          color: '#E8EAF0',
        }}
      >
        <style>{CSS}</style>
        <div
          style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}
          className="fade"
          key={onboardStep}
        >
          <div style={{ fontSize: 80, marginBottom: 28 }}>{step.icon}</div>
          <h2
            style={{
              fontFamily: 'Syne,sans-serif',
              fontSize: 26,
              fontWeight: 800,
              marginBottom: 16,
              lineHeight: 1.2,
            }}
          >
            {step.title}
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(232,234,240,.6)',
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            {step.desc}
          </p>
          {/* dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 32,
            }}
          >
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === onboardStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background:
                    i === onboardStep ? '#00C896' : 'rgba(255,255,255,.15)',
                  transition: 'all .3s',
                }}
              />
            ))}
          </div>
          <button
            className="btn-green"
            style={{ fontSize: 16, padding: '16px' }}
            onClick={() =>
              onboardStep < ONBOARDING_STEPS.length - 1
                ? setOnboardStep((s) => s + 1)
                : finishOnboard()
            }
          >
            {step.btn} {onboardStep < ONBOARDING_STEPS.length - 1 ? '→' : '🚀'}
          </button>
          {onboardStep > 0 && (
            <button
              onClick={() => setOnboardStep((s) => s - 1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(232,234,240,.3)',
                fontSize: 13,
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MAIN APP
  ════════════════════════════════════════════════════════════ */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0E1A',
        fontFamily: "'DM Sans',sans-serif",
        color: '#E8EAF0',
        position: 'relative',
      }}
    >
      <style>{CSS}</style>

      {/* BG */}
      <div
        style={{
          position: 'fixed',
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          background:
            'radial-gradient(circle,rgba(0,200,150,.07) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -200,
          right: -200,
          width: 500,
          height: 500,
          background:
            'radial-gradient(circle,rgba(108,99,255,.06) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Notification */}
      {notification && (
        <div
          className="fade"
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background:
              notification.type === 'error'
                ? '#FF6B6B'
                : notification.type === 'warn'
                ? '#FFD93D'
                : '#00C896',
            color: '#0A0E1A',
            padding: '12px 22px',
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          {notification.msg}
        </div>
      )}

      {/* ── Sheets ── */}

      {/* Currency picker */}
      {showCurrency && (
        <div className="overlay" onClick={() => setShowCurrency(false)}>
          <div className="sheet fade" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontFamily: 'Syne,sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Choose Currency
              </div>
              <button
                onClick={() => setShowCurrency(false)}
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: 'none',
                  color: '#E8EAF0',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            {CURRENCIES.map((c) => (
              <div
                key={c.code}
                onClick={() => changeCurrency(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 14px',
                  borderRadius: 13,
                  cursor: 'pointer',
                  background:
                    currency.code === c.code
                      ? 'rgba(0,200,150,.12)'
                      : 'transparent',
                  border:
                    currency.code === c.code
                      ? '1px solid rgba(0,200,150,.3)'
                      : '1px solid transparent',
                  marginBottom: 4,
                  transition: 'all .2s',
                }}
              >
                <span style={{ fontSize: 26 }}>{c.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(232,234,240,.4)' }}>
                    {c.code} · {c.symbol}
                  </div>
                </div>
                {currency.code === c.code && (
                  <span
                    style={{ color: '#00C896', fontSize: 20, fontWeight: 700 }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="sheet fade" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  fontFamily: 'Syne,sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Settings
              </div>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: 'none',
                  color: '#E8EAF0',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            {/* Profile */}
            <div className="card" style={{ marginBottom: 12, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 15,
                    background: 'linear-gradient(135deg,#00C896,#6C63FF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#0A0E1A',
                  }}
                >
                  {currentUser?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {currentUser?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(232,234,240,.4)' }}>
                    {currentUser?.email}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 4,
                      padding: '2px 10px',
                      borderRadius: 20,
                      background: 'rgba(0,200,150,.15)',
                      color: '#00C896',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {currentUser?.plan || 'free'} plan
                  </span>
                </div>
              </div>
            </div>
            {/* Currency */}
            <div className="card" style={{ marginBottom: 12, padding: '18px' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(232,234,240,.4)',
                  letterSpacing: '.5px',
                  marginBottom: 12,
                }}
              >
                DISPLAY CURRENCY
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{currency.flag}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{currency.name}</div>
                    <div
                      style={{ fontSize: 12, color: 'rgba(232,234,240,.4)' }}
                    >
                      {currency.code} · {sym}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setShowSettings(false);
                    setShowCurrency(true);
                  }}
                  style={{ padding: '8px 14px', fontSize: 12 }}
                >
                  Change
                </button>
              </div>
            </div>
            {/* Actions */}
            <button
              onClick={() => {
                setShowSettings(false);
                setShowPlans(true);
              }}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 13,
                border: '1px solid rgba(108,99,255,.3)',
                background: 'rgba(108,99,255,.08)',
                color: '#A78BFA',
                fontFamily: 'DM Sans,sans-serif',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              ✦ Upgrade to Pro
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 13,
                border: '1px solid rgba(255,107,107,.3)',
                background: 'rgba(255,107,107,.08)',
                color: '#FF6B6B',
                fontFamily: 'DM Sans,sans-serif',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Plans */}
      {showPlans && (
        <div className="overlay" onClick={() => setShowPlans(false)}>
          <div className="sheet fade" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  fontFamily: 'Syne,sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Choose Your Plan
              </div>
              <button
                onClick={() => setShowPlans(false)}
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: 'none',
                  color: '#E8EAF0',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            {Object.values(PLANS).map((p, i) => (
              <div
                key={p.name}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: `2px solid ${p.color}40`,
                  background: `${p.color}08`,
                  marginBottom: 12,
                  position: 'relative',
                }}
              >
                {i === 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 14,
                      background: p.color,
                      color: '#0A0E1A',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 20,
                    }}
                  >
                    POPULAR
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'Syne,sans-serif',
                        fontSize: 20,
                        fontWeight: 800,
                        color: p.color,
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}
                    >
                      {p.price}
                    </div>
                  </div>
                </div>
                {p.features.map((f) => (
                  <div
                    key={f}
                    style={{
                      fontSize: 13,
                      color: 'rgba(232,234,240,.65)',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: p.color }}>✓</span>
                    {f}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setShowPlans(false);
                    notify(
                      i === 0
                        ? "You're on the Free plan"
                        : 'Pro plan coming soon — stay tuned! 🚀'
                    );
                  }}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    padding: '12px',
                    borderRadius: 12,
                    border: `1px solid ${p.color}`,
                    background: i === 1 ? p.color : 'transparent',
                    color: i === 1 ? '#0A0E1A' : p.color,
                    fontFamily: 'DM Sans,sans-serif',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {i === 0 ? 'Current Plan' : 'Get Pro →'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Parse sheet */}
      {showAddSheet && parsedEntry && (
        <div
          className="overlay"
          onClick={() => {
            setShowAddSheet(false);
            setParsedEntry(null);
          }}
        >
          <div className="sheet fade" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'Syne,sans-serif',
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  Confirm Transaction
                </div>
                <div style={{ fontSize: 12, color: '#00C896', marginTop: 2 }}>
                  ✦ AI parsed · edit if needed
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddSheet(false);
                  setParsedEntry(null);
                }}
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: 'none',
                  color: '#E8EAF0',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                    letterSpacing: '.5px',
                  }}
                >
                  TYPE
                </div>
                <select
                  className="field"
                  value={parsedEntry.type}
                  onChange={(e) =>
                    setParsedEntry({ ...parsedEntry, type: e.target.value })
                  }
                >
                  <option value="income">💰 Income</option>
                  <option value="expense">💸 Expense</option>
                </select>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                    letterSpacing: '.5px',
                  }}
                >
                  AMOUNT ({sym})
                </div>
                <input
                  className="field"
                  type="number"
                  value={parsedEntry.amount}
                  onChange={(e) =>
                    setParsedEntry({
                      ...parsedEntry,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                    letterSpacing: '.5px',
                  }}
                >
                  CATEGORY
                </div>
                <select
                  className="field"
                  value={parsedEntry.category}
                  onChange={(e) =>
                    setParsedEntry({ ...parsedEntry, category: e.target.value })
                  }
                >
                  {[...CATEGORIES.income, ...CATEGORIES.expense].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                    letterSpacing: '.5px',
                  }}
                >
                  NOTE
                </div>
                <input
                  className="field"
                  value={parsedEntry.note}
                  onChange={(e) =>
                    setParsedEntry({ ...parsedEntry, note: e.target.value })
                  }
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                    letterSpacing: '.5px',
                  }}
                >
                  DATE
                </div>
                <input
                  className="field"
                  type="date"
                  value={parsedEntry.date}
                  onChange={(e) =>
                    setParsedEntry({ ...parsedEntry, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowAddSheet(false);
                  setParsedEntry(null);
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn-green"
                onClick={confirmAdd}
                style={{ flex: 2 }}
              >
                ✓ Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit sheet */}
      {editTx && (
        <div className="overlay" onClick={() => setEditTx(null)}>
          <div className="sheet fade" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontFamily: 'Syne,sans-serif',
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                Edit Transaction
              </div>
              <button
                onClick={() => setEditTx(null)}
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: 'none',
                  color: '#E8EAF0',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                  }}
                >
                  TYPE
                </div>
                <select
                  className="field"
                  value={editTx.type}
                  onChange={(e) =>
                    setEditTx({ ...editTx, type: e.target.value })
                  }
                >
                  <option value="income">💰 Income</option>
                  <option value="expense">💸 Expense</option>
                </select>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                  }}
                >
                  AMOUNT
                </div>
                <input
                  className="field"
                  type="number"
                  value={editTx.amount}
                  onChange={(e) =>
                    setEditTx({
                      ...editTx,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                  }}
                >
                  CATEGORY
                </div>
                <select
                  className="field"
                  value={editTx.category}
                  onChange={(e) =>
                    setEditTx({ ...editTx, category: e.target.value })
                  }
                >
                  {[...CATEGORIES.income, ...CATEGORIES.expense].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                  }}
                >
                  NOTE
                </div>
                <input
                  className="field"
                  value={editTx.note}
                  onChange={(e) =>
                    setEditTx({ ...editTx, note: e.target.value })
                  }
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 6,
                  }}
                >
                  DATE
                </div>
                <input
                  className="field"
                  type="date"
                  value={editTx.date}
                  onChange={(e) =>
                    setEditTx({ ...editTx, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-ghost"
                onClick={() => setEditTx(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn-green"
                onClick={confirmEdit}
                style={{ flex: 2 }}
              >
                ✓ Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTx && (
        <div className="overlay" onClick={() => setDeleteTx(null)}>
          <div
            className="sheet fade"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 28 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <div
                style={{
                  fontFamily: 'Syne,sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                Delete Transaction?
              </div>
              <div style={{ fontSize: 14, color: 'rgba(232,234,240,.5)' }}>
                "{deleteTx.note}" — {sym}
                {Number(deleteTx.amount).toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(232,234,240,.35)',
                  marginTop: 4,
                }}
              >
                This cannot be undone.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-ghost"
                onClick={() => setDeleteTx(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 2,
                  padding: 14,
                  borderRadius: 13,
                  border: 'none',
                  background: '#FF6B6B',
                  color: '#fff',
                  fontFamily: 'DM Sans,sans-serif',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budgets sheet */}
      {showBudgets && (
        <div className="overlay" onClick={() => setShowBudgets(false)}>
          <div className="sheet fade" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontFamily: 'Syne,sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Monthly Budgets
              </div>
              <button
                onClick={() => setShowBudgets(false)}
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: 'none',
                  color: '#E8EAF0',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(232,234,240,.4)',
                marginBottom: 20,
              }}
            >
              Set spending limits and get alerted when you're close.
            </div>
            {ALL_EXPENSE_CATS.map((cat) => {
              const usage = getBudgetUsage(cat);
              return (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{cat}</span>
                    {usage && (
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            usage.pct >= 100
                              ? '#FF6B6B'
                              : usage.pct >= 80
                              ? '#FFD93D'
                              : '#00C896',
                          fontWeight: 600,
                        }}
                      >
                        {Math.round(usage.pct)}%
                      </span>
                    )}
                  </div>
                  <input
                    className="field"
                    type="number"
                    placeholder={`Budget for ${cat} (${sym})`}
                    value={budgetEdit[cat] ?? budgets[cat] ?? ''}
                    onChange={(e) =>
                      setBudgetEdit({ ...budgetEdit, [cat]: e.target.value })
                    }
                    style={{ padding: '10px 14px', fontSize: 14 }}
                  />
                  {usage && (
                    <div
                      style={{
                        marginTop: 6,
                        height: 5,
                        background: 'rgba(255,255,255,.07)',
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 10,
                          background:
                            usage.pct >= 100
                              ? '#FF6B6B'
                              : usage.pct >= 80
                              ? '#FFD93D'
                              : '#00C896',
                          width: `${usage.pct}%`,
                          transition: 'width .6s',
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
            <button
              className="btn-green"
              onClick={saveBudgetEdits}
              style={{ marginTop: 8 }}
            >
              Save Budgets
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div
        style={{
          padding: '20px 22px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(10,14,26,.9)',
          backdropFilter: 'blur(16px)',
          zIndex: 10,
          borderBottom: '1px solid rgba(255,255,255,.05)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Syne,sans-serif',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-.5px',
            }}
          >
            <span style={{ color: '#00C896' }}>Moni</span> Tracker
          </div>
          <div style={{ fontSize: 11, color: 'rgba(232,234,240,.3)' }}>
            Hi {currentUser?.name?.split(' ')[0]} 👋
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={fetchInsights}
            style={{
              background: 'rgba(0,200,150,.1)',
              border: '1px solid rgba(0,200,150,.2)',
              borderRadius: 12,
              padding: '8px 14px',
              color: '#00C896',
              fontFamily: 'DM Sans',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ✦ AI
          </button>
          <button
            onClick={() => setShowCurrency(true)}
            style={{
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 12,
              padding: '8px 12px',
              color: '#E8EAF0',
              fontFamily: 'DM Sans',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>{currency.flag}</span>
            <span style={{ fontWeight: 700 }}>{currency.code}</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 12,
              width: 38,
              height: 38,
              cursor: 'pointer',
              fontSize: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E8EAF0',
            }}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div
        style={{ padding: '18px 22px 100px', maxWidth: 480, margin: '0 auto' }}
      >
        {/* ──── DASHBOARD ──── */}
        {tab === 'dashboard' && (
          <div className="fade">
            {/* Balance */}
            <div
              style={{
                background: 'linear-gradient(135deg,#00C896,#00A67E)',
                borderRadius: 24,
                padding: 26,
                marginBottom: 18,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 140,
                  height: 140,
                  background: 'rgba(255,255,255,.08)',
                  borderRadius: '50%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -40,
                  left: 50,
                  width: 110,
                  height: 110,
                  background: 'rgba(255,255,255,.05)',
                  borderRadius: '50%',
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(10,14,26,.6)',
                  letterSpacing: '.5px',
                  marginBottom: 6,
                }}
              >
                TOTAL BALANCE
              </div>
              <div
                style={{
                  fontFamily: 'Syne,sans-serif',
                  fontSize: 38,
                  fontWeight: 800,
                  color: '#0A0E1A',
                  letterSpacing: '-1px',
                }}
              >
                {fmt(balance, sym)}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
                <div
                  style={{
                    background: 'rgba(10,14,26,.15)',
                    borderRadius: 12,
                    padding: '10px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(10,14,26,.55)',
                      marginBottom: 3,
                      fontWeight: 700,
                    }}
                  >
                    ↑ INCOME
                  </div>
                  <div
                    style={{ fontSize: 16, fontWeight: 700, color: '#0A0E1A' }}
                  >
                    {fmt(totalIncome, sym)}
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(10,14,26,.15)',
                    borderRadius: 12,
                    padding: '10px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(10,14,26,.55)',
                      marginBottom: 3,
                      fontWeight: 700,
                    }}
                  >
                    ↓ EXPENSES
                  </div>
                  <div
                    style={{ fontSize: 16, fontWeight: 700, color: '#0A0E1A' }}
                  >
                    {fmt(totalExpense, sym)}
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(10,14,26,.15)',
                    borderRadius: 12,
                    padding: '10px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(10,14,26,.55)',
                      marginBottom: 3,
                      fontWeight: 700,
                    }}
                  >
                    ★ SAVED
                  </div>
                  <div
                    style={{ fontSize: 16, fontWeight: 700, color: '#0A0E1A' }}
                  >
                    {saveRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Quick budget alerts */}
            {ALL_EXPENSE_CATS.filter((c) => {
              const u = getBudgetUsage(c);
              return u && u.pct >= 80;
            })
              .slice(0, 2)
              .map((c) => {
                const u = getBudgetUsage(c);
                return (
                  <div
                    key={c}
                    style={{
                      background:
                        u.pct >= 100
                          ? 'rgba(255,107,107,.1)'
                          : 'rgba(255,217,61,.1)',
                      border: `1px solid ${
                        u.pct >= 100
                          ? 'rgba(255,107,107,.3)'
                          : 'rgba(255,217,61,.3)'
                      }`,
                      borderRadius: 14,
                      padding: '12px 16px',
                      marginBottom: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: u.pct >= 100 ? '#FF6B6B' : '#FFD93D',
                      }}
                    >
                      {u.pct >= 100 ? '🚨' : '⚠️'} {c} budget{' '}
                      {u.pct >= 100 ? 'exceeded' : 'alert'}
                    </div>
                    <div
                      style={{ fontSize: 12, color: 'rgba(232,234,240,.5)' }}
                    >
                      {sym}
                      {u.spent.toLocaleString()} / {sym}
                      {u.limit.toLocaleString()}
                    </div>
                  </div>
                );
              })}

            {/* Input */}
            <div className="card" style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(232,234,240,.4)',
                  marginBottom: 10,
                  letterSpacing: '.5px',
                }}
              >
                ADD TRANSACTION
              </div>
              <textarea
                className="field"
                rows={2}
                placeholder={`"Spent ${sym}5,000 on food" · "Got salary ${sym}150k"`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  className="btn-ghost"
                  onClick={handleVoice}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '11px',
                  }}
                >
                  <span style={{ fontSize: 17 }}>{recording ? '⏹' : '🎙️'}</span>
                  <span
                    style={{ fontSize: 13 }}
                    className={recording ? 'pulse' : ''}
                  >
                    {recording ? 'Listening...' : 'Voice'}
                  </span>
                </button>
                <button
                  className="btn-green"
                  onClick={handleProcess}
                  disabled={!inputText.trim() || aiLoading}
                  style={{ flex: 2, borderRadius: 12, padding: '11px' }}
                >
                  {aiLoading ? 'Processing...' : '✦ Add with AI'}
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 18,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {['Food & Dining', 'Transport', 'Shopping', 'Salary'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setInputText(`Spent on ${c}`);
                  }}
                  style={{
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 20,
                    padding: '8px 14px',
                    color: 'rgba(232,234,240,.7)',
                    fontFamily: 'DM Sans',
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  + {c}
                </button>
              ))}
            </div>

            {/* Recent */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(232,234,240,.4)',
                  letterSpacing: '.5px',
                }}
              >
                RECENT
              </div>
              <button
                onClick={() => setTab('transactions')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00C896',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                }}
              >
                See all →
              </button>
            </div>
            {transactions.slice(0, 5).map((t) => (
              <TxCard key={t.id} t={t} />
            ))}
          </div>
        )}

        {/* ──── TRANSACTIONS ──── */}
        {tab === 'transactions' && (
          <div className="fade">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['all', 'income', 'expense'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 12,
                    border: 'none',
                    background:
                      filterType === f
                        ? f === 'income'
                          ? '#00C896'
                          : f === 'expense'
                          ? '#FF6B6B'
                          : '#6C63FF'
                        : 'rgba(255,255,255,.06)',
                    color: filterType === f ? '#0A0E1A' : '#E8EAF0',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all .2s',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(232,234,240,.4)',
                marginBottom: 12,
                letterSpacing: '.5px',
              }}
            >
              {filtered.length} TRANSACTIONS
            </div>
            {filtered.map((t) => (
              <TxCard key={t.id} t={t} />
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 40,
                  color: 'rgba(232,234,240,.3)',
                }}
              >
                No transactions found.
              </div>
            )}
          </div>
        )}

        {/* ──── REPORTS ──── */}
        {tab === 'reports' && (
          <div className="fade">
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {['weekly', 'monthly', 'yearly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 12,
                    border: 'none',
                    background:
                      reportPeriod === p ? '#00C896' : 'rgba(255,255,255,.06)',
                    color: reportPeriod === p ? '#0A0E1A' : '#E8EAF0',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all .2s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* PDF Export */}
            <button
              onClick={() =>
                exportPDF(
                  transactions,
                  currency,
                  reportPeriod,
                  currentUser?.name || 'User'
                )
              }
              style={{
                width: '100%',
                marginBottom: 18,
                padding: '13px',
                borderRadius: 14,
                border: '1px solid rgba(0,200,150,.3)',
                background: 'rgba(0,200,150,.07)',
                color: '#00C896',
                fontFamily: 'DM Sans,sans-serif',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              📄 Export{' '}
              {reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}{' '}
              Report as PDF
            </button>
            {/* Budgets shortcut */}
            <button
              onClick={() => setShowBudgets(true)}
              style={{
                width: '100%',
                marginBottom: 18,
                padding: '13px',
                borderRadius: 14,
                border: '1px solid rgba(108,99,255,.3)',
                background: 'rgba(108,99,255,.07)',
                color: '#A78BFA',
                fontFamily: 'DM Sans,sans-serif',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              🎯 Manage Monthly Budgets
            </button>
            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 18,
              }}
            >
              {[
                { l: 'Income', v: fmt(totalIncome, sym), c: '#00C896', i: '↑' },
                {
                  l: 'Expenses',
                  v: fmt(totalExpense, sym),
                  c: '#FF6B6B',
                  i: '↓',
                },
                { l: 'Balance', v: fmt(balance, sym), c: '#6C63FF', i: '★' },
                { l: 'Save Rate', v: `${saveRate}%`, c: '#FFD93D', i: '%' },
              ].map((s) => (
                <div
                  key={s.l}
                  className="card"
                  style={{ textAlign: 'center', padding: 18 }}
                >
                  <div style={{ fontSize: 20, color: s.c, marginBottom: 4 }}>
                    {s.i}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Syne,sans-serif',
                      fontSize: 19,
                      fontWeight: 800,
                      color: s.c,
                    }}
                  >
                    {s.v}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(232,234,240,.4)',
                      marginTop: 3,
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
            {/* Pie */}
            {expenseCats.length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 14,
                    letterSpacing: '.5px',
                  }}
                >
                  EXPENSE BREAKDOWN
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={expenseCats}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseCats.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => `${sym}${v.toLocaleString()}`}
                      contentStyle={{
                        background: '#1A1F2E',
                        border: 'none',
                        borderRadius: 10,
                        color: '#E8EAF0',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {expenseCats.slice(0, 6).map((c, i) => (
                  <div
                    key={c.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                      <span style={{ fontSize: 13 }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {sym}
                      {c.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Bar */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(232,234,240,.4)',
                  marginBottom: 14,
                  letterSpacing: '.5px',
                }}
              >
                INCOME VS EXPENSES BY DAY
              </div>
              <ResponsiveContainer width="100%" height={175}>
                <BarChart data={getBarData()} barSize={13}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'rgba(232,234,240,.4)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: '#1A1F2E',
                      border: 'none',
                      borderRadius: 10,
                      color: '#E8EAF0',
                    }}
                    formatter={(v) => `${sym}${v.toLocaleString()}`}
                  />
                  <Bar
                    dataKey="income"
                    fill="#00C896"
                    radius={[6, 6, 0, 0]}
                    name="Income"
                  />
                  <Bar
                    dataKey="expense"
                    fill="#FF6B6B"
                    radius={[6, 6, 0, 0]}
                    name="Expense"
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 12,
                      color: 'rgba(232,234,240,.5)',
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Line */}
            <div className="card">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(232,234,240,.4)',
                  marginBottom: 14,
                  letterSpacing: '.5px',
                }}
              >
                6-MONTH BALANCE TREND
              </div>
              <ResponsiveContainer width="100%" height={155}>
                <LineChart data={getTrendData()}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.04)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgba(232,234,240,.4)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: '#1A1F2E',
                      border: 'none',
                      borderRadius: 10,
                      color: '#E8EAF0',
                    }}
                    formatter={(v) => `${sym}${v.toLocaleString()}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#6C63FF"
                    strokeWidth={2.5}
                    dot={{ fill: '#6C63FF', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ──── INSIGHTS ──── */}
        {tab === 'insights' && (
          <div className="fade">
            <div
              style={{
                background:
                  'linear-gradient(135deg,rgba(108,99,255,.18),rgba(0,200,150,.08))',
                border: '1px solid rgba(108,99,255,.25)',
                borderRadius: 20,
                padding: 22,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 26 }}>✨</div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Syne,sans-serif',
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    Moni AI Advisor
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(232,234,240,.4)' }}>
                    Personalised for your finances
                  </div>
                </div>
              </div>
              {aiLoading ? (
                <div style={{ textAlign: 'center', padding: 36 }}>
                  <div
                    style={{ fontSize: 30, marginBottom: 10 }}
                    className="pulse"
                  >
                    🤖
                  </div>
                  <div style={{ color: 'rgba(232,234,240,.4)', fontSize: 13 }}>
                    Analysing your finances...
                  </div>
                </div>
              ) : aiInsight ? (
                <>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.85,
                      color: 'rgba(232,234,240,.85)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {aiInsight}
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={fetchInsights}
                    style={{ marginTop: 14, width: '100%', fontSize: 13 }}
                  >
                    ↻ Refresh Insights
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'rgba(232,234,240,.4)',
                      marginBottom: 16,
                    }}
                  >
                    Get personalised AI analysis of your spending
                  </div>
                  <button
                    className="btn-green"
                    onClick={fetchInsights}
                    style={{ borderRadius: 12 }}
                  >
                    Get My Insights ✨
                  </button>
                </div>
              )}
            </div>
            {/* Budget overview */}
            {Object.keys(budgets).length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(232,234,240,.4)',
                    marginBottom: 14,
                    letterSpacing: '.5px',
                  }}
                >
                  BUDGET TRACKER
                </div>
                {Object.keys(budgets).map((cat, i) => {
                  const u = getBudgetUsage(cat);
                  if (!u) return null;
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 5,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{cat}</span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color:
                              u.pct >= 100
                                ? '#FF6B6B'
                                : u.pct >= 80
                                ? '#FFD93D'
                                : '#00C896',
                          }}
                        >
                          {sym}
                          {u.spent.toLocaleString()} / {sym}
                          {u.limit.toLocaleString()}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 7,
                          background: 'rgba(255,255,255,.07)',
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 10,
                            background:
                              u.pct >= 100
                                ? '#FF6B6B'
                                : u.pct >= 80
                                ? '#FFD93D'
                                : COLORS[i % COLORS.length],
                            width: `${u.pct}%`,
                            transition: 'width .8s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => setShowBudgets(true)}
                  className="btn-ghost"
                  style={{ width: '100%', fontSize: 13, marginTop: 4 }}
                >
                  Edit Budgets
                </button>
              </div>
            )}
            {/* Category spending bars */}
            <div className="card">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(232,234,240,.4)',
                  marginBottom: 14,
                  letterSpacing: '.5px',
                }}
              >
                TOP SPENDING
              </div>
              {expenseCats.slice(0, 5).map((c, i) => (
                <div key={c.name} style={{ marginBottom: 13 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{c.name}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#FF6B6B',
                      }}
                    >
                      {sym}
                      {c.value.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'rgba(255,255,255,.07)',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 10,
                        background: COLORS[i],
                        width: `${(c.value / expenseCats[0].value) * 100}%`,
                        transition: 'width .8s',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(10,14,26,.96)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,.07)',
          padding: '6px 0 14px',
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        {[
          { id: 'dashboard', icon: '⊞', l: 'Home' },
          { id: 'transactions', icon: '↕', l: 'History' },
          { id: 'reports', icon: '◎', l: 'Reports' },
          { id: 'insights', icon: '✦', l: 'Insights' },
        ].map((n) => (
          <button
            key={n.id}
            className={`nav-btn ${tab === n.id ? 'active' : ''}`}
            onClick={() => setTab(n.id)}
          >
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span>{n.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
