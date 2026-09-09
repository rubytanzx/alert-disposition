"use client";

export const dynamic = "force-static";

import ColorBends from "@/components/ColorBends";
import BorderGlow from "@/components/BorderGlow";
import NetworkNodes from "@/components/NetworkNodes";
import FraudNetworkCanvas, { type FraudNode } from "@/components/FraudNetworkCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, ArrowUp, Bell, Building2, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  ExternalLink, FileText, Flame, Globe, Inbox, Moon, PanelLeftClose, PanelLeftOpen,
  LogOut, Pin, Search, Settings, ShieldAlert, ShieldCheck, Sparkles, Sun, ThumbsDown, ThumbsUp, User, Users, X, XCircle,
} from "lucide-react";
import { BorderBeamButton, BorderBeamIconButton } from "@/components/ui/border-beam-button";
import { AIReasoningLoader } from "@/components/ui/ai-reasoning-loader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ up = true, delay = 0, dark = false }: { up?: boolean; delay?: number; dark?: boolean }) {
  const upPath   = "M0,28 C15,26 20,22 35,18 S55,10 70,8 S90,12 105,6 S120,4 135,2";
  const downPath = "M0,4 C15,6 25,8 40,12 S60,18 75,20 S95,16 110,22 S125,26 135,28";
  const linePath = up ? upPath : downPath;
  const areaPath = up ? `${upPath} L135,32 L0,32 Z` : `${downPath} L135,32 L0,32 Z`;
  const id = up ? "sparkGradUp" : "sparkGradDown";
  const color = up ? (dark ? "#22c55e" : "#16a34a") : (dark ? "#f87171" : "#dc2626");
  return (
    <svg width="80" height="32" viewBox="0 0 135 32" fill="none" role="img" aria-label={up ? "Trending up" : "Trending down"}>
      <style>{`
        @keyframes sparkDraw { from { stroke-dashoffset: 140; } to { stroke-dashoffset: 0; } }
        @keyframes sparkFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} style={{ opacity: 0, animation: `sparkFade 0.3s ease ${delay + 600}ms forwards` }} />
      <path d={linePath} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="140" strokeDashoffset="140"
        style={{ animation: `sparkDraw 0.85s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms forwards` }} />
    </svg>
  );
}

function useCountUp(end: number, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let mounted = true;
    let raf: number;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(end);
      return () => { mounted = false; };
    }
    const timeout = setTimeout(() => {
      const start = performance.now();
      const dur = 900;
      const tick = (now: number) => {
        if (!mounted) return;
        const p = Math.min((now - start) / dur, 1);
        setVal(Math.round((1 - (1 - p) ** 3) * end));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { mounted = false; clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [end, delay]);
  return val;
}

function StatCard({ icon: Icon, end, label, change, up, index, dark = false }: {
  icon: React.ElementType; end: number; label: string; change: string; up: boolean; index: number; dark?: boolean;
}) {
  const value = useCountUp(end, 150 + index * 100);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80 + index * 60); return () => clearTimeout(t); }, [index]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: `opacity 0.45s ease ${index * 60}ms, transform 0.45s ease ${index * 60}ms`,
      borderRadius: 12,
      background: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)",
      backdropFilter: "blur(24px) saturate(1.8)",
      WebkitBackdropFilter: "blur(24px) saturate(1.8)",
      border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(99,102,241,0.14)"}`,
      boxShadow: dark
        ? "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)"
        : "0 2px 12px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
    }}>
      <div className="p-4 flex flex-col h-full">
        <div className={`p-1.5 rounded-lg w-fit mb-3 ${dark ? "bg-white/[0.08] border border-white/[0.08]" : "bg-gray-50 border border-gray-100"}`}>
          <Icon className={`h-3.5 w-3.5 ${dark ? "text-gray-400" : "text-gray-500"}`} />
        </div>
        <p className={`text-[1.75rem] font-bold leading-none mb-1 ${dark ? "text-slate-100" : "text-gray-900"}`}>{value}</p>
        <p className={`text-xs leading-snug mb-auto pb-3 ${dark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
        <p className={`text-xs font-medium ${up ? (dark ? "text-red-400" : "text-red-600") : (dark ? "text-green-400" : "text-green-600")}`}>{change}</p>
      </div>
    </div>
  );
}

function DonutChart({ dark = false }: { dark?: boolean }) {
  const r = 40, cx = 56, cy = 56;
  const C = 2 * Math.PI * r;
  const total = 142;
  const segments = [{ v: 27, color: "#f43f5e" }, { v: 68, color: "#f97316" }, { v: 47, color: "#818cf8" }];
  let cumulative = 0;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label="Risk distribution">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="14" />
      {segments.map((seg, i) => {
        const arc = (seg.v / total) * C;
        const offset = C / 4 - cumulative;
        cumulative += arc;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="14"
          strokeLinecap="butt" strokeDasharray={`${arc - 1.5} ${C - arc + 1.5}`} strokeDashoffset={offset} />;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill={dark ? "#f1f5f9" : "#111827"}>142</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill={dark ? "#94a3b8" : "#6b7280"}>Customers</text>
    </svg>
  );
}

// ─── Adverse news articles ────────────────────────────────────────────────────

const ADVERSE_ARTICLES = [
  { outlet: "Reuters",         date: "2025-03-12", headline: "Regulators freeze assets linked to suspected sanctions evader" },
  { outlet: "Financial Times", date: "2024-09-27", headline: "Shell company network tied to OFAC-listed individual uncovered" },
  { outlet: "Bloomberg",       date: "2024-06-14", headline: "Treasury flags offshore accounts in multi-jurisdiction probe" },
  { outlet: "The Guardian",    date: "2023-11-02", headline: "Leaked documents expose shadow banking ties to sanctioned states" },
];

// ─── Case data ────────────────────────────────────────────────────────────────

const cases = [
  { id: 1, initials: "LB", colorLight: "bg-indigo-100 text-indigo-600",  colorDark: "bg-indigo-900/50 text-indigo-300",  customerName: "Li Bin",                    watchlistName: "LI, Bin",                    watchlistSource: "OFAC SDN",      risk: "Critical" as const, confidence: 94, matchCount: 16, indicators: "Sanctioned",                                                   time: "2h ago",  unread: true  },
  { id: 2, initials: "RM", colorLight: "bg-violet-100 text-violet-600",  colorDark: "bg-violet-900/50 text-violet-300",  customerName: "Rahman Mohammad Mizanur",   watchlistName: "RAHMAN, M.M.",               watchlistSource: "UN Sanctions",  risk: "High"     as const, confidence: 82, matchCount: 11, indicators: "Sanctioned · Relatives & Close Associates",                    time: "5h ago",  unread: true  },
  { id: 3, initials: "NJ", colorLight: "bg-sky-100 text-sky-600",        colorDark: "bg-sky-900/50 text-sky-300",        customerName: "Nur Jazlan Mohamed",        watchlistName: "NUR JAZLAN, Mohamed (PEP)",  watchlistSource: "PEP Lists",     risk: "High"     as const, confidence: 79, matchCount: 9,  indicators: "PEP · Relatives & Close Associates",                           time: "9h ago",  unread: false },
  { id: 4, initials: "MK", colorLight: "bg-amber-100 text-amber-600",    colorDark: "bg-amber-900/50 text-amber-300",    customerName: "Madzir Kalid",              watchlistName: "MADZIR, Kalid",              watchlistSource: "Interpol",      risk: "Medium"   as const, confidence: 63, matchCount: 6,  indicators: "Sanctioned · Relatives & Close Associates",                    time: "1d ago",  unread: false },
  { id: 5, initials: "BB", colorLight: "bg-rose-100 text-rose-600",      colorDark: "bg-rose-900/50 text-rose-300",      customerName: "Benjamin Bernard",          watchlistName: "BERNARD, Benjamin",          watchlistSource: "Adverse Media", risk: "Medium"   as const, confidence: 57, matchCount: 5,  indicators: "PEP · Relatives & Close Associates",                           time: "2d ago",  unread: false },
];

const entities = [
  { initials:"CW", colorLight:"bg-indigo-100 text-indigo-600",  colorDark:"bg-indigo-900/50 text-indigo-300",  name:"Chen Wei",               type:"Individual", risk:"Critical", matches:12, confidence:97, indicators:"Sanctioned entity link, Shell company, Unusual transfers",      updated:"2h ago",  status:"Under review" },
  { initials:"AH", colorLight:"bg-violet-100 text-violet-600",  colorDark:"bg-violet-900/50 text-violet-300",  name:"ABC Holdings Pte. Ltd.", type:"Corporate",  risk:"High",     matches:8,  confidence:84, indicators:"Shared directors, Adverse media, High-risk jurisdiction",        updated:"4h ago",  status:"In progress"  },
  { initials:"LX", colorLight:"bg-sky-100 text-sky-600",        colorDark:"bg-sky-900/50 text-sky-300",        name:"Liang Xin",              type:"Individual", risk:"High",     matches:6,  confidence:76, indicators:"PEP link, Shared address, Multiple accounts",                    updated:"6h ago",  status:"New"          },
  { initials:"ST", colorLight:"bg-emerald-100 text-emerald-600",colorDark:"bg-emerald-900/50 text-emerald-300",name:"Sunrise Trading LLC",    type:"Corporate",  risk:"Medium",   matches:4,  confidence:61, indicators:"Shell company, Unusual transaction pattern",                     updated:"9h ago",  status:"In progress"  },
  { initials:"KL", colorLight:"bg-rose-100 text-rose-600",      colorDark:"bg-rose-900/50 text-rose-300",      name:"Kumar Logistics",        type:"Corporate",  risk:"Medium",   matches:4,  confidence:58, indicators:"High-risk jurisdiction, Related entities",                       updated:"12h ago", status:"New"          },
];

// ─── Fraud network node data ──────────────────────────────────────────────────

const CASE_NODES: Record<number, FraudNode[]> = {
  // Li Bin — OFAC SDN, Critical
  // Watchlist persons only — click a node to compare against customer profile
  1: [
    // 0 — exact format match
    { label: "LI, Bin",        sublabel: "OFAC SDN",    risk: "critical", nodeType: "person" as const, matchScore: 93,
      matchFields: [
        { field: "Full name",      customer: "LI, Bin",           watchlist: "LI, Bin",           match: true  },
        { field: "Date of birth",  customer: "12 Jul 1975",       watchlist: "12 Jul 1975",       match: true  },
        { field: "Nationality",    customer: "PRC",               watchlist: "PRC",               match: true  },
        { field: "Country",        customer: "China",             watchlist: "China",             match: true  },
        { field: "Gender",         customer: "Male",              watchlist: "Male",              match: true  },
        { field: "Address",        customer: "Shanghai, PRC",     watchlist: "Shanghai, PRC",     match: true  },
        { field: "Employer",       customer: "CITIC Group",       watchlist: "CITIC Group Corp",  match: true  },
        { field: "Occupation",     customer: "Executive",         watchlist: "Executive",         match: true  },
        { field: "Former name",    customer: "N/A",               watchlist: "N/A",               match: true  },
        { field: "Alias",          customer: "N/A",               watchlist: "Li Bing",           match: false },
      ]},
    // 1 — extra middle name
    { label: "LI, Bin Rong",   sublabel: "UN",           risk: "critical", nodeType: "person" as const, matchScore: 88,
      matchFields: [
        { field: "Surname",    customer: "LI",               watchlist: "LI",               match: true  },
        { field: "Given name", customer: "Bin",              watchlist: "Bin Rong",         match: true  },
        { field: "DOB",        customer: "12 Jul 1975",       watchlist: "12 Jul 1975",       match: true  },
        { field: "Nationality",customer: "PRC",               watchlist: "PRC",               match: true  },
      ]},
    // 2 — Wade-Giles transliteration
    { label: "LEE, Bin",       sublabel: "OFAC SDN",    risk: "critical", nodeType: "person" as const, matchScore: 82,
      matchFields: [
        { field: "Given name", customer: "Bin",              watchlist: "Bin",              match: true  },
        { field: "Nationality",customer: "PRC",               watchlist: "PRC",               match: true  },
        { field: "Surname",    customer: "LI",               watchlist: "LEE",              match: true  },
        { field: "DOB",        customer: "12 Jul 1975",       watchlist: "15 Jul 1975",       match: false },
      ]},
    // 3 — reversed Western order
    { label: "Bin Li",         sublabel: "EU Sanctions", risk: "high",     nodeType: "person" as const, matchScore: 74,
      matchFields: [
        { field: "Surname",    customer: "LI",               watchlist: "LI",               match: true  },
        { field: "Given name", customer: "Bin",              watchlist: "Bin",              match: true  },
        { field: "Nationality",customer: "PRC",               watchlist: "PRC",               match: true  },
        { field: "DOB",        customer: "12 Jul 1975",       watchlist: "20 Feb 1980",       match: false },
      ]},
    // 4 — spelling variant
    { label: "LI, Binn",       sublabel: "OFAC SDN",    risk: "high",     nodeType: "person" as const, matchScore: 66,
      matchFields: [
        { field: "Surname",    customer: "LI",               watchlist: "LI",               match: true  },
        { field: "Given name", customer: "Bin",              watchlist: "Binn",             match: true  },
        { field: "Nationality",customer: "PRC",               watchlist: "SGP",               match: false },
        { field: "DOB",        customer: "12 Jul 1975",       watchlist: "3 Sep 1976",        match: false },
      ]},
    // 5 — phonetic near-match
    { label: "LI, Pin",        sublabel: "Interpol",    risk: "medium",   nodeType: "person" as const, matchScore: 51,
      matchFields: [
        { field: "Surname",    customer: "LI",               watchlist: "LI",               match: true  },
        { field: "Given name", customer: "Bin",              watchlist: "Pin",              match: false },
        { field: "Nationality",customer: "PRC",               watchlist: "HK",                match: false },
        { field: "DOB",        customer: "12 Jul 1975",       watchlist: "14 Apr 1982",       match: false },
      ]},
    // 6 — romanisation variant
    { label: "LI, Ben",        sublabel: "UN",           risk: "medium",   nodeType: "person" as const, matchScore: 45,
      matchFields: [
        { field: "Surname",    customer: "LI",               watchlist: "LI",               match: true  },
        { field: "Given name", customer: "Bin",              watchlist: "Ben",              match: false },
        { field: "Address",    customer: "Shanghai, PRC",     watchlist: "Guangzhou, PRC",   match: false },
        { field: "DOB",        customer: "12 Jul 1975",       watchlist: "7 Nov 1969",        match: false },
      ]},
    // 7 — distant transliteration
    { label: "LE, Bin",        sublabel: "World Bank",  risk: "low",      nodeType: "person" as const, matchScore: 32,
      matchFields: [
        { field: "Given name", customer: "Bin",              watchlist: "Bin",              match: true  },
        { field: "Surname",    customer: "LI",               watchlist: "LE",              match: false },
        { field: "Nationality",customer: "PRC",               watchlist: "Vietnam",          match: false },
        { field: "DOB",        customer: "12 Jul 1975",       watchlist: "22 Mar 1971",       match: false },
      ]},
  ],
  // Rahman Mohammad Mizanur — UN Sanctions, High
  // All watchlist persons — click a node to compare against customer profile
  // connectedTo indices = other watchlist nodes connected via shared entity / surname / account
  2: [
    // 0
    { label: "MIZANUR, Rashed",  sublabel: "UN Sanctions",      risk: "critical", nodeType: "person" as const, matchScore: 91,
      matchFields: [
        { field: "Full name",     customer: "Rahman Mohammad Mizanur", watchlist: "MIZANUR, Rashed Rahman",  match: true  },
        { field: "Date of birth", customer: "14 Mar 1972",             watchlist: "14 Mar 1972",             match: true  },
        { field: "Nationality",   customer: "Bangladesh",              watchlist: "Bangladesh",              match: true  },
        { field: "Country",       customer: "Bangladesh",              watchlist: "Bangladesh",              match: true  },
        { field: "Gender",        customer: "Male",                    watchlist: "Male",                    match: true  },
        { field: "Address",       customer: "Dhaka, Bangladesh",       watchlist: "Dhaka, BD",               match: true  },
        { field: "Employer",      customer: "Islami Bank BD",          watchlist: "Islami Bank Bangladesh",  match: true  },
        { field: "Occupation",    customer: "Bank Director",           watchlist: "Director",                match: true  },
        { field: "Former name",   customer: "N/A",                     watchlist: "N/A",                     match: true  },
        { field: "Alias",         customer: "N/A",                     watchlist: "M. Mizanur Rahman",       match: false },
      ]},
    // 1 — shares Rahman + Mohammad
    { label: "RAHMAN, Mohd. M.", sublabel: "OFAC SDN",           risk: "critical", nodeType: "person" as const, matchScore: 87,
      matchFields: [
        { field: "Surname",      customer: "Rahman",                  watchlist: "RAHMAN",                  match: true  },
        { field: "Given name",   customer: "Mohammad",                watchlist: "Mohd.",                   match: true  },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "9 Aug 1969",              match: false },
        { field: "Linked entity",customer: "Front Co. Ltd",           watchlist: "Front Co. Ltd",           match: true  },
      ]},
    // 2
    { label: "RAHMAN, Akhtar",  sublabel: "Interpol Red",       risk: "high",     nodeType: "person" as const, matchScore: 76,
      matchFields: [
        { field: "Surname",      customer: "Rahman",                  watchlist: "RAHMAN",                  match: true  },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Bangladesh",               match: true  },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "22 Nov 1975",             match: false },
        { field: "Address",      customer: "Dhaka, Bangladesh",       watchlist: "Chittagong, BD",          match: false },
      ]},
    // 3 — phonetic variant of Rahman
    { label: "RAHAMAN, Noor",   sublabel: "UN Sanctions",       risk: "high",     nodeType: "person" as const, matchScore: 68,
      matchFields: [
        { field: "Surname",      customer: "Rahman",                  watchlist: "RAHAMAN",                 match: true  },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Bangladesh",               match: true  },
        { field: "Employer",     customer: "Front Co. Ltd",           watchlist: "Dhaka Entity Ltd",        match: false },
        { field: "Phone prefix", customer: "+880",                    watchlist: "+880",                    match: true  },
      ]},
    // 4 — shares Mizanur surname
    { label: "MIZANUR, Ibrahim",sublabel: "OFAC SDN",           risk: "high",     nodeType: "person" as const, matchScore: 64,
      matchFields: [
        { field: "Surname",      customer: "Mizanur",                 watchlist: "MIZANUR",                 match: true  },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Bangladesh",               match: true  },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "3 Jan 1968",              match: false },
        { field: "Linked acc.",  customer: "ACC ••4491",              watchlist: "ACC ••4491",              match: true  },
      ]},
    // 5
    { label: "RAHMAN, Farida",  sublabel: "EU Sanctions",       risk: "high",     nodeType: "person" as const, matchScore: 61,
      matchFields: [
        { field: "Surname",      customer: "Rahman",                  watchlist: "RAHMAN",                  match: true  },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Bangladesh",               match: true  },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "5 May 1977",              match: false },
        { field: "Address",      customer: "Dhaka, Bangladesh",       watchlist: "Dhaka, BD",               match: true  },
      ]},
    // 6 — spelling variant of Rahman
    { label: "REHMAN, Alam M.", sublabel: "UN Sanctions",       risk: "medium",   nodeType: "person" as const, matchScore: 49,
      matchFields: [
        { field: "Surname",      customer: "Rahman",                  watchlist: "REHMAN",                  match: true  },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Bangladesh",               match: true  },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "17 Oct 1971",             match: false },
        { field: "Linked entity",customer: "Front Co. Ltd",           watchlist: "—",                       match: false },
      ]},
    // 7 — phonetic variant
    { label: "RAHAMAN, Tariq",  sublabel: "Interpol Red",       risk: "medium",   nodeType: "person" as const, matchScore: 44,
      matchFields: [
        { field: "Surname",      customer: "Rahman",                  watchlist: "RAHAMAN",                 match: true  },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Pakistan",                 match: false },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "29 Jun 1970",             match: false },
        { field: "Linked acc.",  customer: "ACC ••4491",              watchlist: "ACC ••7723",              match: false },
      ]},
    // 8 — partial, shares Mizanur
    { label: "MIZANUR, Hossain",sublabel: "EU Sanctions",       risk: "medium",   nodeType: "person" as const, matchScore: 38,
      matchFields: [
        { field: "Surname",      customer: "Mizanur",                 watchlist: "MIZANUR",                 match: true  },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Bangladesh",               match: true  },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "11 Feb 1980",             match: false },
        { field: "Address",      customer: "Dhaka, Bangladesh",       watchlist: "Singapore",               match: false },
      ]},
    // 9 — loose, shares Rahman
    { label: "RAHMAN, Rahela",  sublabel: "World Bank",         risk: "low",      nodeType: "person" as const, matchScore: 28,
      matchFields: [
        { field: "Surname",      customer: "Rahman",                  watchlist: "RAHMAN",                  match: true  },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Bangladesh",               match: true  },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "30 Sep 1985",             match: false },
        { field: "Address",      customer: "Dhaka, Bangladesh",       watchlist: "Sylhet, BD",              match: false },
      ]},
    // 10 — distant transliteration
    { label: "RAHAMAT, Shafiq", sublabel: "OFAC SDN",           risk: "low",      nodeType: "person" as const, matchScore: 21,
      matchFields: [
        { field: "Surname",      customer: "Rahman",                  watchlist: "RAHAMAT",                 match: false },
        { field: "Nationality",  customer: "Bangladesh",              watchlist: "Bangladesh",               match: true  },
        { field: "DOB",          customer: "14 Mar 1972",             watchlist: "8 Mar 1983",              match: false },
        { field: "Address",      customer: "Dhaka, Bangladesh",       watchlist: "Narayanganj, BD",         match: false },
      ]},
  ],
  // Nur Jazlan Mohamed — PEP Lists, High
  3: [
    { label: "NUR JAZLAN, Mohamed",   sublabel: "PEP Lists",      risk: "high",   nodeType: "person" as const, matchScore: 79, matchFields: [
        { field: "Name",          customer: "Nur Jazlan Mohamed",      watchlist: "NUR JAZLAN, Mohamed (N.Mohammed)",   match: true  },
        { field: "Date of birth", customer: "15/02/1966",              watchlist: "15/02/1966",                         match: true  },
        { field: "Country",       customer: "Selangor, MALAYSIA",      watchlist: "Selangor, MALAYSIA",                 match: true  },
        { field: "Gender",        customer: "Male",                    watchlist: "M",                                  match: true  },
        { field: "Nationality",   customer: "MALAYSIA",                watchlist: "MALAYSIA",                           match: true  },
        { field: "Employer",      customer: "Dewan Rakyat",            watchlist: "Dewan Rakyat",                       match: true  },
        { field: "Occupation",    customer: "Member of Dewan Rakyat",  watchlist: "Member of Dewan Rakyat",             match: true  },
        { field: "Former name",   customer: "MOHAMED Nur Jazlan",      watchlist: "MOHAMED Nur Jazlan",                 match: true  },
        { field: "Alias",         customer: "MOHAMED Nur Jazlan; MOHAMED Nur Jazlan bin; Datuk Nur Jazlan MOHAMED", watchlist: "MOHAMED Nur Jazlan; MOHAMED Nur Jazlan bin; Datuk Nur Jazlan MOHAMED", match: false },
    ] },
    { label: "NUR JAZLAN, Mohamad",   sublabel: "UN PEP",         risk: "high",   nodeType: "person" as const, matchScore: 74, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NUR JAZLAN", match: true }, { field: "Given name", customer: "Mohamed", watchlist: "Mohamad", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "7 Sep 1966", match: false }] },
    { label: "Jazlan Nur Mohamed",    sublabel: "EU PEP",         risk: "high",   nodeType: "person" as const, matchScore: 70, matchFields: [{ field: "Full name", customer: "Nur Jazlan Mohamed", watchlist: "Jazlan Nur Mohamed", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "4 Sep 1966", match: true }, { field: "Address", customer: "Kuala Lumpur", watchlist: "Putrajaya", match: false }] },
    { label: "NOR JAZLAN, Mohamed",   sublabel: "PEP Lists",      risk: "high",   nodeType: "person" as const, matchScore: 65, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NOR JAZLAN", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "4 Sep 1966", match: true }, { field: "Passport", customer: "A12345678", watchlist: "A12345688", match: false }] },
    { label: "NUR, Jazlan M.",        sublabel: "Interpol",       risk: "high",   nodeType: "person" as const, matchScore: 60, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NUR", match: false }, { field: "Given name", customer: "Mohamed", watchlist: "Jazlan M.", match: false }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "4 Sep 1966", match: true }] },
    { label: "NOOR JAZLAN, Mohamed",  sublabel: "UN PEP",         risk: "medium", nodeType: "person" as const, matchScore: 54, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NOOR JAZLAN", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "19 Mar 1970", match: false }, { field: "Passport", customer: "A12345678", watchlist: "A99812341", match: false }] },
    { label: "NUR JAZLAN, Mohammed",  sublabel: "PEP Lists",      risk: "medium", nodeType: "person" as const, matchScore: 49, matchFields: [{ field: "Full name", customer: "Nur Jazlan Mohamed", watchlist: "NUR JAZLAN, Mohammed", match: true }, { field: "Nationality", customer: "MYS", watchlist: "PAK", match: false }, { field: "DOB", customer: "4 Sep 1966", watchlist: "12 Jun 1968", match: false }, { field: "Address", customer: "Kuala Lumpur", watchlist: "Karachi", match: false }] },
    { label: "JAZLAN, Nur M.",        sublabel: "EU PEP",         risk: "medium", nodeType: "person" as const, matchScore: 43, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "JAZLAN", match: false }, { field: "Given name", customer: "Mohamed", watchlist: "Nur M.", match: false }, { field: "Nationality", customer: "MYS", watchlist: "SGP", match: false }, { field: "DOB", customer: "4 Sep 1966", watchlist: "4 Sep 1966", match: true }] },
    { label: "NUR JAZLAN, Mohd",      sublabel: "World Bank",     risk: "medium", nodeType: "person" as const, matchScore: 38, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NUR JAZLAN", match: true }, { field: "Given name", customer: "Mohamed", watchlist: "Mohd", match: true }, { field: "Nationality", customer: "MYS", watchlist: "BRN", match: false }, { field: "DOB", customer: "4 Sep 1966", watchlist: "1 Jan 1961", match: false }] },
    { label: "NUR JAZLAN, Md",        sublabel: "Interpol",       risk: "medium", nodeType: "person" as const, matchScore: 34, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NUR JAZLAN", match: true }, { field: "Given name", customer: "Mohamed", watchlist: "Md", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "21 Feb 1972", match: false }, { field: "Passport", customer: "A12345678", watchlist: "Unknown", match: false }] },
    { label: "NUR JALAN, Mohamed",    sublabel: "PEP Lists",      risk: "medium", nodeType: "person" as const, matchScore: 29, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NUR JALAN", match: false }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "30 Nov 1974", match: false }, { field: "Address", customer: "Kuala Lumpur", watchlist: "Kuala Lumpur", match: true }] },
    { label: "NOR JAZLAN, Mohd",      sublabel: "UN PEP",         risk: "medium", nodeType: "person" as const, matchScore: 24, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NOR JAZLAN", match: true }, { field: "Given name", customer: "Mohamed", watchlist: "Mohd", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "8 Aug 1978", match: false }, { field: "Nationality", customer: "MYS", watchlist: "IDN", match: false }] },
    { label: "NURJAZLAN, Mohamed",    sublabel: "Interpol",       risk: "low",    nodeType: "person" as const, matchScore: 20, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NURJAZLAN", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "17 Mar 1983", match: false }, { field: "Passport", customer: "A12345678", watchlist: "Unknown", match: false }] },
    { label: "NUR JAZLAN, Muhamad",   sublabel: "World Bank",     risk: "low",    nodeType: "person" as const, matchScore: 16, matchFields: [{ field: "Surname", customer: "Nur Jazlan", watchlist: "NUR JAZLAN", match: true }, { field: "Given name", customer: "Mohamed", watchlist: "Muhamad", match: true }, { field: "DOB", customer: "4 Sep 1966", watchlist: "2 May 1987", match: false }, { field: "Nationality", customer: "MYS", watchlist: "THA", match: false }] },
  ],
  // Madzir Kalid — Interpol, Medium
  4: [
    { label: "MADZIR, Kalid",     sublabel: "Interpol",    risk: "high",   nodeType: "person" as const, matchScore: 63, matchFields: [{ field: "Full name", customer: "MADZIR, Kalid", watchlist: "MADZIR, Kalid", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "17 Aug 1978", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "Passport", customer: "B4412209", watchlist: "B4412209", match: true }] },
    { label: "Kalid Madzir",      sublabel: "Interpol",    risk: "high",   nodeType: "person" as const, matchScore: 58, matchFields: [{ field: "Full name", customer: "Madzir Kalid", watchlist: "Kalid Madzir", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "17 Aug 1978", match: true }, { field: "Passport", customer: "B4412209", watchlist: "B4412229", match: false }] },
    { label: "MADZIR, Khalid",    sublabel: "OFAC SDN",    risk: "high",   nodeType: "person" as const, matchScore: 54, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MADZIR", match: true }, { field: "Given name", customer: "Kalid", watchlist: "Khalid", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "17 Aug 1978", match: true }, { field: "Nationality", customer: "MYS", watchlist: "IDN", match: false }] },
    { label: "MADZIR, Khaled",    sublabel: "UN",          risk: "high",   nodeType: "person" as const, matchScore: 49, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MADZIR", match: true }, { field: "Given name", customer: "Kalid", watchlist: "Khaled", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "3 Mar 1980", match: false }, { field: "Nationality", customer: "MYS", watchlist: "SGP", match: false }] },
    { label: "MADIR, Kalid",      sublabel: "Interpol",    risk: "high",   nodeType: "person" as const, matchScore: 45, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MADIR", match: false }, { field: "Given name", customer: "Kalid", watchlist: "Kalid", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "17 Aug 1978", match: true }] },
    { label: "M. KHALID",         sublabel: "OFAC SDN",    risk: "medium", nodeType: "person" as const, matchScore: 40, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "M.", match: false }, { field: "Given name", customer: "Kalid", watchlist: "KHALID", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "22 Oct 1975", match: false }] },
    { label: "MADZIR, Callid",    sublabel: "EU Sanctions",risk: "medium", nodeType: "person" as const, matchScore: 36, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MADZIR", match: true }, { field: "Given name", customer: "Kalid", watchlist: "Callid", match: false }, { field: "DOB", customer: "17 Aug 1978", watchlist: "5 Jun 1982", match: false }, { field: "Nationality", customer: "MYS", watchlist: "AUS", match: false }] },
    { label: "MAZDIR, Kalid",     sublabel: "Interpol",    risk: "medium", nodeType: "person" as const, matchScore: 32, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MAZDIR", match: false }, { field: "Given name", customer: "Kalid", watchlist: "Kalid", match: true }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "9 Nov 1976", match: false }] },
    { label: "MADZIR, Kalit",     sublabel: "UN",          risk: "medium", nodeType: "person" as const, matchScore: 28, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MADZIR", match: true }, { field: "Given name", customer: "Kalid", watchlist: "Kalit", match: false }, { field: "DOB", customer: "17 Aug 1978", watchlist: "14 Apr 1984", match: false }, { field: "Nationality", customer: "MYS", watchlist: "SGP", match: false }] },
    { label: "MADZEER, Kalid",    sublabel: "Interpol",    risk: "medium", nodeType: "person" as const, matchScore: 24, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MADZEER", match: false }, { field: "Given name", customer: "Kalid", watchlist: "Kalid", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "30 Jan 1980", match: false }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }] },
    { label: "MADZIR, K.",        sublabel: "World Bank",  risk: "low",    nodeType: "person" as const, matchScore: 18, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MADZIR", match: true }, { field: "Given name", customer: "Kalid", watchlist: "K.", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "Unknown", match: false }, { field: "Nationality", customer: "MYS", watchlist: "IDN", match: false }] },
    { label: "MADZIRI, Kalid",    sublabel: "Interpol",    risk: "low",    nodeType: "person" as const, matchScore: 14, matchFields: [{ field: "Surname", customer: "Madzir", watchlist: "MADZIRI", match: false }, { field: "Given name", customer: "Kalid", watchlist: "Kalid", match: true }, { field: "DOB", customer: "17 Aug 1978", watchlist: "2 Jul 1987", match: false }, { field: "Nationality", customer: "MYS", watchlist: "MYS", match: true }] },
  ],
  // Benjamin Bernard — Adverse Media, Medium
  5: [
    { label: "BERNARD, Benjamin", sublabel: "Adverse Media",risk: "high",   nodeType: "person" as const, matchScore: 57, matchFields: [{ field: "Full name", customer: "BERNARD, Benjamin", watchlist: "BERNARD, Benjamin", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "3 Jun 1983", match: true }, { field: "Nationality", customer: "FRA", watchlist: "FRA", match: true }, { field: "Address", customer: "Paris, France", watchlist: "Paris, France", match: true }] },
    { label: "Benjamin BERNARD",  sublabel: "OFAC SDN",    risk: "high",   nodeType: "person" as const, matchScore: 53, matchFields: [{ field: "Full name", customer: "Benjamin Bernard", watchlist: "Benjamin BERNARD", match: true }, { field: "Nationality", customer: "FRA", watchlist: "FRA", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "3 Jun 1983", match: true }, { field: "Passport", customer: "10FX39201", watchlist: "10FX39201", match: true }] },
    { label: "BERNARD, Ben",      sublabel: "Interpol",    risk: "high",   nodeType: "person" as const, matchScore: 48, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNARD", match: true }, { field: "Given name", customer: "Benjamin", watchlist: "Ben", match: true }, { field: "Nationality", customer: "FRA", watchlist: "FRA", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "9 Jun 1983", match: false }] },
    { label: "BERNHARD, Benjamin",sublabel: "EU Sanctions",risk: "high",   nodeType: "person" as const, matchScore: 44, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNHARD", match: false }, { field: "Given name", customer: "Benjamin", watchlist: "Benjamin", match: true }, { field: "Nationality", customer: "FRA", watchlist: "DEU", match: false }, { field: "DOB", customer: "3 Jun 1983", watchlist: "3 Jun 1983", match: true }] },
    { label: "BERNARD, Benjamen", sublabel: "Adverse Media",risk: "high",  nodeType: "person" as const, matchScore: 40, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNARD", match: true }, { field: "Given name", customer: "Benjamin", watchlist: "Benjamen", match: false }, { field: "Nationality", customer: "FRA", watchlist: "BEL", match: false }, { field: "DOB", customer: "3 Jun 1983", watchlist: "14 Feb 1981", match: false }] },
    { label: "BENARD, Benjamin",  sublabel: "Interpol",    risk: "medium", nodeType: "person" as const, matchScore: 36, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BENARD", match: false }, { field: "Given name", customer: "Benjamin", watchlist: "Benjamin", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "3 Jun 1983", match: true }, { field: "Nationality", customer: "FRA", watchlist: "CHE", match: false }] },
    { label: "BERNARD, Benjmin",  sublabel: "OFAC SDN",    risk: "medium", nodeType: "person" as const, matchScore: 32, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNARD", match: true }, { field: "Given name", customer: "Benjamin", watchlist: "Benjmin", match: false }, { field: "Nationality", customer: "FRA", watchlist: "FRA", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "11 Sep 1985", match: false }] },
    { label: "BERNERD, Benjamin", sublabel: "EU Sanctions",risk: "medium", nodeType: "person" as const, matchScore: 28, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNERD", match: false }, { field: "Given name", customer: "Benjamin", watchlist: "Benjamin", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "27 Jul 1980", match: false }, { field: "Nationality", customer: "FRA", watchlist: "NLD", match: false }] },
    { label: "BEN, Bernard",      sublabel: "Adverse Media",risk: "medium",nodeType: "person" as const, matchScore: 24, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "Bernard", match: true }, { field: "Given name", customer: "Benjamin", watchlist: "Ben", match: true }, { field: "Nationality", customer: "FRA", watchlist: "FRA", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "20 Mar 1979", match: false }] },
    { label: "BERNARD, Benji",    sublabel: "Interpol",    risk: "medium", nodeType: "person" as const, matchScore: 20, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNARD", match: true }, { field: "Given name", customer: "Benjamin", watchlist: "Benji", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "1 Dec 1982", match: false }, { field: "Nationality", customer: "FRA", watchlist: "FRA", match: true }] },
    { label: "B. BERNARD",        sublabel: "World Bank",  risk: "low",    nodeType: "person" as const, matchScore: 16, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNARD", match: true }, { field: "Given name", customer: "Benjamin", watchlist: "B.", match: true }, { field: "Nationality", customer: "FRA", watchlist: "Unknown", match: false }, { field: "DOB", customer: "3 Jun 1983", watchlist: "Unknown", match: false }] },
    { label: "BERNARD, Beniamin", sublabel: "EU Sanctions",risk: "low",    nodeType: "person" as const, matchScore: 12, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNARD", match: true }, { field: "Given name", customer: "Benjamin", watchlist: "Beniamin", match: false }, { field: "Nationality", customer: "FRA", watchlist: "POL", match: false }, { field: "DOB", customer: "3 Jun 1983", watchlist: "8 Oct 1990", match: false }] },
    { label: "BERNHARD, Ben",     sublabel: "Interpol",    risk: "low",    nodeType: "person" as const, matchScore: 10, matchFields: [{ field: "Surname", customer: "Bernard", watchlist: "BERNHARD", match: false }, { field: "Given name", customer: "Benjamin", watchlist: "Ben", match: true }, { field: "DOB", customer: "3 Jun 1983", watchlist: "15 Feb 1988", match: false }, { field: "Nationality", customer: "FRA", watchlist: "DEU", match: false }] },
  ],
};

// ─── Chat helpers ─────────────────────────────────────────────────────────────

type CopilotStep = 'overview' | 'identity' | 'sources' | 'adverse-news' | 'network' | 'complete';
type ChatMsg = {
  role: "ai" | "user";
  content: string;
  copilotStep?: CopilotStep;
  reasoning?: {
    phases: string[];
    thoughts: string[];
    tasks: { title: string; description?: string; status: 'completed' | 'in-progress' | 'pending' }[];
    done?: boolean;
  };
};

function getInitialMessages(_c: typeof cases[0]): ChatMsg[] {
  return [{ role: "ai", content: "", copilotStep: "overview" }];
}

function getSimulatedResponse(input: string, c: typeof cases[0]): string {
  const lower = input.toLowerCase();
  const nodes  = CASE_NODES[c.id] ?? [];
  if (lower.includes("confidence") || lower.includes("score") || lower.includes("match")) {
    return `The **${c.confidence}% confidence score** for **${c.customerName}** is derived from a multi-factor analysis: name similarity (phonetic and transliteration variants), date-of-birth proximity, jurisdiction overlap, and corroborating indicators from ${c.watchlistSource}. Scores above 90% typically warrant immediate escalation with no further threshold required.`;
  }
  if (lower.includes("action") || lower.includes("next") || lower.includes("recommend") || lower.includes("what should")) {
    return `Based on the **${c.risk} risk** classification, I recommend:\n\n1. Document all network connections visible in the graph.\n2. Request a source of funds declaration from the customer.\n3. Cross-reference against internal transaction history for the past 24 months.\n4. ${c.risk === "Critical" ? "Initiate a Suspicious Activity Report (SAR) filing immediately." : "Flag for enhanced ongoing monitoring and quarterly review."}`;
  }
  if (lower.includes("entity") || lower.includes("entiti") || lower.includes("network") || lower.includes("connection") || lower.includes("node")) {
    return `The network graph shows **${nodes.length} entities** connected to **${c.customerName}**, including shared directors, offshore accounts, and transaction flows. The most significant links are in the critical/high-risk tier, which share identifiers with parties listed on ${c.watchlistSource}.`;
  }
  if (lower.includes("sar") || lower.includes("report") || lower.includes("filing") || lower.includes("escalat")) {
    return `For a **${c.risk} risk** case at ${c.confidence}% confidence, ${c.risk === "Critical" ? "a SAR filing is strongly indicated. The identified network patterns — particularly the layering activity and offshore entity connections — meet the threshold for suspicious activity reporting under standard AML frameworks." : "enhanced monitoring and a risk escalation memo to your MLRO are appropriate first steps. A SAR filing threshold depends on whether additional evidence of intent to conceal is identified during the EDD review."}`;
  }
  return `Based on the current network analysis for **${c.customerName}**, the data points to a **${c.risk.toLowerCase()} risk** profile. I can provide more detail on specific nodes, transaction patterns, confidence scoring, or suggest investigative next steps — just ask.`;
}

function getSuggestedPrompts(c: typeof cases[0]): string[] {
  return [
    `What's the basis for the ${c.confidence}% confidence score?`,
    "What actions should I take on this case?",
    `Which entities in this network are highest risk?`,
  ];
}

function MessageContent({ content }: { content: string }) {
  return (
    <>
      {content.split("\n\n").map((para, i) => (
        <p key={i} className={`text-[length:inherit] leading-[inherit] ${i > 0 ? "mt-2" : ""}`}>
          {para.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j}>{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      ))}
    </>
  );
}

// ─── Badge maps ───────────────────────────────────────────────────────────────

const riskBadgeLight:  Record<string,string> = { Critical:"bg-red-50 text-red-700 border border-red-200", High:"bg-orange-50 text-orange-700 border border-orange-200", Medium:"bg-amber-50 text-amber-700 border border-amber-200" };
const riskBadgeDark:   Record<string,string> = { Critical:"bg-red-500/15 text-red-300 border border-red-500/25", High:"bg-orange-500/15 text-orange-400 border border-orange-500/25", Medium:"bg-amber-500/15 text-amber-400 border border-amber-500/25" };
const statusBadgeLight:Record<string,string> = { "Under review":"bg-amber-50 text-amber-700 border border-amber-200", "In progress":"bg-blue-50 text-blue-700 border border-blue-200", "New":"bg-gray-50 text-gray-600 border border-gray-200" };
const statusBadgeDark: Record<string,string> = { "Under review":"bg-amber-500/15 text-amber-400 border border-amber-500/25", "In progress":"bg-blue-500/15 text-blue-400 border border-blue-500/25", "New":"bg-white/[0.06] text-gray-400 border border-white/[0.10]" };
const riskDotColor:    Record<string,string> = { Critical:"bg-red-500", High:"bg-orange-400", Medium:"bg-amber-400" };
const riskTextColor:   Record<string,string> = { Critical:"text-red-400", High:"text-orange-400", Medium:"text-amber-400" };

const navItems = [
  { icon: Inbox,    label: "All Cases", active: true },
  { icon: Users,    label: "Teams"                   },
  { icon: FileText, label: "Reports"                 },
];

const sources = [
  { label: "OFAC (SDN)",    count: 48, pct: 100 },
  { label: "UN Sanctions",  count: 32, pct: 67  },
  { label: "PEP Lists",     count: 28, pct: 58  },
  { label: "Interpol",      count: 18, pct: 38  },
  { label: "Adverse Media", count: 16, pct: 33  },
];

// ─── ResizeHandle ─────────────────────────────────────────────────────────────

function ResizeHandle({ onDelta, dark, alwaysShow, onClick }: { onDelta: (dx: number) => void; dark: boolean; alwaysShow?: boolean; onClick?: () => void }) {
  const [shown, setShown]   = useState(false);
  const dragging             = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    setShown(true);
    let prev = e.clientX;
    let moved = false;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - prev;
      if (Math.abs(dx) > 2) moved = true;
      onDelta(dx);
      prev = ev.clientX;
    };
    const onUp = () => {
      dragging.current = false;
      setShown(false);
      if (!moved && onClick) onClick();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  return (
    <div
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => { if (!dragging.current) setShown(false); }}
      onMouseDown={onMouseDown}
      style={{ position: "absolute", inset: 0, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div style={{
        width: 2,
        height: (shown || alwaysShow) ? (alwaysShow && !shown ? 80 : 48) : 0,
        borderRadius: 4,
        background: dark ? "rgba(139,92,246,0.85)" : "rgba(99,102,241,0.65)",
        boxShadow: (shown || alwaysShow) ? "0 0 12px rgba(99,102,241,0.55)" : "none",
        opacity: alwaysShow && !shown ? 0.4 : 1,
        transition: "height 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── CaseListItem ─────────────────────────────────────────────────────────────

function CaseListItem({ item, selected, onClick, darkMode, pinned }: {
  item: typeof cases[0]; selected: boolean; onClick: () => void; darkMode: boolean; pinned?: boolean;
}) {
  const dm = (l: string, d: string) => darkMode ? d : l;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 transition-colors border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
        selected ? dm("bg-indigo-50/80", "bg-indigo-500/10") : dm("hover:bg-white/40", "hover:bg-white/[0.05]")
      }`}
      style={{ borderColor: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-2">
          <span className={`h-1.5 w-1.5 rounded-full block ${item.unread ? "bg-indigo-500" : "bg-transparent"}`} />
        </div>
        <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
          <AvatarFallback className={`text-[10px] font-bold ${darkMode ? item.colorDark : item.colorLight}`}>
            {item.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <span className={`text-xs truncate ${item.unread
              ? `font-semibold ${dm("text-gray-900","text-white")}`
              : `font-medium ${dm("text-gray-700","text-slate-200")}`}`}>
              {item.customerName}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {pinned && <Pin className={`h-2.5 w-2.5 fill-current ${dm("text-indigo-500","text-indigo-400")}`} />}
              <span className={`text-[10px] tabular-nums ${dm("text-gray-400","text-gray-500")}`}>{item.time}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[11px] truncate ${dm("text-gray-500","text-gray-400")}`}>
              ↔ <span className="font-medium">{item.watchlistName}</span>
            </span>
            <span className={`text-[10px] font-semibold ml-auto flex-shrink-0 ${riskTextColor[item.risk]}`}>{item.confidence}%</span>
          </div>
          <p className={`text-[10px] ${dm("text-gray-400","text-gray-500")}`}>
            {item.matchCount} total matches
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [collapsed, setCollapsed]           = useState(true);
  const [darkMode, setDarkMode]             = useState(true);
  const [caseListOpen, setCaseListOpen]     = useState(true);
  const [caseListWidth, setCaseListWidth]   = useState(288);
  const [chatPanelWidth, setChatPanelWidth] = useState(380);
  const [chatCollapsed, setChatCollapsed]   = useState(false);
  const [pinnedCaseIds, setPinnedCaseIds]   = useState<Set<number>>(new Set());
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseTab, setCaseTab]               = useState<"overview"|"details"|"audit">("overview");
  const [dispositionSubmitted, setDispositionSubmitted] = useState(false);
  const [chatInput, setChatInput]           = useState("");
  const [chatMessages, setChatMessages]     = useState<ChatMsg[]>([]);
  const [comparisonNode, setComparisonNode] = useState<FraudNode | null>(null);
  const [rightPaneOpen, setRightPaneOpen] = useState(true);
  const [rightPaneWidth, setRightPaneWidth] = useState(296);
  const [caseFilter, setCaseFilter] = useState<"all" | "unread" | "high" | "medium" | "low">("all");
  const [dispositionChoice, setDispositionChoice] = useState<"false-positive" | "true-hit-high" | "true-hit-medium" | null>(null);
  const [trueHitStep, setTrueHitStep] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifsRead, setNotifsRead] = useState<number[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [dispositionComment, setDispositionComment] = useState("");
  const [adverseDetail, setAdverseDetail]     = useState<{ outlet: string; date: string; headline: string } | null>(null);
  const [adverseArticleIdx, setAdverseArticleIdx] = useState(0);
  const [aiGuidanceStep, setAiGuidanceStep]   = useState<'overview'|'identity'|'sources'|'adverse-news'|'network'|'complete'>('overview');
  const [reviewState, setReviewState]         = useState({ identityReviewed: false, watchlistReviewed: false, adverseNewsReviewed: false, networkReviewed: false });
  const [accordionValue, setAccordionValue]   = useState<string[]>([]);
  const [pulseSection, setPulseSection]       = useState<string|null>(null);
  const [adverseSearchState, setAdverseSearchState] = useState<'idle'|'loading'|'complete'>('idle');
  const [searchOpen, setSearchOpen]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState("");
  const chatEndRef                            = useRef<HTMLDivElement>(null);
  const searchInputRef                        = useRef<HTMLInputElement>(null);
  const typeoutRef                            = useRef<ReturnType<typeof setInterval> | null>(null);

  const dm           = (l: string, d: string) => darkMode ? d : l;
  const selectedCase = cases.find(c => c.id === selectedCaseId) ?? null;
  const unreadCount  = cases.filter(c => c.unread).length;
  const filteredCases = cases.filter(c =>
    !searchQuery.trim() ||
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.watchlistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.watchlistSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.indicators.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Populate chat when case changes
  useEffect(() => {
    if (selectedCase) {
      setChatMessages(getInitialMessages(selectedCase));
      setChatInput("");
      setCaseTab("overview");
      setDispositionChoice(null);
      setTrueHitStep(false);
      setRegenerating(false);
      setDispositionComment("");
      setDispositionSubmitted(false);
      setAdverseDetail(null);
      setAiGuidanceStep('overview');
      setReviewState({ identityReviewed: false, watchlistReviewed: false, adverseNewsReviewed: false, networkReviewed: false });
      setAccordionValue([]);
      setPulseSection(null);
      setAdverseSearchState('idle');
      const caseNodes = CASE_NODES[selectedCaseId as number] ?? [];
      const defaultNode = caseNodes.find((n: FraudNode) => n.risk === "critical") ?? caseNodes.find((n: FraudNode) => n.risk === "high") ?? caseNodes[0] ?? null;
      setComparisonNode(defaultNode);
      setRightPaneOpen(true);
    }
  }, [selectedCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Clear pulse highlight after animation
  useEffect(() => {
    if (!pulseSection) return;
    const t = setTimeout(() => setPulseSection(null), 1400);
    return () => clearTimeout(t);
  }, [pulseSection]);

  // ⌘K shortcut to open spotlight search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchQuery("");
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Auto-focus search input when spotlight opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 60);
  }, [searchOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim() || !selectedCase) return;
    const caseSnap = selectedCase;
    setChatMessages(prev => [...prev, { role: "user", content: text }]);
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: "ai",
        content: getSimulatedResponse(text, caseSnap),
      }]);
    }, 600);
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatCollapsed(false);
    sendMessage(chatInput);
    setChatInput("");
  };

  // ── AI copilot actions ──
  const handleReviewIdentity = () => {
    const nodes = selectedCase ? (CASE_NODES[selectedCase.id] ?? []) : [];
    const strongest = nodes.length > 0 ? nodes.reduce((b, n) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b, nodes[0]) : null;
    if (strongest) { setAdverseDetail(null); setComparisonNode(strongest); }
    setAccordionValue(['identifiers']);
    setPulseSection('identifiers');
    setReviewState(s => ({ ...s, identityReviewed: true }));
    setAiGuidanceStep('identity');
    const reasoning = {
      phases: ['Analyzing identifiers', 'Cross-referencing watchlist', 'Scoring fields'],
      thoughts: [
        'Comparing name phonetics and transliterations across scripts…',
        'Matching date of birth, nationality, and jurisdiction overlap…',
        'Calculating weighted field similarity score…',
      ],
      tasks: [
        { title: 'Load identity fields', description: 'Reading customer profile identifiers', status: 'completed' as const },
        { title: 'Compare against watchlist record', description: 'Field-by-field similarity scoring', status: 'in-progress' as const },
        { title: 'Score match confidence', description: 'Applying weighted scoring model', status: 'pending' as const },
      ],
    };
    setChatMessages(prev => [...prev, { role: 'user' as const, content: 'Review identifiers' }]);
    setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', reasoning }]);
    setTimeout(() => {
      setChatMessages(prev => prev.map(m => m.reasoning && !m.reasoning.done ? { ...m, reasoning: { ...m.reasoning, done: true } } : m));
      setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', copilotStep: 'identity' as const }]);
    }, 4500);
  };
  const handleTriggerAdverseSearch = () => {
    setAdverseSearchState('loading');
    setAccordionValue(prev => [...new Set([...prev, 'sources'])]);
    setPulseSection('sources');
    setReviewState(s => ({ ...s, watchlistReviewed: true }));
    setAiGuidanceStep('sources');
    const reasoning = {
      phases: ['Querying news sources', 'Parsing articles', 'Extracting entities'],
      thoughts: [
        'Scanning GDELT, Reuters, and FT archives for entity mentions…',
        'Extracting named entities, dates, and jurisdiction references…',
        'Linking article entities to watchlist record…',
      ],
      tasks: [
        { title: 'Query adverse news database', description: 'Scanning 12 global news sources', status: 'completed' as const },
        { title: 'Parse and rank articles', description: 'Scoring relevance by entity match', status: 'in-progress' as const },
        { title: 'Extract corroborating identifiers', description: 'Pulling dates, aliases, and locations', status: 'pending' as const },
      ],
    };
    setChatMessages(prev => [...prev, { role: 'user' as const, content: 'Trigger adverse news search' }]);
    setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', reasoning }]);
    setTimeout(() => {
      setChatMessages(prev => prev.map(m => m.reasoning && !m.reasoning.done ? { ...m, reasoning: { ...m.reasoning, done: true } } : m));
      setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', copilotStep: 'sources' as const }]);
    }, 4000);
    setTimeout(() => {
      setAdverseSearchState('complete');
      setReviewState(s => ({ ...s, adverseNewsReviewed: true }));
    }, 5200);
  };
  const handleReviewAdverseNews = () => {
    setAdverseArticleIdx(0);
    setAdverseDetail(ADVERSE_ARTICLES[0]);
    setReviewState(s => ({ ...s, adverseNewsReviewed: true }));
    setAiGuidanceStep('adverse-news');
    const reasoning = {
      phases: ['Reading article', 'Extracting identifiers', 'Building recommendation'],
      thoughts: [
        'Parsing article content, publication date, and source credibility…',
        'Matching mentioned individuals and aliases to watchlist record…',
        'Weighing all evidence to form a disposition recommendation…',
      ],
      tasks: [
        { title: 'Parse article content', description: 'Reuters — 2025-03-12', status: 'completed' as const },
        { title: 'Extract corroborating identifiers', description: 'Names, aliases, dates, jurisdictions', status: 'in-progress' as const },
        { title: 'Generate disposition recommendation', description: 'Applying risk scoring model', status: 'pending' as const },
      ],
    };
    setChatMessages(prev => [...prev, { role: 'user' as const, content: 'Review adverse news' }]);
    setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', reasoning }]);
    setTimeout(() => {
      setChatMessages(prev => prev.map(m => m.reasoning && !m.reasoning.done ? { ...m, reasoning: { ...m.reasoning, done: true } } : m));
      setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', copilotStep: 'adverse-news' as const }]);
    }, 4500);
  };
  const handleShowRelationship = () => {
    setAdverseDetail(null);
    const nodes = selectedCase ? (CASE_NODES[selectedCase.id] ?? []) : [];
    const relNode = nodes.find(n => n.label !== comparisonNode?.label && (n.risk === 'critical' || n.risk === 'high')) ?? nodes[1] ?? null;
    if (relNode) { setComparisonNode(relNode); setAccordionValue([]); }
    setReviewState(s => ({ ...s, networkReviewed: true }));
    setAiGuidanceStep('network');
    setChatMessages(prev => [...prev, { role: 'user' as const, content: 'Show network relationship' }]);
    setTimeout(() => setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', copilotStep: 'network' as const }]), 400);
  };
  const handleApplyRecommendation = () => {
    setAdverseDetail(null);
    setTrueHitStep(true);
    setDispositionChoice('true-hit-high');
    setPulseSection('disposition');
    setAiGuidanceStep('complete');
    setChatMessages(prev => [...prev, { role: 'user' as const, content: 'Apply recommendation' }]);
    setTimeout(() => setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', copilotStep: 'complete' as const }]), 400);
  };

  const panelStyle = {
    background: darkMode ? "rgba(10,8,22,0.08)" : "rgba(255,255,255,0.10)",
    border: `1px solid ${darkMode ? "rgba(255,255,255,0.11)" : "rgba(99,102,241,0.18)"}`,
    boxShadow: darkMode
      ? "0 4px 40px rgba(0,0,0,0.65)"
      : "0 4px 28px rgba(99,102,241,0.06)",
  };

  const innerCardStyle = {
    border: `1px solid ${darkMode ? "rgba(255,255,255,0.11)" : "rgba(99,102,241,0.16)"}`,
    background: darkMode ? "rgba(28,22,52,0.72)" : "#ffffff",
    backdropFilter: darkMode ? "blur(36px) saturate(2.2) brightness(0.88)" : "none",
    WebkitBackdropFilter: darkMode ? "blur(36px) saturate(2.2) brightness(0.88)" : "none",
    boxShadow: darkMode
      ? "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.06)"
      : "0 1px 8px rgba(99,102,241,0.06), 0 0 0 0.5px rgba(99,102,241,0.10)",
  };

  const barStyle = {
    borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(99,102,241,0.12)"}`,
    background: darkMode ? "rgba(10,8,22,0.30)" : "rgba(255,255,255,0.30)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  };

  const chatPanelStyle = {
    background: darkMode ? "rgba(8,6,22,0.36)" : "rgba(255,255,255,0.45)",
    backdropFilter: "blur(48px) saturate(2.2) brightness(0.92)",
    WebkitBackdropFilter: "blur(48px) saturate(2.2) brightness(0.92)",
    borderLeft: `1px solid ${darkMode ? "rgba(139,92,246,0.18)" : "rgba(99,102,241,0.20)"}`,
    boxShadow: darkMode
      ? "inset 1px 0 0 rgba(139,92,246,0.12), -4px 0 32px rgba(0,0,0,0.35)"
      : "inset 1px 0 0 rgba(99,102,241,0.10), -4px 0 24px rgba(99,102,241,0.06)",
  };

  const caseNodes    = selectedCase ? (CASE_NODES[selectedCase.id] ?? []) : [];
  const critNodes    = caseNodes.filter(n => n.risk === "critical").length;
  const highNodes    = caseNodes.filter(n => n.risk === "high").length;
  const strongestNode = caseNodes.length > 0 ? caseNodes.reduce((b, n) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b, caseNodes[0]) : null;

  const riskInlineColor: Record<string,string> = {
    Critical: "#f87171", High: "#fb923c", Medium: "#fbbf24", Low: "#4ade80",
  };

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden px-3 pb-3 pt-2 gap-2 relative"
      style={{
        background: darkMode
          ? "linear-gradient(155deg,#1e1340 0%,#160f32 35%,#110c26 65%,#0c081c 100%)"
          : "linear-gradient(135deg,#f4f2fa 0%,#eef1fb 40%,#f0edf9 70%,#eaf3f8 100%)",
      }}
    >
      {/* ── Spotlight search overlay ── */}
      {searchOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(4,2,14,0.68)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: "16vh",
          }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 560, margin: "0 16px",
              background: darkMode ? "rgba(12,9,26,0.98)" : "rgba(255,255,255,0.98)",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)"}`,
              borderRadius: 16,
              boxShadow: darkMode
                ? "0 32px 96px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(99,102,241,0.18)"
                : "0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(99,102,241,0.12)",
              overflow: "hidden",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "13px 16px",
              borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
            }}>
              <Search style={{ width: 15, height: 15, flexShrink: 0, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.30)" }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for a customer, entity, or case..."
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 13.5, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)",
                  caretColor: "#818cf8",
                }}
                onKeyDown={e => {
                  if (e.key === "Escape") setSearchOpen(false);
                  if (e.key === "Enter" && filteredCases.length > 0) {
                    setSelectedCaseId(filteredCases[0].id);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
              />
              <kbd style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 5, flexShrink: 0, lineHeight: "18px",
                background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                border: `1px solid ${darkMode ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.09)"}`,
                color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.32)",
                fontFamily: "inherit",
              }}>esc</kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {/* Cases */}
              {filteredCases.length > 0 ? (
                <>
                  <div style={{
                    padding: "10px 16px 4px",
                    fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
                    color: darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.32)",
                  }}>Recent Cases</div>
                  {filteredCases.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCaseId(c.id); setSearchOpen(false); setSearchQuery(""); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "9px 16px", textAlign: "left",
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "inherit",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800,
                        background: darkMode
                          ? c.colorDark.includes("indigo") ? "rgba(99,102,241,0.22)" : c.colorDark.includes("violet") ? "rgba(139,92,246,0.22)" : c.colorDark.includes("sky") ? "rgba(56,189,248,0.18)" : c.colorDark.includes("amber") ? "rgba(251,191,36,0.18)" : "rgba(251,113,133,0.18)"
                          : c.colorLight.includes("indigo") ? "rgba(99,102,241,0.12)" : c.colorLight.includes("violet") ? "rgba(139,92,246,0.12)" : c.colorLight.includes("sky") ? "rgba(56,189,248,0.12)" : c.colorLight.includes("amber") ? "rgba(251,191,36,0.12)" : "rgba(251,113,133,0.12)",
                        color: darkMode
                          ? c.colorDark.includes("indigo") ? "#a5b4fc" : c.colorDark.includes("violet") ? "#c4b5fd" : c.colorDark.includes("sky") ? "#7dd3fc" : c.colorDark.includes("amber") ? "#fcd34d" : "#fda4af"
                          : c.colorLight.includes("indigo") ? "#4f46e5" : c.colorLight.includes("violet") ? "#7c3aed" : c.colorLight.includes("sky") ? "#0284c7" : c.colorLight.includes("amber") ? "#d97706" : "#e11d48",
                      }}>
                        {c.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{c.customerName}</div>
                        <div style={{
                          fontSize: 11, marginTop: 1,
                          color: darkMode ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.40)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>↔ {c.watchlistName} · {c.watchlistSource}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: riskInlineColor[c.risk] ?? "#94a3b8" }}>{c.risk.toUpperCase()}</span>
                        <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)" }}>{c.confidence}% match</span>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div style={{
                  padding: "40px 16px", textAlign: "center",
                  fontSize: 13, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.32)",
                }}>
                  No results for &ldquo;{searchQuery}&rdquo;
                </div>
              )}

              {/* Quick actions */}
              {!searchQuery.trim() && (
                <>
                  <div style={{
                    padding: "10px 16px 4px",
                    fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
                    color: darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.32)",
                  }}>Quick Actions</div>
                  {[
                    { icon: <Sun style={{ width: 14, height: 14 }} />, label: "Toggle dark / light mode", action: () => { setDarkMode(d => !d); setSearchOpen(false); } },
                    { icon: <Inbox style={{ width: 14, height: 14 }} />, label: "View all cases", action: () => setSearchOpen(false) },
                    { icon: <Settings style={{ width: 14, height: 14 }} />, label: "Open settings", action: () => setSearchOpen(false) },
                  ].map(({ icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "9px 16px", textAlign: "left",
                        background: "transparent", border: "none", cursor: "pointer",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                        color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
                      }}>{icon}</div>
                      <span style={{
                        fontSize: 13, color: darkMode ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.70)",
                      }}>{label}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Bottom spacer */}
              <div style={{ height: 6 }} />
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none" style={{ zIndex:0, opacity: darkMode ? 0.15 : 0.12 }}>
        <ColorBends
          colors={darkMode ? ["#7c3aed","#a855f7","#4f46e5"] : ["#6366f1","#818cf8","#8b5cf6"]}
          rotation={90} speed={0.15} bandWidth={6} intensity={darkMode ? 1.2 : 1.5}
          transparent warpStrength={1} mouseInfluence={0.3} noise={0} frequency={1} iterations={1}
        />
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex:0, background: darkMode ? "rgba(10,7,22,0.45)" : "rgba(245,243,252,0.60)" }} />

      {/* Top bar card */}
      <div className="flex-shrink-0 rounded-2xl flex items-center px-4 py-1.5 relative" style={{ zIndex:2, ...panelStyle, boxShadow:"none", border:"none" }}>
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShieldAlert className={`h-4 w-4 ${dm("text-gray-900","text-indigo-400")}`} />
          <span className={`text-sm font-bold tracking-tight uppercase ${dm("text-gray-900","text-slate-100")}`}>Casework</span>
        </div>

        <div className="flex-1" />

        {/* Right cluster */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          <button
            onClick={() => { setSearchQuery(""); setSearchOpen(true); }}
            className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2.5 transition-colors ${dm("text-gray-400 bg-gray-50 border border-gray-200 hover:border-gray-300","text-gray-400 border hover:border-white/20 hover:text-gray-300")}`}
            style={darkMode ? { background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.10)" } : {}}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Search for a customer, entity, or case...</span>
            <kbd className={`text-[10px] rounded px-1 flex-shrink-0 ${dm("bg-white border border-gray-200 text-gray-300","text-gray-600 border border-white/10")}`} style={darkMode ? { background:"rgba(255,255,255,0.06)" } : {}}>⌘K</kbd>
          </button>

          {/* Bell + Notifications popover */}
          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => setNotifOpen(o => !o)}
              className={`relative p-1.5 rounded-md transition-colors ${dm("text-gray-400 hover:text-gray-700","text-gray-500 hover:text-gray-300")}`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {notifsRead.length < 2 && (
                <span aria-hidden="true" className="absolute top-0.5 right-0.5 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </button>

            {notifOpen && (
              <>
                {/* backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                {/* panel */}
                <div
                  className="absolute right-0 top-8 z-50 w-80 rounded-xl shadow-2xl overflow-hidden"
                  style={{
                    background: darkMode ? "rgba(15,14,30,0.97)" : "rgba(255,255,255,0.98)",
                    border: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}`,
                    backdropFilter: "blur(16px)",
                  }}
                >
                  {/* header */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}>Notifications</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setNotifsRead([0,1,2,3,4])}
                        style={{ fontSize: 11, color: "#818cf8", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                      >
                        Mark all read
                      </button>
                      <Settings style={{ width: 13, height: 13, color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.30)", cursor: "pointer" }} />
                    </div>
                  </div>

                  {/* body */}
                  <div style={{ maxHeight: 420, overflowY: "auto" }}>
                    {/* TODAY */}
                    <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)", textTransform: "uppercase" }}>Today</div>
                    {[
                      { id: 0, title: "New match detected", body: "Li Bin matched against OFAC SDN", time: "12 min ago", action: "View case →", unread: true },
                      { id: 1, title: "Investigation assigned to you", body: "Rahman Mohammad Mizanur", time: "1 hr ago", action: "Open →", unread: true },
                      { id: 2, title: "AI analysis completed", body: "8 new sources analysed for Li Bin", time: "2 hr ago", action: "View results →", unread: false },
                    ].map(n => (
                      <div
                        key={n.id}
                        onClick={() => setNotifsRead(r => r.includes(n.id) ? r : [...r, n.id])}
                        style={{
                          display: "flex", gap: 10, padding: "10px 16px",
                          borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                          cursor: "pointer",
                          background: !notifsRead.includes(n.id) && n.unread
                            ? (darkMode ? "rgba(129,140,248,0.04)" : "rgba(129,140,248,0.04)")
                            : "transparent",
                        }}
                      >
                        <div style={{ paddingTop: 5, flexShrink: 0 }}>
                          <span style={{
                            display: "block", width: 7, height: 7, borderRadius: "50%",
                            background: !notifsRead.includes(n.id) && n.unread ? "#818cf8" : "transparent",
                          }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)", marginBottom: 1 }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", marginBottom: 4 }}>{n.body}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.30)" }}>{n.time}</span>
                            <button style={{ fontSize: 11, color: "#818cf8", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>{n.action}</button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* EARLIER */}
                    <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)", textTransform: "uppercase" }}>Earlier</div>
                    {[
                      { id: 3, title: "Watchlist data updated", body: "World-Check source refreshed", time: "Yesterday" },
                      { id: 4, title: "Case closed", body: "Ibrahim Al-Rashid — False positive", time: "2 days ago" },
                    ].map(n => (
                      <div
                        key={n.id}
                        style={{
                          display: "flex", gap: 10, padding: "10px 16px",
                          borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                          cursor: "default",
                        }}
                      >
                        <div style={{ paddingTop: 5, flexShrink: 0 }}>
                          <span style={{ display: "block", width: 7, height: 7, borderRadius: "50%", background: "transparent" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", marginBottom: 1 }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", marginBottom: 4 }}>{n.body}</div>
                          <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.25)" }}>{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 border-none bg-transparent">
              <Avatar className="h-7 w-7">
                <AvatarFallback className={`text-xs font-semibold ${dm("bg-gray-900 text-white","bg-indigo-600 text-white")}`}>VT</AvatarFallback>
              </Avatar>
              <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 ${dm("text-gray-400","text-gray-500")}`} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              style={darkMode ? {
                background: "rgba(18,14,36,0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(226,232,240,1)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              } : {}}
            >
              <div className={`px-2 py-1.5 flex flex-col gap-0.5 ${dm("","border-b border-white/[0.08]")}`}>
                <span className={`text-sm font-medium ${dm("text-gray-900","text-slate-100")}`}>Ruby Tan</span>
                <span className={`text-xs ${dm("text-gray-500","text-gray-400")}`}>ruby.tan@accenture.com</span>
              </div>
              <DropdownMenuSeparator style={darkMode ? { background: "rgba(255,255,255,0.08)" } : {}} />
              <DropdownMenuItem
                className="gap-2"
                style={darkMode ? { color:"rgba(226,232,240,1)" } : {}}
                onMouseEnter={e => darkMode && (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                onMouseLeave={e => darkMode && (e.currentTarget.style.background = "transparent")}
              >
                <User className="h-3.5 w-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                style={darkMode ? { color:"rgba(226,232,240,1)" } : {}}
                onMouseEnter={e => darkMode && (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                onMouseLeave={e => darkMode && (e.currentTarget.style.background = "transparent")}
              >
                <Settings className="h-3.5 w-3.5" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator style={darkMode ? { background: "rgba(255,255,255,0.08)" } : {}} />
              <DropdownMenuItem
                className="gap-2"
                style={{ color: "rgb(239,68,68)" }}
                onMouseEnter={e => darkMode && (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                onMouseLeave={e => darkMode && (e.currentTarget.style.background = "transparent")}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main row */}
      <div className="flex-1 flex gap-2 overflow-hidden relative" style={{ zIndex:1 }}>

      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col py-2 px-2 gap-0.5 overflow-y-auto overflow-x-hidden transition-all duration-200"
        style={{ width: collapsed ? 48 : 224, position:"relative", zIndex:1 }}
      >
        <div className={`flex items-center py-2 mb-1 ${collapsed ? "justify-center" : "justify-between px-2"}`}>
          {!collapsed && (
            <button className={`flex items-center gap-2 text-sm font-semibold min-w-0 ${dm("text-gray-900","text-slate-100")}`}>
              <span className={`h-4 w-4 rounded-full flex-shrink-0 ${dm("bg-gray-900","bg-indigo-400")}`} />
              <span className="truncate">SLTeam</span>
              <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`transition-colors flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${dm("text-gray-400 hover:text-gray-700","text-gray-500 hover:text-gray-300")}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {navItems.map(({ icon: Icon, label, active }) => (
          <button key={label} aria-label={collapsed ? label : undefined}
            onClick={() => { if (label === "All Cases") { setCaseListOpen(true); setCaseListWidth(288); } }}
            className={`flex items-center rounded-md text-sm w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              collapsed ? "justify-center p-2" : "gap-2.5 px-2 py-1.5 text-left"
            } ${active
              ? dm("bg-white/60 text-gray-900 font-medium shadow-sm","text-white font-medium")
              : dm("text-gray-600 hover:text-gray-900 hover:bg-white/40","text-gray-400 hover:text-gray-100 hover:bg-white/[0.07]")
            }`}
            style={active && darkMode ? { background:"rgba(255,255,255,0.14)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08)" } : {}}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}

        <div className="mt-auto pt-4">
          <button onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to night mode"}
            className={`flex items-center rounded-md text-sm w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              collapsed ? "justify-center p-2" : "gap-2.5 px-2 py-1.5"
            } ${dm("text-gray-400 hover:text-gray-700 hover:bg-white/40","text-gray-400 hover:text-gray-100 hover:bg-white/[0.07]")}`}
          >
            {darkMode ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
            {!collapsed && <span className="truncate">{darkMode ? "Light mode" : "Night mode"}</span>}
          </button>
        </div>
      </aside>

      {/* Case list panel */}
      <div
        className="flex-shrink-0 transition-all duration-200 overflow-hidden rounded-lg"
        style={{ width: caseListOpen ? caseListWidth : 6, position:"relative", zIndex:1, ...(caseListOpen ? panelStyle : {}) }}
      >
        <div className="h-full flex flex-col overflow-hidden" style={{ width: caseListWidth }}>

          <div className="flex items-center justify-between px-4 flex-shrink-0" style={{ ...barStyle, height: 46, minHeight: 46 }}>
            <div className="flex items-center gap-2">
              <Inbox className={`h-3.5 w-3.5 ${dm("text-gray-500","text-gray-400")}`} />
              <span className={`text-sm font-semibold ${dm("text-gray-900","text-slate-100")}`}>All Cases</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${dm("bg-indigo-100 text-indigo-700","bg-indigo-500/20 text-indigo-300")}`}>
                {cases.length}
              </span>
              {unreadCount > 0 && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${dm("bg-amber-50 text-amber-700 border border-amber-200","bg-amber-500/15 text-amber-400 border border-amber-500/25")}`}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={() => setCaseListOpen(false)}
              aria-label="Hide case list"
              className={`p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${dm("text-gray-400 hover:text-gray-700 hover:bg-white/40","text-gray-500 hover:text-gray-300 hover:bg-white/[0.07]")}`}
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Filter pills */}
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto flex-shrink-0 no-scrollbar" style={{ borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
            {([ ["all","All"], ["unread","Unread"], ["high","High Match"], ["medium","Medium Match"], ["low","Low Match"] ] as const).map(([key, label]) => {
              const active = caseFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setCaseFilter(key)}
                  className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                  style={{
                    background: active
                      ? (darkMode ? "rgba(99,102,241,0.30)" : "rgba(99,102,241,0.15)")
                      : (darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                    color: active
                      ? (darkMode ? "rgb(165,180,252)" : "rgb(79,70,229)")
                      : (darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)"),
                    border: active
                      ? `1px solid ${darkMode ? "rgba(99,102,241,0.45)" : "rgba(99,102,241,0.35)"}`
                      : `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {(() => {
              const filtered = cases.filter(c => {
                if (caseFilter === "unread")  return c.unread;
                if (caseFilter === "high")    return c.confidence >= 75;
                if (caseFilter === "medium")  return c.confidence >= 50 && c.confidence < 75;
                if (caseFilter === "low")     return c.confidence < 50;
                return true;
              });
              const pinned   = filtered.filter(c => pinnedCaseIds.has(c.id));
              const unpinned = filtered.filter(c => !pinnedCaseIds.has(c.id));
              return (
                <>
                  {pinned.length > 0 && (
                    <>
                      <div className={`px-3 pt-2.5 pb-1 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 ${dm("text-gray-400","text-gray-600")}`}>
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </div>
                      {pinned.map(c => (
                        <CaseListItem key={c.id} item={c} pinned selected={selectedCaseId === c.id}
                          onClick={() => setSelectedCaseId(c.id === selectedCaseId ? null : c.id)} darkMode={darkMode} />
                      ))}
                      <div className={`mx-3 my-1 border-t ${dm("border-gray-100","border-white/[0.06]")}`} />
                    </>
                  )}
                  {unpinned.map(c => (
                    <CaseListItem key={c.id} item={c} selected={selectedCaseId === c.id}
                      onClick={() => setSelectedCaseId(c.id === selectedCaseId ? null : c.id)} darkMode={darkMode} />
                  ))}
                </>
              );
            })()}
          </div>
        </div>
        {/* Cases panel resize / expand handle — always present */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, zIndex: 10 }}>
          <ResizeHandle
            alwaysShow={!caseListOpen}
            dark={darkMode}
            onClick={!caseListOpen ? () => { setCaseListOpen(true); setCaseListWidth(288); } : undefined}
            onDelta={dx => {
              if (!caseListOpen) {
                if (dx > 4) { setCaseListOpen(true); setCaseListWidth(288); }
              } else {
                setCaseListWidth(prev => {
                  const next = prev + dx;
                  if (next < 140) { setCaseListOpen(false); return prev; }
                  return Math.max(220, Math.min(480, next));
                });
              }
            }}
          />
        </div>
      </div>

      {/* Main card */}
      <div
        className="flex-1 rounded-lg flex flex-col overflow-hidden relative transition-colors duration-300"
        style={{ position:"relative", zIndex:1, ...panelStyle }}
      >
        {/* Case metadata bar */}
        {selectedCase && (() => {
          const isPinned = pinnedCaseIds.has(selectedCase.id);
          const togglePin = () => setPinnedCaseIds(prev => {
            const next = new Set(prev);
            if (next.has(selectedCase.id)) next.delete(selectedCase.id); else next.add(selectedCase.id);
            return next;
          });
          return (
            <div className="flex items-center gap-0 flex-shrink-0 px-4 overflow-hidden" style={{
              ...barStyle,
              borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              height: 46,
              minHeight: 46,
            }}>
              {/* Pin */}
              <button
                onClick={togglePin}
                title={isPinned ? "Unpin case" : "Pin case"}
                className={`flex-shrink-0 p-1.5 rounded transition-colors mr-2 ${isPinned
                  ? dm("text-indigo-600","text-indigo-400")
                  : dm("text-gray-400 hover:text-gray-600","text-gray-500 hover:text-gray-300")}`}
              >
                <Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
              </button>

              {/* Customer name */}
              <span className={`text-xs font-semibold flex-shrink-0 ${dm("text-gray-800","text-slate-200")}`}>
                {selectedCase.customerName}
              </span>

              {/* Divider */}
              <span className={`mx-2.5 flex-shrink-0 text-[10px] ${dm("text-gray-300","text-gray-600")}`}>·</span>

              {/* Risk badge */}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ml-1.5 flex-shrink-0 ${dm(riskBadgeLight[selectedCase.risk] ?? "", riskBadgeDark[selectedCase.risk] ?? "")}`}>
                {selectedCase.risk}
              </span>

              {/* Confidence */}
              <span className={`text-[10px] font-semibold ml-1.5 flex-shrink-0 ${
                selectedCase.confidence >= 90 ? dm("text-red-600","text-red-400") :
                selectedCase.confidence >= 70 ? dm("text-orange-500","text-orange-400") :
                dm("text-amber-600","text-amber-400")
              }`}>
                {selectedCase.confidence}%
              </span>

              {/* Divider */}
              <span className={`mx-2.5 flex-shrink-0 text-[10px] ${dm("text-gray-300","text-gray-600")}`}>·</span>

              {/* Key indicators — truncated */}
              <span className={`text-[11px] truncate min-w-0 ${dm("text-gray-400","text-gray-500")}`}>
                {selectedCase.indicators}
              </span>

              {/* Time — right edge */}
              <span className={`text-[10px] flex-shrink-0 ml-auto pl-4 tabular-nums ${dm("text-gray-400","text-gray-600")}`}>
                {selectedCase.time}
              </span>
            </div>
          );
        })()}

        {/* Top nav — only shown when a case is open */}
        {selectedCase && (
          <nav className="flex items-center justify-between px-5 py-3 flex-shrink-0 relative" style={{ ...barStyle, zIndex:2 }}>
            <div className="flex items-center gap-4">
              {[
                { key:"overview",  label:"Overview" },
                { key:"details",   label:"Customer Details" },
                { key:"audit",     label:"Audit Trail" },
              ].map(({ key, label }) => {
                const active = caseTab === key;
                return (
                  <button key={key}
                    onClick={() => setCaseTab(key as typeof caseTab)}
                    className={`text-sm pb-0.5 relative transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      active
                        ? `font-medium ${dm("text-gray-900 after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-gray-900 after:rounded-full","text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-indigo-400 after:rounded-full")}`
                        : dm("text-gray-400 hover:text-gray-700","text-gray-500 hover:text-gray-300")
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Content */}
        <div
          className={`flex-1 relative ${selectedCase ? "overflow-hidden" : "overflow-y-auto"}`}
          style={{ zIndex:1 }}
        >
          {selectedCase ? (
            /* ── Case detail view ── */
            <>
              {/* ── Overview tab ── */}
              {caseTab === "overview" && <>
              {/* Fraud network canvas — full background */}
              <FraudNetworkCanvas
                centerLabel={selectedCase.customerName}
                centerSublabel={`${selectedCase.watchlistSource} · ${selectedCase.confidence}% match`}
                nodes={caseNodes}
                dark={darkMode}
                style={{ position:"absolute", inset:0 }}
                selectedNodeLabel={comparisonNode?.label}
                controlsRight={chatCollapsed ? 16 : chatPanelWidth + 16}
                onNodeClick={(node) => {
                  const isDisposed = node.risk === "medium" || node.risk === "low";
                  setAdverseDetail(null);
                  setReviewState(s => ({ ...s, networkReviewed: true }));
                  setComparisonNode(prev => prev?.label === node.label ? null : node);
                  if (isDisposed) {
                    setDispositionChoice("false-positive");
                    setTrueHitStep(false);
                    setDispositionSubmitted(false);
                    setDispositionComment(
                      `Match score of ${node.matchScore ?? 0}% falls below the review threshold. ` +
                      `Name similarity detected against ${node.sublabel ?? "the watchlist"}, however date of birth, ` +
                      `nationality, and identity document number do not align with the customer's verified records. ` +
                      `No beneficial ownership or transactional nexus identified. Assessed as a false positive — no further action required.`
                    );
                  }
                }}
              />

              {/* Node count badge — canvas layer, drawer overlays on top */}
              <div style={{
                position: "absolute", bottom: 16, left: rightPaneOpen ? rightPaneWidth + 12 : 16, zIndex: 10,
                fontSize: 9, padding: "3px 9px", borderRadius: 99, display: "flex", alignItems: "center", gap: 5,
                background: darkMode ? "rgba(9,7,22,0.72)" : "rgba(255,255,255,0.82)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                border: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}`,
                color: darkMode ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.50)",
                transition: "left 0.22s ease",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", flexShrink: 0 }} />
                {caseNodes.length} nodes
                {(critNodes + highNodes) > 0 && <span style={{ color: "#f87171", fontWeight: 600 }}>· {critNodes + highNodes} high-risk</span>}
              </div>

              {/* Shared prompt bar — fixed position, never moves */}
              <div style={{
                position: "absolute",
                zIndex: 20,
                right: 16,
                bottom: 16,
                width: chatPanelWidth - 32,
              }}>
                <div style={{
                  borderRadius: "9999px",
                  padding: "1.5px",
                  background: darkMode
                    ? "linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(139,92,246,0.55) 50%, rgba(99,102,241,0.95) 100%)"
                    : "linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.20) 50%, rgba(99,102,241,0.35) 100%)",
                  boxShadow: darkMode
                    ? "0 0 18px rgba(99,102,241,0.32), 0 0 42px rgba(99,102,241,0.12)"
                    : "0 0 12px rgba(99,102,241,0.10), 0 1px 4px rgba(99,102,241,0.08)",
                }}>
                  <div style={{
                    borderRadius: "9999px",
                    background: darkMode ? "rgba(10,8,20,0.94)" : "rgba(250,250,255,0.97)",
                    display: "flex", alignItems: "center",
                    paddingLeft: "16px", paddingRight: "6px",
                    paddingTop: "8px", paddingBottom: "8px", gap: "8px",
                  }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                      placeholder="Ask your Fraud Agent Anything"
                      className={`flex-1 bg-transparent text-sm focus:outline-none ${dm("text-gray-900 placeholder-gray-400","text-slate-200 placeholder-gray-600")}`}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!chatInput.trim()}
                      className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${chatInput.trim()
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : dm("bg-gray-200 text-gray-400","bg-white/10 text-gray-600")}`}
                      style={chatInput.trim() ? { boxShadow:"0 2px 10px rgba(99,102,241,0.4)" } : {}}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsed tab — only visible when panel is hidden */}
              {chatCollapsed && (
                <button
                  onClick={() => setChatCollapsed(false)}
                  title="Expand chat"
                  style={{
                    position: "absolute", top: "50%", transform: "translateY(-50%)", right: 0, zIndex: 20,
                    width: 28, height: 28, borderRadius: "6px 0 0 6px",
                    border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                    borderRight: "none",
                    background: darkMode ? "rgba(15,12,30,0.90)" : "rgba(245,244,255,0.95)",
                    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.40)",
                  }}
                >
                  <PanelLeftClose className="h-3 w-3" />
                </button>
              )}

              {/* AI chat panel — right overlay */}
              <div
                style={{ position:"absolute", top:0, right:0, bottom:0, width:chatCollapsed ? 0 : chatPanelWidth, zIndex:10, display:"flex", flexDirection:"column", overflow:"hidden", transition:"width 0.25s ease", ...(!chatCollapsed ? chatPanelStyle : {}) }}
              >
                {/* Panel header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px 10px 20px", flexShrink: 0,
                  borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.45)", letterSpacing: "0.04em" }}>
                    <Sparkles style={{ width: 12, height: 12 }} />
                    Ask AI
                  </span>
                  <button
                    onClick={() => setChatCollapsed(true)}
                    title="Collapse chat"
                    className={`p-1 rounded transition-colors ${dm("text-gray-400 hover:text-gray-600 hover:bg-gray-100", "text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]")}`}
                  >
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Chat area — single rolling conversation */}
                <div className="flex-1 overflow-y-auto px-5 py-5" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {chatMessages.map((msg, i) => {
                    const isLast = i === chatMessages.length - 1;

                    if (msg.role === "user") {
                      return (
                        <div key={i} className="flex justify-end">
                          <div
                            className={`leading-relaxed rounded-2xl px-3 py-2 max-w-[85%] ${dm("bg-indigo-600 text-white","bg-indigo-500/80 text-white")}`}
                            style={{ fontSize: 14 }}
                          >
                            <MessageContent content={msg.content} />
                          </div>
                        </div>
                      );
                    }

                    // ── AI message ────────────────────────────────────────
                    const thumbs = (
                      <div className="flex items-center gap-1 mt-2">
                        <button className={`p-1 rounded transition-colors ${dm("text-gray-300 hover:text-green-600 hover:bg-green-50","text-gray-600 hover:text-green-400 hover:bg-green-400/10")}`} title="Good response">
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button className={`p-1 rounded transition-colors ${dm("text-gray-300 hover:text-red-500 hover:bg-red-50","text-gray-600 hover:text-red-400 hover:bg-red-400/10")}`} title="Bad response">
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    );

                    // Reasoning (chain-of-thought) AI message
                    if (msg.reasoning) {
                      return (
                        <div key={i} className="w-full">
                          <AIReasoningLoader
                            phases={msg.reasoning.phases}
                            thoughts={msg.reasoning.thoughts}
                            tasks={msg.reasoning.tasks}
                            phaseDuration={2800}
                            dark={darkMode}
                            done={msg.reasoning.done}
                          />
                        </div>
                      );
                    }

                    // Regular (non-copilot) AI message
                    if (!msg.copilotStep) {
                      return (
                        <div key={i} className="w-full">
                          <div className={`leading-relaxed [&_p]:text-[14px] [&_p]:leading-snug [&_p]:mb-0 ${dm("text-gray-800","text-slate-300")}`} style={{ fontSize: 14 }}>
                            <MessageContent content={msg.content} />
                          </div>
                          {thumbs}
                        </div>
                      );
                    }

                    // Copilot AI message — renders rich step content
                    const aiColor = darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.65)";
                    const dimColor = darkMode ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.40)";
                    const btnStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#818cf8", background: "rgba(129,140,248,0.10)", border: "1px solid rgba(129,140,248,0.22)", borderRadius: 7, padding: "8px 14px", cursor: "pointer", marginTop: 4 };

                    return (
                      <div key={i} className="w-full [&_p]:text-[14px] [&_p]:leading-snug" style={{ fontSize: 14, color: aiColor, lineHeight: 1.65 }}>

                        {/* ── overview ── */}
                        {msg.copilotStep === "overview" && (<>
                          <p style={{ marginBottom: 12 }}>
                            I&apos;ve analyzed this case. The strongest watchlist match is{" "}
                            <strong style={{ color: darkMode ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.85)" }}>{strongestNode?.label ?? selectedCase.watchlistName}</strong>{" "}
                            on the{" "}
                            <strong style={{ color: darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>{strongestNode?.sublabel ?? selectedCase.watchlistSource}</strong>{" "}
                            list — <strong style={{ color: "#ef4444" }}>{strongestNode?.matchScore ?? selectedCase.confidence}% identity similarity</strong>.
                          </p>
                          {(() => {
                            const fields = strongestNode?.matchFields ?? [];
                            const matched = fields.filter(f => f.match);
                            if (matched.length === fields.length && fields.length > 0) {
                              return <p style={{ marginBottom: 12 }}>All {fields.length} identifiers match exactly — <span style={{ color: dimColor }}>{fields.map(f => f.field.toLowerCase()).join(", ")}</span>.</p>;
                            }
                            return <p style={{ marginBottom: 12 }}>{matched.length} of {fields.length} identifiers match — <span style={{ color: dimColor }}>{matched.map(f => f.field.toLowerCase()).join(", ")}</span>.</p>;
                          })()}
                          <p>
                            My initial assessment:{" "}
                            <strong style={{ color: selectedCase.confidence >= 85 ? "#ef4444" : selectedCase.confidence >= 65 ? "#f59e0b" : "#9ca3af" }}>
                              {selectedCase.confidence >= 85 ? "Likely True Hit" : selectedCase.confidence >= 65 ? "Probable True Hit" : "Possible Match"}
                            </strong>{" · "}
                            <strong style={{ color: selectedCase.confidence >= 85 ? "#ef4444" : selectedCase.confidence >= 65 ? "#f59e0b" : "#9ca3af" }}>
                              {selectedCase.confidence}%
                            </strong>
                          </p>
                          {isLast && (
                            <div style={{ marginTop: 16 }}>
                              <BorderBeamButton
                                type="button"
                                variant="outline"
                                beamSize="md"
                                colorVariant="colorful"
                                active={true}
                                onClick={handleReviewIdentity}
                                className="w-full justify-center rounded-lg font-semibold border-transparent"
                                style={{ height: 32, fontSize: 13, background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(250,249,255,0.95)", color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}
                              >
                                Review identifiers
                              </BorderBeamButton>
                            </div>
                          )}
                        </>)}

                        {/* ── identity ── */}
                        {msg.copilotStep === "identity" && (<>
                          <div style={{ marginBottom: 14 }}>
                            {(comparisonNode?.matchFields ?? []).map((f, fi, arr) => (
                              <div key={fi} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 6, padding: "5px 0", borderBottom: fi < arr.length - 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}` : "none" }}>
                                <span style={{ fontSize: 13, color: dimColor }}>{f.field}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: f.match ? "#4ade80" : "#f87171" }}>{f.match ? "Match" : "No match"}</span>
                              </div>
                            ))}
                          </div>
                          <p style={{ marginBottom: 12 }}>The identity evidence strongly supports the match. I can now search for corroborating adverse news sources.</p>
                          {isLast && (
                            <BorderBeamButton
                              type="button"
                              variant="outline"
                              beamSize="md"
                              colorVariant="colorful"
                              active={true}
                              onClick={handleTriggerAdverseSearch}
                              className="w-full justify-center rounded-lg font-semibold border-transparent"
                              style={{ height: 32, fontSize: 13, marginTop: 0, background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(250,249,255,0.95)", color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}
                            >
                              Trigger Adverse News Search
                            </BorderBeamButton>
                          )}
                        </>)}

                        {/* ── sources ── */}
                        {msg.copilotStep === "sources" && (<>
                          {adverseSearchState !== "loading" && (<>
                            <p style={{ marginBottom: 14 }}>
                              Found 2 adverse news articles referencing{" "}
                              <strong style={{ color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)" }}>{selectedCase.watchlistName}</strong>.
                              {" "}These may provide additional corroborating identifiers.
                            </p>
                            {isLast && (
                              <BorderBeamButton
                                type="button"
                                variant="outline"
                                beamSize="md"
                                colorVariant="colorful"
                                active={true}
                                onClick={handleReviewAdverseNews}
                                className="w-full justify-center rounded-lg font-semibold border-transparent"
                                style={{ height: 32, fontSize: 13, marginTop: 0, background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(250,249,255,0.95)", color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}
                              >
                                Review adverse news
                              </BorderBeamButton>
                            )}
                          </>)}
                        </>)}

                        {/* ── adverse-news → recommendation ── */}
                        {msg.copilotStep === "adverse-news" && (<>
                          <p style={{ marginBottom: 14 }}>This source adds 3 corroborating identifiers and links the subject to a related sanctioned entity. Based on the full evidence, here is my recommendation.</p>
                          <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>Likely True Hit</span>
                              <span style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>{selectedCase.confidence}%</span>
                            </div>
                            <p style={{ fontSize: 13, color: dimColor, margin: 0, lineHeight: 1.5 }}>
                              Recommended disposition:<br />
                              <span style={{ fontWeight: 600, color: aiColor }}>Confirm True Hit — High Priority</span>
                            </p>
                          </div>
                          {isLast && (<>
                            <button onClick={handleApplyRecommendation} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "white", background: "rgba(239,68,68,0.82)", border: "none", borderRadius: 7, padding: "7px 14px", cursor: "pointer", marginBottom: 8 }}>
                              Apply recommendation
                            </button>
                            <button onClick={() => sendMessage("Why do you recommend True Hit — High Priority?")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: dimColor, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0" }}>
                              Why this recommendation?
                            </button>
                          </>)}
                        </>)}

                        {/* ── complete ── */}
                        {msg.copilotStep === "complete" && (<>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <Check style={{ width: 13, height: 13, color: "#4ade80" }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>Recommendation applied.</span>
                          </div>
                          <p>Please review the evidence and submit the disposition when ready.</p>
                        </>)}

                        {thumbs}
                      </div>
                    );
                  })}

                  {/* Follow Up Questions */}
                  <div style={{ paddingTop: 4, paddingBottom: 8 }}>
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-indigo-400 text-[12px]">✦</span>
                      <span className={`text-[11px] font-semibold uppercase tracking-widest ${dm("text-gray-400","text-gray-500")}`}>Follow Up Questions</span>
                    </div>
                    {getSuggestedPrompts(selectedCase).map((prompt, pi) => (
                      <button
                        key={pi}
                        onClick={() => sendMessage(prompt)}
                        className={`w-full text-left py-2.5 transition-colors ${pi < 2 ? `border-b ${dm("border-gray-100","border-white/[0.06]")}` : ""} ${dm("text-gray-500 hover:text-gray-900","text-gray-500 hover:text-slate-200")}`}
                        style={{ fontSize: 14 }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <div ref={chatEndRef} />
                </div>

                {/* Spacer so scroll content clears the floating prompt bar */}
                <div className="flex-shrink-0 h-16" />

                {/* Resize handle on the left edge of the chat panel */}
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:8, zIndex:30 }}>
                  <ResizeHandle onDelta={dx => setChatPanelWidth(p => Math.max(280, Math.min(600, p - dx)))} dark={darkMode} />
                </div>
              </div>

              {/* Top-right overlay: node count badge — sits left of the canvas controls (32px wide at right:16) */}
              {/* Re-open tab when pane is closed */}
              {!rightPaneOpen && (
                <button
                  onClick={() => setRightPaneOpen(true)}
                  title="Show analysis pane"
                  style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    zIndex: 26, width: 20, height: 56, borderRadius: "0 6px 6px 0",
                    background: darkMode ? "rgba(9,7,22,0.82)" : "rgba(255,255,255,0.88)",
                    border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)"}`,
                    borderLeft: "none",
                    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.35)",
                  }}
                >
                  <PanelLeftOpen className="h-3 w-3" />
                </button>
              )}

              {/* ── Unified left pane: Match Analysis + Disposition ── */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: rightPaneOpen ? rightPaneWidth : 0, zIndex: 25,
                display: "flex", flexDirection: "column",
                background: darkMode ? "rgba(9,7,22,0.84)" : "rgba(255,255,255,0.86)",
                backdropFilter: "blur(32px) saturate(1.8)",
                WebkitBackdropFilter: "blur(32px) saturate(1.8)",
                borderRight: rightPaneOpen ? `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}` : "none",
                overflowX: "hidden",
                overflowY: "hidden",
                transition: "width 0.22s ease",
              }}>
                {/* Resize handle on right edge */}
                {rightPaneOpen && (
                  <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, zIndex: 10 }}>
                    <ResizeHandle
                      dark={darkMode}
                      alwaysShow
                      onDelta={dx => setRightPaneWidth(w => Math.max(220, Math.min(480, w + dx)))}
                    />
                  </div>
                )}

                {/* ── Panel header — always visible ── */}
                {(() => {
                  const nodeIdx = comparisonNode ? caseNodes.findIndex(n => n.label === comparisonNode.label) : -1;
                  const canPrev = nodeIdx > 0;
                  const canNext = nodeIdx >= 0 && nodeIdx < caseNodes.length - 1;
                  const goTo = (idx: number) => {
                    const n = caseNodes[idx];
                    if (!n) return;
                    setAdverseDetail(null);
                    setComparisonNode(n);
                    if (n.risk === "medium" || n.risk === "low") {
                      setDispositionChoice("false-positive");
                      setTrueHitStep(false);
                      setDispositionSubmitted(false);
                      setDispositionComment(`Match score of ${n.matchScore ?? 0}% falls below the review threshold. Name similarity detected against ${n.sublabel ?? "the watchlist"}, however date of birth, nationality, and identity document number do not align with the customer's verified records. No beneficial ownership or transactional nexus identified. Assessed as a false positive — no further action required.`);
                    }
                  };
                  return (
                    <div style={{ padding: "12px 14px 12px", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`, flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {adverseDetail ? (
                          <button onClick={() => setAdverseDetail(null)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, color: "#818cf8", fontSize: 11, fontWeight: 600 }}>
                            <ArrowLeft className="h-3 w-3" />
                            Back to Match Analysis
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#818cf8", textTransform: "uppercase" }}>Match Analysis</span>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {!adverseDetail && nodeIdx >= 0 && (
                            <>
                              <BorderBeamIconButton
                                type="button" variant="outline" beamSize="sm" colorVariant="colorful"
                                active={canPrev} staticColors={true}
                                disabled={!canPrev}
                                aria-label="Previous node"
                                onClick={() => goTo(nodeIdx - 1)}
                                className="h-6 w-6 rounded-md border-transparent disabled:opacity-30"
                                style={{ background: "rgba(9,7,22,0.90)" }}
                              >
                                <ChevronLeft className="h-3 w-3" style={{ color: "rgba(255,255,255,0.70)" }} />
                              </BorderBeamIconButton>
                              <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)", minWidth: 28, textAlign: "center" }}>
                                {nodeIdx + 1}/{caseNodes.length}
                              </span>
                              <BorderBeamIconButton
                                type="button" variant="outline" beamSize="sm" colorVariant="colorful"
                                active={canNext} staticColors={true}
                                disabled={!canNext}
                                aria-label="Next node"
                                onClick={() => goTo(nodeIdx + 1)}
                                className="h-6 w-6 rounded-md border-transparent disabled:opacity-30"
                                style={{ background: "rgba(9,7,22,0.90)" }}
                              >
                                <ChevronRight className="h-3 w-3" style={{ color: "rgba(255,255,255,0.70)" }} />
                              </BorderBeamIconButton>
                            </>
                          )}
                          <button
                            onClick={() => setRightPaneOpen(false)}
                            title="Close"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, lineHeight: 1, marginLeft: 2, color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.30)" }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {!comparisonNode ? (
                  /* ── Empty state ── */
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: darkMode ? "rgba(129,140,248,0.10)" : "rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Users style={{ width: 18, height: 18, color: darkMode ? "rgba(129,140,248,0.50)" : "rgba(99,102,241,0.45)" }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", lineHeight: 1.5, margin: 0 }}>
                      Select a node to begin analysis
                    </p>
                    <p style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.28)", lineHeight: 1.5, marginTop: 4 }}>
                      Click any person in the network graph to compare against the customer profile
                    </p>
                  </div>
                ) : adverseDetail ? (
                  /* ── Adverse News Detail ── */
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "16px 16px 20px", flex: 1 }}>
                      {/* Source row + pagination */}
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}>{adverseDetail.outlet}</span>
                        <ExternalLink style={{ width: 10, height: 10, color: darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.30)", flexShrink: 0, marginLeft: 4 }} />
                        {/* Pagination */}
                        <div style={{ display: "flex", alignItems: "center", gap: 0, background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 20, padding: "2px 4px", marginLeft: "auto" }}>
                          <button
                            onClick={() => { const i = Math.max(0, adverseArticleIdx - 1); setAdverseArticleIdx(i); setAdverseDetail(ADVERSE_ARTICLES[i]); }}
                            disabled={adverseArticleIdx === 0}
                            style={{ background: "none", border: "none", cursor: adverseArticleIdx === 0 ? "default" : "pointer", padding: "2px 6px", color: adverseArticleIdx === 0 ? (darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.20)") : (darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.60)"), display: "flex", alignItems: "center" }}
                          >
                            <ChevronLeft style={{ width: 12, height: 12 }} />
                          </button>
                          <span style={{ fontSize: 11, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)", padding: "0 2px", userSelect: "none" }}>
                            {adverseArticleIdx + 1} of {ADVERSE_ARTICLES.length}
                          </span>
                          <button
                            onClick={() => { const i = Math.min(ADVERSE_ARTICLES.length - 1, adverseArticleIdx + 1); setAdverseArticleIdx(i); setAdverseDetail(ADVERSE_ARTICLES[i]); }}
                            disabled={adverseArticleIdx === ADVERSE_ARTICLES.length - 1}
                            style={{ background: "none", border: "none", cursor: adverseArticleIdx === ADVERSE_ARTICLES.length - 1 ? "default" : "pointer", padding: "2px 6px", color: adverseArticleIdx === ADVERSE_ARTICLES.length - 1 ? (darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.20)") : (darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.60)"), display: "flex", alignItems: "center" }}
                          >
                            <ChevronRight style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                      {/* Date below outlet */}
                      <p style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", margin: "0 0 10px" }}>{adverseDetail.date}</p>
                      {/* Headline */}
                      <p style={{ fontSize: 16, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)", lineHeight: 1.35, marginBottom: 10 }}>{adverseDetail.headline}</p>
                      {/* Tags */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "2px 8px" }}>
                          <AlertTriangle style={{ width: 10, height: 10 }} />Adverse News
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20, padding: "2px 8px" }}>
                          Web crawl
                        </span>
                      </div>
                      {/* Blurb */}
                      <div style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(9,7,22,0.80) 70%) padding-box, linear-gradient(135deg, rgba(129,140,248,0.5) 0%, rgba(192,132,252,0.4) 50%, rgba(244,114,182,0.35) 100%) border-box", border: "1px solid transparent", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: darkMode ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.60)", lineHeight: 1.55 }}>
                        This article mentions <strong style={{ color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)", fontWeight: 600 }}>{selectedCase.customerName}</strong> in relation to asset freezes and alleged links to sanctioned entities.
                      </div>
                      {/* Matched Person */}
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", marginBottom: 10 }}>Matched Person</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                        <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold flex-shrink-0 ${selectedCase.colorDark}`}>{selectedCase.initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)" }}>{selectedCase.customerName}</div>
                          <div style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.40)", marginTop: 1 }}>↔ {selectedCase.watchlistName}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: (comparisonNode?.matchScore ?? 0) >= 80 ? "#ef4444" : (comparisonNode?.matchScore ?? 0) >= 60 ? "#f59e0b" : "#6b7280", background: (comparisonNode?.matchScore ?? 0) >= 80 ? "rgba(239,68,68,0.12)" : (comparisonNode?.matchScore ?? 0) >= 60 ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.12)", borderRadius: 20, padding: "3px 8px", flexShrink: 0 }}>{comparisonNode?.matchScore ?? selectedCase.confidence}% match</span>
                      </div>
                      {/* Identifiers Discovered */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", margin: 0 }}>Identifiers Discovered <span style={{ color: darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)" }}>(3)</span></p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 8 }}>
                        {[
                          { icon: <User style={{ width: 13, height: 13 }} />, label: "Name",              value: selectedCase.customerName },
                          { icon: <Globe style={{ width: 13, height: 13 }} />, label: "Nationality",     value: selectedCase.id === 1 ? "China (PRC)" : selectedCase.id === 2 ? "Bangladesh" : selectedCase.id === 3 ? "Malaysia" : selectedCase.id === 4 ? "Malaysia" : "France" },
                          { icon: <Building2 style={{ width: 13, height: 13 }} />, label: "Associated entity", value: selectedCase.id <= 2 ? "Front Co. Ltd" : "Horizon Advisory Ltd" },
                        ].map((row, i, arr) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "18px 1fr 1fr", gap: 6, alignItems: "center", padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` : "none" }}>
                            <span style={{ color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)" }}>{row.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)" }}>{row.label}</span>
                            <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: 20 }} />
                      {/* Matched in Article */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", margin: 0 }}>Matched in Article</p>
                        <span style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>2 key excerpts</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                        {[
                          { para: "Paragraph 3", text: `...authorities identified `, highlighted: selectedCase.customerName, after: ` as an associate of Horizon Directors Ltd, a company linked to sanctioned individuals...` },
                          { para: "Paragraph 6", text: `Assets belonging to `, highlighted: selectedCase.customerName, after: ` and related entities have been frozen under the latest round of sanctions...` },
                        ].map((ex, i) => (
                          <div key={i} style={{ borderRadius: 8, border: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`, padding: "10px 12px", background: darkMode ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                              <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)" }}>{ex.para}</span>
                            </div>
                            <p style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.65)", lineHeight: 1.55, margin: 0 }}>
                              {ex.text}
                              <mark style={{ background: "rgba(245,158,11,0.35)", color: "inherit", borderRadius: 2, padding: "0 2px" }}>{ex.highlighted}</mark>
                              {ex.after}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* View full article */}
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`, flexShrink: 0 }}>
                      <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, color: darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.70)" }}>
                        View full article <ExternalLink style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                ) : (<>

                {/* ── Match Analysis ── */}
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`, flex: 1, overflowY: "auto" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Customer</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.85)" }}>{selectedCase.customerName}</div>
                      <div style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.45)", marginTop: 1 }}>{selectedCase.watchlistSource} · {selectedCase.confidence}% match</div>
                    </div>
                    <div style={{ borderLeft: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`, paddingLeft: 10 }}>
                      <div style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Watchlist Person</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.85)" }}>{comparisonNode.label}</div>
                      <div style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.45)", marginTop: 1 }}>{comparisonNode.sublabel}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>Similarity</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${comparisonNode.matchScore ?? 0}%`, borderRadius: 2, background: (comparisonNode.matchScore ?? 0) >= 80 ? "#ef4444" : (comparisonNode.matchScore ?? 0) >= 60 ? "#f59e0b" : "#6b7280" }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: (comparisonNode.matchScore ?? 0) >= 80 ? "#ef4444" : (comparisonNode.matchScore ?? 0) >= 60 ? "#f59e0b" : "#9ca3af" }}>
                      {comparisonNode.matchScore ?? 0}%
                    </span>
                  </div>

                  {/* Accordions */}
                  <Accordion multiple value={accordionValue} onValueChange={(vals: string[]) => {
                    setAccordionValue(vals);
                    if (vals.includes('identifiers')) setReviewState(s => ({ ...s, identityReviewed: true }));
                    if (vals.includes('sources')) setReviewState(s => ({ ...s, watchlistReviewed: true }));
                  }} className="w-full">
                    {/* Identifier Comparison */}
                    <AccordionItem value="identifiers" className={pulseSection === 'identifiers' ? 'ai-pulse' : ''} style={{ borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}` }}>
                      <AccordionTrigger className="hover:no-underline" style={{ padding: "10px 0", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          Identifiers
                          {(() => {
                            const fields = comparisonNode.matchFields ?? [];
                            const matched = fields.filter(f => f.match).length;
                            return (
                              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0, textTransform: "none", color: matched === fields.length ? "#4ade80" : matched > 0 ? "#f59e0b" : "#f87171", background: matched === fields.length ? "rgba(74,222,128,0.12)" : matched > 0 ? "rgba(245,158,11,0.12)" : "rgba(248,113,113,0.12)", borderRadius: 4, padding: "1px 5px" }}>
                                {matched}/{fields.length} match
                              </span>
                            );
                          })()}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ paddingBottom: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {(comparisonNode.matchFields ?? []).map((f, fi) => (
                            <div key={fi} style={{ display: "grid", gridTemplateColumns: "72px 1fr 1fr 16px", gap: 6, alignItems: "center", padding: "4px 0" }}>
                              <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", fontWeight: 600 }}>{f.field}</span>
                              <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.customer}</span>
                              <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.watchlist}</span>
                              <span style={{ display: "flex", justifyContent: "center", alignItems: "center", color: f.match ? "#4ade80" : "#f87171" }}>
                                {f.match ? <CheckCircle style={{ width: 12, height: 12 }} /> : <X style={{ width: 12, height: 12 }} />}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Found Sources */}
                    <AccordionItem value="sources" className={pulseSection === 'sources' ? 'ai-pulse' : ''} style={{ border: "none" }}>
                      <AccordionTrigger className="hover:no-underline" style={{ padding: "10px 0", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          Found Sources
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0, textTransform: "none", color: "#818cf8", background: "rgba(129,140,248,0.12)", borderRadius: 4, padding: "1px 5px" }}>4</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ paddingBottom: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {/* WorldCheck verified sources */}
                          {[
                            { label: "OFAC SDN List", date: "2024-11-03", excerpt: "Listed under Executive Order 13599 — Iranian government-related entity." },
                            { label: "UN Security Council Consolidated List", date: "2023-07-18", excerpt: "Subject to travel ban and asset freeze per UNSC Resolution 1718." },
                          ].map((src, i, arr) => (
                            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                              <ShieldCheck style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1, color: "#4ade80" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: "#818cf8" }}>WorldCheck</span>
                                  <span style={{ marginLeft: "auto", fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)", flexShrink: 0 }}>{src.date}</span>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)", marginBottom: 2 }}>{src.label}</div>
                                <div style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.45)", lineHeight: 1.5 }}>{src.excerpt}</div>
                              </div>
                            </div>
                          ))}
                          {/* Web crawl adverse news — only shown after search triggered */}
                          {adverseSearchState === 'loading' && [0, 1].map(i => (
                            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i === 0 ? `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` : "none" }}>
                              <div className="ai-skeleton" style={{ width: 13, height: 13, flexShrink: 0, marginTop: 2, borderRadius: "50%" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                  <div className="ai-skeleton" style={{ width: 64, height: 10 }} />
                                  <div className="ai-skeleton" style={{ marginLeft: "auto", width: 48, height: 10 }} />
                                </div>
                                <div className="ai-skeleton" style={{ height: 11, marginBottom: 4, width: "90%" }} />
                                <div className="ai-skeleton" style={{ height: 10, width: "60%" }} />
                              </div>
                            </div>
                          ))}
                          {adverseSearchState === 'complete' && ADVERSE_ARTICLES.slice(0, 2).map((art, i, arr) => (
                            <div key={i} onClick={() => { setAdverseArticleIdx(i); setAdverseDetail(art); setReviewState(s => ({ ...s, adverseNewsReviewed: true })); }} style={{ display: "flex", gap: 10, padding: i < arr.length - 1 ? "10px 0" : "10px 0 0", borderBottom: i < arr.length - 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` : "none", cursor: "pointer" }}>
                              <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 2, color: "#f59e0b" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: "#f59e0b" }}>Adverse News</span>
                                  <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)" }}>· Web crawl</span>
                                  <span style={{ marginLeft: "auto", fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)", flexShrink: 0 }}>{art.date}</span>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)", marginBottom: 2, lineHeight: 1.45 }}>{art.headline}</div>
                                <div style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.40)" }}>{art.outlet}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* ── Disposition ── */}
                <div className={pulseSection === 'disposition' ? 'ai-pulse' : ''} style={{ padding: "14px 16px", flexShrink: 0, borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}` }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#818cf8", textTransform: "uppercase" }}>Disposition</span>
                  </div>
                  {/* Step 1 — False Positive or True Hit */}
                  {(() => {
                    const isFP      = dispositionChoice === "false-positive";
                    const isTH      = trueHitStep || dispositionChoice === "true-hit-high" || dispositionChoice === "true-hit-medium";
                    const step1 = [
                      { id: "fp" as const,  label: "False Positive", icon: <XCircle className="h-4 w-4 flex-shrink-0" />, color: "rgb(34,197,94)",  bg: darkMode ? "rgba(34,197,94,0.12)"  : "rgba(34,197,94,0.10)"  },
                      { id: "th" as const,  label: "True Hit",       icon: <Check   className="h-4 w-4 flex-shrink-0" />, color: "rgb(239,68,68)",  bg: darkMode ? "rgba(239,68,68,0.12)"  : "rgba(239,68,68,0.10)"  },
                    ];
                    return (<>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: (isTH) ? 10 : 0 }}>
                        {step1.map(opt => {
                          const active = opt.id === "fp" ? isFP : isTH;
                          return (
                            <button key={opt.id} onClick={() => {
                              if (opt.id === "fp") {
                                setDispositionChoice(isFP ? null : "false-positive");
                                setTrueHitStep(false);
                              } else {
                                setDispositionChoice(null);
                                setTrueHitStep(!isTH);
                              }
                            }} style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 8px",
                              borderRadius: 8, textAlign: "center", transition: "background 0.12s, border-color 0.12s",
                              border: `1px solid ${active ? opt.color + "55" : darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                              background: active ? opt.bg : "transparent", cursor: "pointer",
                            }}>
                              <span style={{ color: active ? opt.color : darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.35)" }}>{opt.icon}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: active ? opt.color : darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Step 2 — Priority (only when True Hit is selected) */}
                      {isTH && (
                        <div style={{ marginBottom: 6 }}>
                          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>Select Priority</p>
                          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}` }}>
                          {([
                            { key: "true-hit-high"   as const, label: "High",   icon: <Flame         className="h-3 w-3 flex-shrink-0" />, color: "rgb(239,68,68)",  bg: darkMode ? "rgba(239,68,68,0.18)"  : "rgba(239,68,68,0.10)"  },
                            { key: "true-hit-medium" as const, label: "Medium", icon: <AlertTriangle className="h-3 w-3 flex-shrink-0" />, color: "rgb(251,191,36)", bg: darkMode ? "rgba(251,191,36,0.18)" : "rgba(251,191,36,0.10)" },
                          ] as const).map((p, i) => {
                            const active = dispositionChoice === p.key;
                            return (
                              <button key={p.key} onClick={() => setDispositionChoice(active ? null : p.key)} style={{
                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                padding: "6px 8px", cursor: "pointer",
                                borderLeft: i === 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}` : "none",
                                transition: "background 0.12s, color 0.12s",
                                background: active ? p.bg : "transparent",
                              }}>
                                <span style={{ color: active ? p.color : darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>{p.icon}</span>
                                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? p.color : darkMode ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }}>{p.label}</span>
                              </button>
                            );
                          })}
                          </div>
                        </div>
                      )}
                    </>);
                  })()}
                  {dispositionChoice && (() => {
                    const regenerate = () => {
                      if (typeoutRef.current) clearInterval(typeoutRef.current);
                      setRegenerating(true);
                      setDispositionComment("");
                      const node = comparisonNode;
                      const score = node?.matchScore ?? 0;
                      const comments: Record<string, string> = {
                        "false-positive": `Match score of ${score}% falls below the confirmation threshold. Name similarity detected against ${node?.sublabel ?? "the watchlist"}, however date of birth, nationality, and identity document number do not align with the customer's verified records. No beneficial ownership or transactional nexus identified. Assessed as a false positive — no further action required.`,
                        "true-hit-high": `Match score of ${score}% meets the threshold for a confirmed true hit. Strong name and identifier overlap identified against ${node?.sublabel ?? "the watchlist"}. Given the high confidence level and nature of the listing, immediate escalation to a senior compliance officer is recommended. Account activity should be suspended pending review.`,
                        "true-hit-medium": `Match score of ${score}% is consistent with a probable true hit. Partial identifier overlap noted against ${node?.sublabel ?? "the watchlist"}. Further due diligence is required. Refer to the compliance team for standard review and enhanced screening before any account action is taken.`,
                      };
                      const full = comments[dispositionChoice ?? "false-positive"] ?? "";
                      let i = 0;
                      typeoutRef.current = setInterval(() => {
                        i++;
                        setDispositionComment(full.slice(0, i));
                        if (i >= full.length) {
                          clearInterval(typeoutRef.current!);
                          typeoutRef.current = null;
                          setRegenerating(false);
                        }
                      }, 14);
                    };
                    return (
                      <div style={{ marginTop: 10, marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>
                            Comment <span style={{ fontWeight: 400, color: darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.25)" }}>(required)</span>
                          </p>
                          {regenerating ? (
                            <BorderBeamButton
                              type="button"
                              variant="outline"
                              beamSize="sm"
                              colorVariant="colorful"
                              active={true}
                              onClick={regenerate}
                              className="h-6 gap-1 rounded-md px-2 text-[10px] font-medium border-transparent"
                              style={{ background: "rgba(9,7,22,0.92)", color: "rgba(255,255,255,0.75)" }}
                            >
                              <Sparkles className="h-3 w-3" />
                              Writing…
                            </BorderBeamButton>
                          ) : (
                            <button
                              type="button"
                              onClick={regenerate}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                height: 24, padding: "0 9px", borderRadius: 8,
                                fontSize: 10, fontWeight: 500, cursor: "pointer",
                                color: "rgba(255,255,255,0.75)",
                                background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(9,7,22,0.92) 60%) padding-box, linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%) border-box",
                                border: "1px solid transparent",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
                              }}
                            >
                              <Sparkles className="h-3 w-3" />
                              Regenerate
                            </button>
                          )}
                        </div>
                        <textarea value={dispositionComment} onChange={e => setDispositionComment(e.target.value)}
                          placeholder="Provide reasoning for this decision…" rows={3} style={{
                            width: "100%", resize: "none", borderRadius: 8, padding: "9px 11px", fontSize: 12, lineHeight: "1.55",
                            border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
                            background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                            color: darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)", outline: "none", fontFamily: "inherit",
                          }} />
                      </div>
                    );
                  })()}
                  {dispositionSubmitted ? (
                    <div style={{
                      marginTop: 6, padding: "12px 14px", borderRadius: 8,
                      background: dispositionChoice === "false-positive" ? "rgba(34,197,94,0.10)" : dispositionChoice === "true-hit-high" ? "rgba(239,68,68,0.10)" : "rgba(251,191,36,0.10)",
                      border: `1px solid ${dispositionChoice === "false-positive" ? "rgba(34,197,94,0.30)" : dispositionChoice === "true-hit-high" ? "rgba(239,68,68,0.30)" : "rgba(251,191,36,0.30)"}`,
                      textAlign: "center",
                    }}>
                      <CheckCircle className="h-5 w-5 mx-auto mb-1.5" style={{ color: dispositionChoice === "false-positive" ? "rgb(34,197,94)" : dispositionChoice === "true-hit-high" ? "rgb(239,68,68)" : "rgb(251,191,36)" }} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.80)" }}>Disposition Submitted</p>
                      <p style={{ fontSize: 10, marginTop: 3, color: darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.45)" }}>
                        {dispositionChoice === "false-positive" ? "Cleared as false positive" : dispositionChoice === "true-hit-high" ? "Escalated — high priority" : "Escalated — medium priority"} · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ) : (
                    <button disabled={!dispositionChoice || !dispositionComment.trim()} onClick={() => { if (dispositionChoice && dispositionComment.trim()) setDispositionSubmitted(true); }} style={{
                      width: "100%", marginTop: 6, padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: dispositionChoice && dispositionComment.trim() ? "pointer" : "not-allowed",
                      transition: "opacity 0.15s, background 0.15s",
                      opacity: dispositionChoice && dispositionComment.trim() ? 1 : 0.35,
                      background: dispositionChoice
                        ? (dispositionChoice === "false-positive" ? "rgba(34,197,94,0.85)" : dispositionChoice === "true-hit-high" ? "rgba(239,68,68,0.85)" : "rgba(251,191,36,0.85)")
                        : darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                      color: dispositionChoice ? "white" : darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)", border: "none",
                    }}>
                      Submit Disposition
                    </button>
                  )}
                </div>
                </>)}
              </div>
              </>}

              {/* ── Customer Details tab ── */}
              {caseTab === "details" && (() => {
                const primary = [
                  { label:"Name",             value: selectedCase.customerName },
                  { label:"Date of birth",    value: "15/02/1981" },
                  { label:"Country of birth", value: "Singapore, SGP" },
                  { label:"Gender",           value: "Male" },
                  { label:"Nationality",      value: "Singaporean" },
                ];
                const secondary = [
                  { label:"Employer",    value: selectedCase.indicators.split(" · ")[0] },
                  { label:"Occupation",  value: "Director" },
                  { label:"Former name", value: selectedCase.watchlistName },
                  { label:"Alias",       value: "—" },
                ];

                const Section = ({ title, rows }: { title: string; rows: { label: string; value: string }[] }) => (
                  <div className={`rounded-xl overflow-hidden ${dm("border border-gray-100","border border-white/[0.08]")}`}
                    style={darkMode ? { background:"rgba(255,255,255,0.04)" } : { background:"rgba(255,255,255,0.65)" }}>
                    <div className={`px-4 py-3 border-b ${dm("border-gray-100","border-white/[0.06]")}`}>
                      <p className={`text-xs font-semibold ${dm("text-gray-900","text-slate-100")}`}>{title}</p>
                    </div>
                    {rows.map((row, i) => (
                      <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < rows.length - 1 ? `border-b ${dm("border-gray-100","border-white/[0.06]")}` : ""}`}>
                        <span className={`text-xs ${dm("text-gray-500","text-gray-400")}`}>{row.label}</span>
                        <span className={`text-xs font-medium ${dm("text-gray-900","text-slate-100")}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                );

                return (
                  <div className="absolute inset-0 overflow-y-auto px-8 py-6" style={{ zIndex:1 }}>
                    <div className="max-w-xl space-y-4">
                      <Section title="Primary identifiers" rows={primary} />
                      <Section title="Secondary identifiers" rows={secondary} />
                    </div>
                  </div>
                );
              })()}

              {/* ── Audit Trail tab ── */}
              {caseTab === "audit" && (() => {
                const entries = [
                  {
                    title: `Case reviewed by Ruby Tan`,
                    desc: "Confidence score and network links reviewed. Case flagged for senior sign-off.",
                    tags: ["Confidence", "Network links"],
                    time: "8 Sep 2026, 3:12pm",
                  },
                  {
                    title: "AI analysis flagged high-risk indicators",
                    desc: "PEP classification raised from occupation and employer fields.",
                    tags: ["Occupation", "Employer"],
                    time: "8 Sep 2026, 2:58pm",
                  },
                  {
                    title: "Case opened by Fraud Agent",
                    desc: `Watchlist hit detected against ${selectedCase.watchlistSource}. Confidence score: ${selectedCase.confidence}%.`,
                    tags: ["Name", "Watchlist"],
                    time: selectedCase.time,
                  },
                ];

                return (
                  <div className="absolute inset-0 overflow-y-auto px-8 py-6" style={{ zIndex:1 }}>
                    <div className="max-w-xl">
                      {entries.map((entry, i) => (
                        <div key={i} className="flex gap-4">
                          {/* Timeline spine */}
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className={`h-9 w-9 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0 ${dm("border-gray-200 bg-white","border-white/20")}`}
                              style={darkMode ? { background:"rgba(255,255,255,0.05)" } : {}}>
                              <span className={`text-[13px] ${dm("text-gray-400","text-gray-500")}`}>✎</span>
                            </div>
                            {i < entries.length - 1 && (
                              <div className={`w-px flex-1 my-1 border-l-2 border-dashed ${dm("border-gray-200","border-white/10")}`} style={{ minHeight:24 }} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="pb-7 flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-snug mb-1 ${dm("text-gray-900","text-slate-100")}`}>{entry.title}</p>
                            <p className={`text-xs leading-relaxed mb-2.5 ${dm("text-gray-500","text-gray-400")}`}>{entry.desc}</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {entry.tags.map(tag => (
                                <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${dm("bg-indigo-50 text-indigo-600 border border-indigo-100","text-indigo-300 border border-indigo-500/25")}`}
                                  style={darkMode ? { background:"rgba(99,102,241,0.10)" } : {}}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className={`text-[10px] ${dm("text-gray-400","text-gray-600")}`}>{entry.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}


            </>
          ) : (
            /* ── Dashboard view ── */
            <>
              <NetworkNodes dark={darkMode} className="absolute inset-0 w-full h-full" style={{ zIndex:0, pointerEvents:"none" }} />

              <style>{`@keyframes cardEntrance { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

              {/* Vertically centred content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-8" style={{ zIndex:1 }}>
                {/* Greeting */}
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-2">Monday, 8 September 2026</p>
                  <h1 className={`text-[1.75rem] font-bold leading-tight tracking-tight mb-2 ${dm("text-gray-900","text-slate-100")}`}>
                    Good Morning, Victor.
                  </h1>
                  <p className={`text-sm ${dm("text-gray-500","text-gray-400")}`}>
                    You have <span className="text-indigo-400 font-medium">5 alerts pending review</span> and{" "}
                    <span className="text-indigo-400 font-medium">2 high-risk cases</span> updated since your last session.
                  </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-3 w-full max-w-3xl items-stretch">
                  {([
                    { icon:Bell,          end:6,   label:"Pending review",                   change:"↓ 25% from last week", up:false },
                    { icon:Users,         end:142, label:"Customers with watchlist matches", change:"↑ 18% from last week", up:true  },
                    { icon:AlertTriangle, end:89,  label:"New matches detected",             change:"↑ 42% from last week", up:true  },
                    { icon:FileText,      end:27,  label:"High-risk customers",              change:"↑ 35% from last week", up:true  },
                  ] as const).map((s,i) => (
                    <StatCard key={s.label} icon={s.icon} end={s.end} label={s.label} change={s.change} up={s.up} index={i} dark={darkMode} />
                  ))}
                </div>

                {/* Prompt bar */}
                <div className="w-full max-w-xl">
                  <div style={{
                    borderRadius: "9999px",
                    padding: "1.5px",
                    background: darkMode
                      ? "linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(139,92,246,0.55) 50%, rgba(99,102,241,0.95) 100%)"
                      : "linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.20) 50%, rgba(99,102,241,0.35) 100%)",
                    boxShadow: darkMode
                      ? "0 0 18px rgba(99,102,241,0.32), 0 0 42px rgba(99,102,241,0.12)"
                      : "0 0 12px rgba(99,102,241,0.10), 0 1px 4px rgba(99,102,241,0.08)",
                  }}>
                    <div style={{
                      borderRadius: "9999px",
                      background: darkMode ? "rgba(10,8,20,0.94)" : "rgba(250,250,255,0.97)",
                      display: "flex", alignItems: "center",
                      paddingLeft: "16px", paddingRight: "6px",
                      paddingTop: "8px", paddingBottom: "8px", gap: "8px",
                    }}>
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                        placeholder="Ask your Fraud Agent Anything"
                        className={`flex-1 bg-transparent text-sm focus:outline-none ${dm("text-gray-900 placeholder-gray-400","text-slate-200 placeholder-gray-600")}`}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!chatInput.trim()}
                        className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${chatInput.trim()
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : dm("bg-gray-200 text-gray-400","bg-white/10 text-gray-600")}`}
                        style={chatInput.trim() ? { boxShadow:"0 2px 10px rgba(99,102,241,0.4)" } : {}}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>{/* end main row */}
    </div>
  );
}
