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
import { useState, useEffect, useRef, useMemo, Fragment, type ReactNode } from "react";
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bell, Building2, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown,
  ExternalLink, Eye, EyeOff, FileText, Flame, Globe, Inbox, Moon, PanelLeftClose, PanelLeftOpen, PanelRightClose, Pencil,
  Gavel, Landmark, LogOut, Pin, Search, Settings, ShieldAlert, ShieldCheck, Sparkles, Sun, ThumbsDown, ThumbsUp, Trash2, User, Users, Wrench, X, XCircle,
} from "lucide-react";
import { BorderBeamButton, BorderBeamIconButton } from "@/components/ui/border-beam-button";
import { AIReasoningLoader } from "@/components/ui/ai-reasoning-loader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

function StatCard({ icon: Icon, end, label, change, variant = "neutral", index, dark = false }: {
  icon: React.ElementType; end: number; label: string; change: string; variant?: "neutral" | "alert"; index: number; dark?: boolean;
}) {
  const value = useCountUp(end, 150 + index * 100);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80 + index * 60); return () => clearTimeout(t); }, [index]);
  const changeColor = variant === "alert"
    ? (dark ? "#fb923c" : "#d97706")
    : (dark ? "rgba(167,139,250,1)" : "rgba(79,70,229,1)");
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
        <p className="text-xs font-medium" style={{ color: changeColor }}>{change}</p>
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

const WORLDCHECK_SOURCE_DETAILS = [
  { outlet: "OFAC SDN List",                        date: "2024-11-03", headline: "Entity listed under Executive Order 13599 — classified as Iranian government-related entity.", sourceType: "worldcheck" as const, tags: "OFAC • Sanctions • Asset Freeze" },
  { outlet: "UN Security Council Consolidated List", date: "2023-07-18", headline: "Listed per UNSC Resolution 1718 — subject to mandatory travel ban and asset freeze.",        sourceType: "worldcheck" as const, tags: "UN • Sanctions • Travel Ban" },
];

const ADVERSE_ARTICLES = [
  { outlet: "Reuters",         date: "2025-03-12", headline: "Regulators freeze assets linked to suspected sanctions evader",          topics: ["Sanctions", "Asset Freeze", "AML"] },
  { outlet: "Financial Times", date: "2024-09-27", headline: "Shell company network tied to OFAC-listed individual uncovered",         topics: ["OFAC", "Shell Company", "Sanctions"] },
  { outlet: "Bloomberg",       date: "2024-06-14", headline: "Treasury flags offshore accounts in multi-jurisdiction probe",           topics: ["Offshore", "AML", "Treasury"] },
  { outlet: "The Guardian",    date: "2023-11-02", headline: "Leaked documents expose shadow banking ties to sanctioned states",       topics: ["Shadow Banking", "Sanctions"] },
];

// ─── Case data ────────────────────────────────────────────────────────────────

const cases = [
  { id: 1, initials: "LB", colorLight: "bg-indigo-100 text-indigo-600",  colorDark: "bg-indigo-900/50 text-indigo-300",  customerName: "Li Bin",                    watchlistName: "LI, Bin",                    watchlistSource: "OFAC SDN",      risk: "Critical" as const, confidence: 90, matchCount: 8, indicators: "Sanctioned",                                                   time: "2h ago",  unread: true  },
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
  // Customer: Name "Li Bin" · YOB 1975 · COB China · DOB 12 Jul · Gender Male · Nationality PRC · Occupation Executive · Address Shanghai, PRC
  1: [
    // 0 — exact format match
    { label: "LI, Bin",        sublabel: "OFAC SDN",    risk: "critical", nodeType: "person" as const, matchScore: 90, matchedAttributeIndices: [8,9,10,11,12,13,14],
      matchFields: [
        { field: "Name",                        customer: "Li Bin",           watchlist: "LI, Bin",          match: true  },
        { field: "Year of Birth (YOB)",         customer: "1975",             watchlist: "1975",             match: true  },
        { field: "Country of Birth",            customer: "China",            watchlist: "China",            match: true  },
        { field: "Day of Birth (DOB)",          customer: "12 Jul",           watchlist: "12 Jul",           match: true  },
        { field: "Deceased Status",             customer: "FALSE",            watchlist: "FALSE",            match: true  },
        { field: "Primary Name",               customer: "LI, Bin",          watchlist: "LI, Bin",          match: true  },
        { field: "Former or Alias Name",        customer: "N/A",              watchlist: "Li Bing",          match: false },
        { field: "Gender",                      customer: "Male",             watchlist: "Male",             match: true  },
        { field: "Nationality",                 customer: "PRC",              watchlist: "PRC",              match: true  },
        { field: "Occupation",                  customer: "Executive",        watchlist: "Executive",        match: false },
        { field: "Weak Link",                   customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "C2C",                         customer: "CITIC Group",      watchlist: "CITIC Group Corp", match: true  },
        { field: "Passport/Tax/Identification", customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Address",                     customer: "Shanghai, PRC",    watchlist: "Shanghai, PRC",    match: true  },
      ]},
    // 1 — extra middle name
    { label: "LI, Bin Rong",   sublabel: "UN",           risk: "critical", nodeType: "person" as const, matchScore: 88, matchedAttributeIndices: [8,9,10,14],
      matchFields: [
        { field: "Name",                        customer: "Li Bin",           watchlist: "LI, Bin Rong",     match: true  },
        { field: "Year of Birth (YOB)",         customer: "1975",             watchlist: "1975",             match: true  },
        { field: "Country of Birth",            customer: "China",            watchlist: "China",            match: true  },
        { field: "Day of Birth (DOB)",          customer: "12 Jul",           watchlist: "12 Jul",           match: true  },
        { field: "Deceased Status",             customer: "FALSE",            watchlist: "FALSE",            match: true  },
        { field: "Primary Name",               customer: "LI, Bin",          watchlist: "LI, Bin Rong",     match: true  },
        { field: "Former or Alias Name",        customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Gender",                      customer: "Male",             watchlist: "Male",             match: true  },
        { field: "Nationality",                 customer: "PRC",              watchlist: "PRC",              match: true  },
        { field: "Occupation",                  customer: "Executive",        watchlist: "N/A",              match: false },
        { field: "Weak Link",                   customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "C2C",                         customer: "CITIC Group",      watchlist: "N/A",              match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Address",                     customer: "Shanghai, PRC",    watchlist: "N/A",              match: false },
      ]},
    // 2 — Wade-Giles transliteration
    { label: "LEE, Bin",       sublabel: "OFAC SDN",    risk: "critical", nodeType: "person" as const, matchScore: 82, matchedAttributeIndices: [8,10,13],
      matchFields: [
        { field: "Name",                        customer: "Li Bin",           watchlist: "LEE, Bin",         match: true  },
        { field: "Year of Birth (YOB)",         customer: "1975",             watchlist: "1975",             match: true  },
        { field: "Country of Birth",            customer: "China",            watchlist: "China",            match: true  },
        { field: "Day of Birth (DOB)",          customer: "12 Jul",           watchlist: "15 Jul",           match: false },
        { field: "Deceased Status",             customer: "FALSE",            watchlist: "FALSE",            match: true  },
        { field: "Primary Name",               customer: "LI, Bin",          watchlist: "LEE, Bin",         match: true  },
        { field: "Former or Alias Name",        customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Gender",                      customer: "Male",             watchlist: "Male",             match: true  },
        { field: "Nationality",                 customer: "PRC",              watchlist: "PRC",              match: true  },
        { field: "Occupation",                  customer: "Executive",        watchlist: "N/A",              match: false },
        { field: "Weak Link",                   customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "C2C",                         customer: "CITIC Group",      watchlist: "N/A",              match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Address",                     customer: "Shanghai, PRC",    watchlist: "N/A",              match: false },
      ]},
    // 3 — reversed Western order
    { label: "Bin Li",         sublabel: "EU Sanctions", risk: "high",     nodeType: "person" as const, matchScore: 74, matchedAttributeIndices: [8,10,15],
      classifications: ["Foreign PEP", "Sanctioned by OFAC", "Sanctioned by UN", "Sanctioned by UK OFSI", "Sanctioned by EU", "Sanctioned by other authority", "Legal Enforcement Action"],
      matchFields: [
        { field: "Name",                        customer: "Li Bin",           watchlist: "Bin Li",           match: true  },
        { field: "Year of Birth (YOB)",         customer: "1975",             watchlist: "1980",             match: false },
        { field: "Country of Birth",            customer: "China",            watchlist: "China",            match: true  },
        { field: "Day of Birth (DOB)",          customer: "12 Jul",           watchlist: "20 Feb",           match: false },
        { field: "Deceased Status",             customer: "FALSE",            watchlist: "FALSE",            match: true  },
        { field: "Primary Name",               customer: "LI, Bin",          watchlist: "LI, Bin",          match: true  },
        { field: "Former or Alias Name",        customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Gender",                      customer: "Male",             watchlist: "Male",             match: true  },
        { field: "Nationality",                 customer: "PRC",              watchlist: "PRC",              match: true  },
        { field: "Occupation",                  customer: "Executive",        watchlist: "N/A",              match: false },
        { field: "Weak Link",                   customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "C2C",                         customer: "CITIC Group",      watchlist: "N/A",              match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Address",                     customer: "Shanghai, PRC",    watchlist: "N/A",              match: false },
      ]},
    // 4 — spelling variant
    { label: "LI, Binn",       sublabel: "OFAC SDN",    risk: "high",     nodeType: "person" as const, matchScore: 66, matchedAttributeIndices: [8,13],
      matchFields: [
        { field: "Name",                        customer: "Li Bin",           watchlist: "LI, Binn",         match: true  },
        { field: "Year of Birth (YOB)",         customer: "1975",             watchlist: "1976",             match: false },
        { field: "Country of Birth",            customer: "China",            watchlist: "Singapore",        match: false },
        { field: "Day of Birth (DOB)",          customer: "12 Jul",           watchlist: "3 Sep",            match: false },
        { field: "Deceased Status",             customer: "FALSE",            watchlist: "FALSE",            match: true  },
        { field: "Primary Name",               customer: "LI, Bin",          watchlist: "LI, Binn",         match: true  },
        { field: "Former or Alias Name",        customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Gender",                      customer: "Male",             watchlist: "N/A",              match: false },
        { field: "Nationality",                 customer: "PRC",              watchlist: "SGP",              match: false },
        { field: "Occupation",                  customer: "Executive",        watchlist: "N/A",              match: false },
        { field: "Weak Link",                   customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "C2C",                         customer: "CITIC Group",      watchlist: "N/A",              match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Address",                     customer: "Shanghai, PRC",    watchlist: "N/A",              match: false },
      ]},
    // 5 — phonetic near-match
    { label: "LI, Pin",        sublabel: "Interpol",    risk: "medium",   nodeType: "person" as const, matchScore: 51, matchedAttributeIndices: [8,16],
      matchFields: [
        { field: "Name",                        customer: "Li Bin",           watchlist: "LI, Pin",          match: true  },
        { field: "Year of Birth (YOB)",         customer: "1975",             watchlist: "1982",             match: false },
        { field: "Country of Birth",            customer: "China",            watchlist: "Hong Kong",        match: false },
        { field: "Day of Birth (DOB)",          customer: "12 Jul",           watchlist: "14 Apr",           match: false },
        { field: "Deceased Status",             customer: "FALSE",            watchlist: "FALSE",            match: true  },
        { field: "Primary Name",               customer: "LI, Bin",          watchlist: "LI, Pin",          match: true  },
        { field: "Former or Alias Name",        customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Gender",                      customer: "Male",             watchlist: "N/A",              match: false },
        { field: "Nationality",                 customer: "PRC",              watchlist: "HK",               match: false },
        { field: "Occupation",                  customer: "Executive",        watchlist: "N/A",              match: false },
        { field: "Weak Link",                   customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "C2C",                         customer: "CITIC Group",      watchlist: "N/A",              match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Address",                     customer: "Shanghai, PRC",    watchlist: "N/A",              match: false },
      ]},
    // 6 — romanisation variant
    { label: "LI, Ben",        sublabel: "UN",           risk: "medium",   nodeType: "person" as const, matchScore: 45, matchedAttributeIndices: [8,14],
      matchFields: [
        { field: "Name",                        customer: "Li Bin",           watchlist: "LI, Ben",          match: true  },
        { field: "Year of Birth (YOB)",         customer: "1975",             watchlist: "1969",             match: false },
        { field: "Country of Birth",            customer: "China",            watchlist: "China",            match: true  },
        { field: "Day of Birth (DOB)",          customer: "12 Jul",           watchlist: "7 Nov",            match: false },
        { field: "Deceased Status",             customer: "FALSE",            watchlist: "FALSE",            match: true  },
        { field: "Primary Name",               customer: "LI, Bin",          watchlist: "LI, Ben",          match: true  },
        { field: "Former or Alias Name",        customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Gender",                      customer: "Male",             watchlist: "N/A",              match: false },
        { field: "Nationality",                 customer: "PRC",              watchlist: "N/A",              match: false },
        { field: "Occupation",                  customer: "Executive",        watchlist: "N/A",              match: false },
        { field: "Weak Link",                   customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "C2C",                         customer: "CITIC Group",      watchlist: "N/A",              match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Address",                     customer: "Shanghai, PRC",    watchlist: "Guangzhou, PRC",   match: false },
      ]},
    // 7 — distant transliteration
    { label: "LE, Bin",        sublabel: "World Bank",  risk: "low",      nodeType: "person" as const, matchScore: 32, matchedAttributeIndices: [17],
      matchFields: [
        { field: "Name",                        customer: "Li Bin",           watchlist: "LE, Bin",          match: false },
        { field: "Year of Birth (YOB)",         customer: "1975",             watchlist: "1971",             match: false },
        { field: "Country of Birth",            customer: "China",            watchlist: "Vietnam",          match: false },
        { field: "Day of Birth (DOB)",          customer: "12 Jul",           watchlist: "22 Mar",           match: false },
        { field: "Deceased Status",             customer: "FALSE",            watchlist: "FALSE",            match: true  },
        { field: "Primary Name",               customer: "LI, Bin",          watchlist: "LE, Bin",          match: false },
        { field: "Former or Alias Name",        customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Gender",                      customer: "Male",             watchlist: "N/A",              match: false },
        { field: "Nationality",                 customer: "PRC",              watchlist: "Vietnam",          match: false },
        { field: "Occupation",                  customer: "Executive",        watchlist: "N/A",              match: false },
        { field: "Weak Link",                   customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "C2C",                         customer: "CITIC Group",      watchlist: "N/A",              match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",              watchlist: "N/A",              match: true  },
        { field: "Address",                     customer: "Shanghai, PRC",    watchlist: "N/A",              match: false },
      ]},
    // attr indices 8–21: 14 identifier fields (one per matchField)
    { label: "Name",                        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Year of Birth (YOB)",         sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Country of Birth",            sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Day of Birth (DOB)",          sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Deceased Status",             sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Primary Name",               sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Former or Alias Name",        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Gender",                      sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Nationality",                 sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Occupation",                  sublabel: "Profile",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Weak Link",                   sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "C2C",                         sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Passport/Tax/Identification", sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Address",                     sublabel: "Geo",      risk: "high" as const, nodeType: "attribute" as const, attrIcon: "address" as const },
    // worldcheck source nodes — indices 22–26
    { label: "OFAC SDN List",        sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "UN Consolidated List", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "EU Sanctions List",    sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "Interpol Red Notices", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "World Bank Debarment", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
  ],
  // Rahman Mohammad Mizanur — UN Sanctions, High
  // Customer: Name "Rahman Mohammad Mizanur" · YOB 1972 · COB Bangladesh · DOB 14 Mar · Gender Male · Nationality Bangladesh · Occupation Bank Director · C2C Islami Bank BD · Address Dhaka, Bangladesh
  2: [
    // 0
    { label: "MIZANUR, Rashed",  sublabel: "UN Sanctions",      risk: "critical", nodeType: "person" as const, matchScore: 91, matchedAttributeIndices: [11,12,13,14,15,16,17],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "MIZANUR, Rashed Rahman",  match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1972",                   match: true  },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "14 Mar",                 match: true  },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "MIZANUR, Rashed Rahman", match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "M. Mizanur Rahman",      match: false },
        { field: "Gender",                      customer: "Male",                   watchlist: "Male",                   match: true  },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "Director",               match: true  },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "Islami Bank Bangladesh", match: true  },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "Dhaka, BD",              match: true  },
      ]},
    // 1 — shares Rahman + Mohammad
    { label: "RAHMAN, Mohd. M.", sublabel: "OFAC SDN",           risk: "critical", nodeType: "person" as const, matchScore: 87, matchedAttributeIndices: [11,15,17],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "RAHMAN, Mohd. M.",       match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1969",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "9 Aug",                  match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "RAHMAN, Mohd. M.",      match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "Male",                   match: true  },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "Front Co. Ltd",          match: true  },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "N/A",                    match: false },
      ]},
    // 2
    { label: "RAHMAN, Akhtar",  sublabel: "Interpol Red",       risk: "high",     nodeType: "person" as const, matchScore: 76, matchedAttributeIndices: [11,13,18],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "RAHMAN, Akhtar",         match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1975",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "22 Nov",                 match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "RAHMAN, Akhtar",        match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "Male",                   match: true  },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "N/A",                    match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "Chittagong, BD",         match: false },
      ]},
    // 3 — phonetic variant of Rahman
    { label: "RAHAMAN, Noor",   sublabel: "UN Sanctions",       risk: "high",     nodeType: "person" as const, matchScore: 68, matchedAttributeIndices: [11,13,16],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "RAHAMAN, Noor",          match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1974",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "N/A",                    match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "RAHAMAN, Noor",         match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "N/A",                    match: false },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "Dhaka Entity Ltd",       match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "N/A",                    match: false },
      ]},
    // 4 — shares Mizanur surname
    { label: "MIZANUR, Ibrahim",sublabel: "OFAC SDN",           risk: "high",     nodeType: "person" as const, matchScore: 64, matchedAttributeIndices: [11,13,15,17],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "MIZANUR, Ibrahim",       match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1968",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "3 Jan",                  match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "MIZANUR, Ibrahim",      match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "Male",                   match: true  },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "N/A",                    match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "ACC ••4491",             match: false },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "N/A",                    match: false },
      ]},
    // 5
    { label: "RAHMAN, Farida",  sublabel: "EU Sanctions",       risk: "high",     nodeType: "person" as const, matchScore: 61, matchedAttributeIndices: [11,13,14,19],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "RAHMAN, Farida",         match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1977",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "5 May",                  match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "RAHMAN, Farida",        match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "Female",                 match: false },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "N/A",                    match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "Dhaka, BD",              match: true  },
      ]},
    // 6 — spelling variant of Rahman
    { label: "REHMAN, Alam M.", sublabel: "UN Sanctions",       risk: "medium",   nodeType: "person" as const, matchScore: 49, matchedAttributeIndices: [11,13,16],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "REHMAN, Alam M.",        match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1971",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "17 Oct",                 match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "REHMAN, Alam M.",       match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "N/A",                    match: false },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "—",                      match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "N/A",                    match: false },
      ]},
    // 7 — phonetic variant
    { label: "RAHAMAN, Tariq",  sublabel: "Interpol Red",       risk: "medium",   nodeType: "person" as const, matchScore: 44, matchedAttributeIndices: [11,18],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "RAHAMAN, Tariq",         match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1970",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Pakistan",               match: false },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "29 Jun",                 match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "RAHAMAN, Tariq",        match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "Male",                   match: true  },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Pakistan",               match: false },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "N/A",                    match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "ACC ••7723",             match: false },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "N/A",                    match: false },
      ]},
    // 8 — partial, shares Mizanur
    { label: "MIZANUR, Hossain",sublabel: "EU Sanctions",       risk: "medium",   nodeType: "person" as const, matchScore: 38, matchedAttributeIndices: [11,13,19],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "MIZANUR, Hossain",       match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1980",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "11 Feb",                 match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "MIZANUR, Hossain",      match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "N/A",                    match: false },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "N/A",                    match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "Singapore",              match: false },
      ]},
    // 9 — loose, shares Rahman
    { label: "RAHMAN, Rahela",  sublabel: "World Bank",         risk: "low",      nodeType: "person" as const, matchScore: 28, matchedAttributeIndices: [11,13,20],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "RAHMAN, Rahela",         match: true  },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1985",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "30 Sep",                 match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "RAHMAN, Rahela",        match: true  },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "Female",                 match: false },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "N/A",                    match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "Sylhet, BD",             match: false },
      ]},
    // 10 — distant transliteration
    { label: "RAHAMAT, Shafiq", sublabel: "OFAC SDN",           risk: "low",      nodeType: "person" as const, matchScore: 21, matchedAttributeIndices: [13,17],
      matchFields: [
        { field: "Name",                        customer: "Rahman Mohammad Mizanur", watchlist: "RAHAMAT, Shafiq",        match: false },
        { field: "Year of Birth (YOB)",         customer: "1972",                   watchlist: "1983",                   match: false },
        { field: "Country of Birth",            customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "14 Mar",                 watchlist: "8 Mar",                  match: false },
        { field: "Deceased Status",             customer: "FALSE",                  watchlist: "FALSE",                  match: true  },
        { field: "Primary Name",               customer: "RAHMAN, Mohammad Mizanur",watchlist: "RAHAMAT, Shafiq",       match: false },
        { field: "Former or Alias Name",        customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Gender",                      customer: "Male",                   watchlist: "N/A",                    match: false },
        { field: "Nationality",                 customer: "Bangladesh",             watchlist: "Bangladesh",             match: true  },
        { field: "Occupation",                  customer: "Bank Director",          watchlist: "N/A",                    match: false },
        { field: "Weak Link",                   customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "C2C",                         customer: "Islami Bank BD",         watchlist: "N/A",                    match: false },
        { field: "Passport/Tax/Identification", customer: "N/A",                    watchlist: "N/A",                    match: true  },
        { field: "Address",                     customer: "Dhaka, Bangladesh",      watchlist: "Narayanganj, BD",        match: false },
      ]},
    // attr indices 11–24: 14 identifier fields
    { label: "Name",                        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Year of Birth (YOB)",         sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Country of Birth",            sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Day of Birth (DOB)",          sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Deceased Status",             sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Primary Name",               sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Former or Alias Name",        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Gender",                      sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Nationality",                 sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Occupation",                  sublabel: "Profile",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Weak Link",                   sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "C2C",                         sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Passport/Tax/Identification", sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Address",                     sublabel: "Geo",      risk: "high" as const, nodeType: "attribute" as const, attrIcon: "address" as const },
    // worldcheck source nodes — indices 25–29
    { label: "UN SC Consolidated List", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "OFAC SDN List",           sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "Interpol Red Notices",    sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "EU Sanctions List",       sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "World Bank Debarment",    sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
  ],
  // Nur Jazlan Mohamed — PEP Lists, High
  // Customer: Name "Nur Jazlan Mohamed" · YOB 1966 · COB Malaysia · DOB 24 Jan · Gender Male · Nationality MALAYSIA · Occupation Insurance Agent · Weak Link Weak · C2C "Linked to Watchlist : Nur Jazlan Mohamed" · Passport "MAL IC : 7912435SL" · Address "10 Jalan Bukit Bintang"
  3: [
    { label: "NUR JAZLAN, Mohamed",   sublabel: "PEP Lists",      risk: "high",   nodeType: "person" as const, matchScore: 79, matchedAttributeIndices: [14,15,16,17,18,19,20],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NUR JAZLAN, Mohamed (N.Mohammed)",    match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1966",                               match: true  },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "24 Jan",                             match: true  },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NUR JAZLAN, Mohamed",                match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "MOHAMED Nur Jazlan; MOHAMED Nur Jazlan bin", match: true  },
        { field: "Gender",                      customer: "Male",                                   watchlist: "M",                                  match: true  },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "MALAYSIA",                           match: true  },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "Weak",                               match: true  },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "Linked to Watchlist : Nur Jazlan Mohamed", match: true  },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "Selangor, MALAYSIA",                 match: false },
      ] },
    { label: "NUR JAZLAN, Mohamad",   sublabel: "UN PEP",         risk: "high",   nodeType: "person" as const, matchScore: 74, matchedAttributeIndices: [14,16,20],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NUR JAZLAN, Mohamad",                match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1966",                               match: true  },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "7 Sep",                              match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NUR JAZLAN, Mohamad",                match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "Male",                               match: true  },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "MALAYSIA",                           match: true  },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "Weak",                               match: true  },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "Jazlan Nur Mohamed",    sublabel: "EU PEP",         risk: "high",   nodeType: "person" as const, matchScore: 70, matchedAttributeIndices: [14,15,16,21],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "Jazlan Nur Mohamed",                 match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1966",                               match: true  },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "24 Jan",                             match: true  },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "Jazlan Nur Mohamed",                 match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "Male",                               match: true  },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "MALAYSIA",                           match: true  },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "Putrajaya",                          match: false },
      ] },
    { label: "NOR JAZLAN, Mohamed",   sublabel: "PEP Lists",      risk: "high",   nodeType: "person" as const, matchScore: 65, matchedAttributeIndices: [14,15,16,19],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NOR JAZLAN, Mohamed",                match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1966",                               match: true  },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "24 Jan",                             match: true  },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NOR JAZLAN, Mohamed",                match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "Male",                               match: true  },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "MALAYSIA",                           match: true  },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "A12345688",                          match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "NUR, Jazlan M.",        sublabel: "Interpol",       risk: "high",   nodeType: "person" as const, matchScore: 60, matchedAttributeIndices: [15,16,22],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NUR, Jazlan M.",                     match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1966",                               match: true  },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "24 Jan",                             match: true  },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NUR, Jazlan M.",                     match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "MALAYSIA",                           match: true  },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "NOOR JAZLAN, Mohamed",  sublabel: "UN PEP",         risk: "medium", nodeType: "person" as const, matchScore: 54, matchedAttributeIndices: [14,16,20],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NOOR JAZLAN, Mohamed",               match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1970",                               match: false },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "19 Mar",                             match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NOOR JAZLAN, Mohamed",               match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "Male",                               match: true  },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "MALAYSIA",                           match: true  },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "A99812341",                          match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "NUR JAZLAN, Mohammed",  sublabel: "PEP Lists",      risk: "medium", nodeType: "person" as const, matchScore: 49, matchedAttributeIndices: [14,19],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NUR JAZLAN, Mohammed",               match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1968",                               match: false },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Pakistan",                           match: false },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "12 Jun",                             match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NUR JAZLAN, Mohammed",               match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "PAK",                                match: false },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "Weak",                               match: true  },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "Karachi",                            match: false },
      ] },
    { label: "JAZLAN, Nur M.",        sublabel: "EU PEP",         risk: "medium", nodeType: "person" as const, matchScore: 43, matchedAttributeIndices: [15,21],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "JAZLAN, Nur M.",                     match: false },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1966",                               match: true  },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "24 Jan",                             match: true  },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "JAZLAN, Nur M.",                     match: false },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "SGP",                                match: false },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "NUR JAZLAN, Mohd",      sublabel: "World Bank",     risk: "medium", nodeType: "person" as const, matchScore: 38, matchedAttributeIndices: [14,23],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NUR JAZLAN, Mohd",                   match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1961",                               match: false },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Brunei",                             match: false },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "1 Jan",                              match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NUR JAZLAN, Mohd",                   match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "BRN",                                match: false },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "NUR JAZLAN, Md",        sublabel: "Interpol",       risk: "medium", nodeType: "person" as const, matchScore: 34, matchedAttributeIndices: [14,22],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NUR JAZLAN, Md",                     match: true  },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1972",                               match: false },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "21 Feb",                             match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NUR JAZLAN, Md",                     match: true  },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "N/A",                                match: false },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "Unknown",                            match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "NUR JALAN, Mohamed",    sublabel: "PEP Lists",      risk: "medium", nodeType: "person" as const, matchScore: 29, matchedAttributeIndices: [16,17,19],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NUR JALAN, Mohamed",                 match: false },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1974",                               match: false },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "30 Nov",                             match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NUR JALAN, Mohamed",                 match: false },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "MALAYSIA",                           match: true  },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "Kuala Lumpur",                       match: false },
      ] },
    { label: "NOR JAZLAN, Mohd",      sublabel: "UN PEP",         risk: "medium", nodeType: "person" as const, matchScore: 24, matchedAttributeIndices: [14,20],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NOR JAZLAN, Mohd",                   match: false },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1978",                               match: false },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "8 Aug",                              match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NOR JAZLAN, Mohd",                   match: false },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "IDN",                                match: false },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "NURJAZLAN, Mohamed",    sublabel: "Interpol",       risk: "low",    nodeType: "person" as const, matchScore: 20, matchedAttributeIndices: [14,16,22],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NURJAZLAN, Mohamed",                 match: false },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1983",                               match: false },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Malaysia",                           match: true  },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "17 Mar",                             match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NURJAZLAN, Mohamed",                 match: false },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "MALAYSIA",                           match: true  },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "Unknown",                            match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    { label: "NUR JAZLAN, Muhamad",   sublabel: "World Bank",     risk: "low",    nodeType: "person" as const, matchScore: 16, matchedAttributeIndices: [14,23],
      matchFields: [
        { field: "Name",                        customer: "Nur Jazlan Mohamed",                     watchlist: "NUR JAZLAN, Muhamad",                match: false },
        { field: "Year of Birth (YOB)",         customer: "1966",                                   watchlist: "1987",                               match: false },
        { field: "Country of Birth",            customer: "Malaysia",                               watchlist: "Thailand",                           match: false },
        { field: "Day of Birth (DOB)",          customer: "24 Jan",                                 watchlist: "2 May",                              match: false },
        { field: "Deceased Status",             customer: "FALSE",                                  watchlist: "FALSE",                              match: true  },
        { field: "Primary Name",               customer: "NUR JAZLAN, Mohamed",                    watchlist: "NUR JAZLAN, Muhamad",                match: false },
        { field: "Former or Alias Name",        customer: "MOHAMED Nur Jazlan; Datuk Nur Jazlan MOHAMED", watchlist: "N/A",                          match: false },
        { field: "Gender",                      customer: "Male",                                   watchlist: "N/A",                                match: false },
        { field: "Nationality",                 customer: "MALAYSIA",                               watchlist: "THA",                                match: false },
        { field: "Occupation",                  customer: "Insurance Agent",                        watchlist: "N/A",                                match: false },
        { field: "Weak Link",                   customer: "Weak",                                   watchlist: "N/A",                                match: false },
        { field: "C2C",                         customer: "Linked to Watchlist : Nur Jazlan Mohamed", watchlist: "N/A",                              match: false },
        { field: "Passport/Tax/Identification", customer: "MAL IC : 7912435SL",                    watchlist: "N/A",                                match: false },
        { field: "Address",                     customer: "10 Jalan Bukit Bintang",                 watchlist: "N/A",                                match: false },
      ] },
    // attr indices 14–27: 14 identifier fields
    { label: "Name",                        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Year of Birth (YOB)",         sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Country of Birth",            sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Day of Birth (DOB)",          sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Deceased Status",             sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Primary Name",               sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Former or Alias Name",        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Gender",                      sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Nationality",                 sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Occupation",                  sublabel: "Profile",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Weak Link",                   sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "C2C",                         sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Passport/Tax/Identification", sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Address",                     sublabel: "Geo",      risk: "high" as const, nodeType: "attribute" as const, attrIcon: "address" as const },
    // worldcheck source nodes — indices 28–32
    { label: "PEP Lists",            sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "UN PEP List",          sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "EU PEP List",          sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "Interpol Red Notices", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "World Bank Debarment", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
  ],
  // Madzir Kalid — Interpol, Medium
  // Customer: Name "Madzir Kalid" · YOB 1978 · COB Malaysia · DOB 17 Aug · Gender Male · Nationality MYS · Occupation N/A · Passport "B4412209" · Address Malaysia
  4: [
    { label: "MADZIR, Kalid",     sublabel: "Interpol",    risk: "high",   nodeType: "person" as const, matchScore: 63, matchedAttributeIndices: [12,13,14,17,18],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADZIR, Kalid",  match: true  },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1978",            match: true  },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Malaysia",        match: true  },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "17 Aug",          match: true  },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADZIR, Kalid",  match: true  },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "MYS",             match: true  },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "B4412209",        match: true  },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "Kalid Madzir",      sublabel: "Interpol",    risk: "high",   nodeType: "person" as const, matchScore: 58, matchedAttributeIndices: [12,13,14,17],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "Kalid Madzir",   match: true  },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1978",            match: true  },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Malaysia",        match: true  },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "17 Aug",          match: true  },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "Kalid Madzir",   match: true  },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "MYS",             match: true  },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "B4412229",        match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MADZIR, Khalid",    sublabel: "OFAC SDN",    risk: "high",   nodeType: "person" as const, matchScore: 54, matchedAttributeIndices: [12,13,18],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADZIR, Khalid", match: true  },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1978",            match: true  },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Indonesia",       match: false },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "17 Aug",          match: true  },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADZIR, Khalid", match: true  },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "IDN",             match: false },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MADZIR, Khaled",    sublabel: "UN",          risk: "high",   nodeType: "person" as const, matchScore: 49, matchedAttributeIndices: [12,19],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADZIR, Khaled", match: true  },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1980",            match: false },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Singapore",       match: false },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "3 Mar",           match: false },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADZIR, Khaled", match: true  },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "SGP",             match: false },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MADIR, Kalid",      sublabel: "Interpol",    risk: "high",   nodeType: "person" as const, matchScore: 45, matchedAttributeIndices: [12,13,14,17],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADIR, Kalid",   match: false },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1978",            match: true  },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Malaysia",        match: true  },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "17 Aug",          match: true  },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADIR, Kalid",   match: false },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "MYS",             match: true  },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "M. KHALID",         sublabel: "OFAC SDN",    risk: "medium", nodeType: "person" as const, matchScore: 40, matchedAttributeIndices: [12,14,18],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "M. KHALID",      match: false },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1975",            match: false },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Malaysia",        match: true  },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "22 Oct",          match: false },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "M. KHALID",      match: false },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "MYS",             match: true  },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MADZIR, Callid",    sublabel: "EU Sanctions", risk: "medium", nodeType: "person" as const, matchScore: 36, matchedAttributeIndices: [12,20],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADZIR, Callid", match: true  },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1982",            match: false },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Australia",       match: false },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "5 Jun",           match: false },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADZIR, Callid", match: true  },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "AUS",             match: false },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MAZDIR, Kalid",     sublabel: "Interpol",    risk: "medium", nodeType: "person" as const, matchScore: 32, matchedAttributeIndices: [12,14,17],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MAZDIR, Kalid",  match: false },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1976",            match: false },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Malaysia",        match: true  },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "9 Nov",           match: false },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MAZDIR, Kalid",  match: false },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "MYS",             match: true  },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MADZIR, Kalit",     sublabel: "UN",          risk: "medium", nodeType: "person" as const, matchScore: 28, matchedAttributeIndices: [12,19],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADZIR, Kalit",  match: true  },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1984",            match: false },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Singapore",       match: false },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "14 Apr",          match: false },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADZIR, Kalit",  match: true  },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "SGP",             match: false },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MADZEER, Kalid",    sublabel: "Interpol",    risk: "medium", nodeType: "person" as const, matchScore: 24, matchedAttributeIndices: [12,14,17],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADZEER, Kalid", match: false },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1980",            match: false },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Malaysia",        match: true  },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "30 Jan",          match: false },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADZEER, Kalid", match: false },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "MYS",             match: true  },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MADZIR, K.",        sublabel: "World Bank",  risk: "low",    nodeType: "person" as const, matchScore: 18, matchedAttributeIndices: [12,21],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADZIR, K.",     match: true  },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "Unknown",         match: false },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Indonesia",       match: false },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "Unknown",         match: false },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADZIR, K.",     match: true  },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "IDN",             match: false },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    { label: "MADZIRI, Kalid",    sublabel: "Interpol",    risk: "low",    nodeType: "person" as const, matchScore: 14, matchedAttributeIndices: [12,14,17],
      matchFields: [
        { field: "Name",                        customer: "Madzir Kalid",  watchlist: "MADZIRI, Kalid", match: false },
        { field: "Year of Birth (YOB)",         customer: "1978",          watchlist: "1987",            match: false },
        { field: "Country of Birth",            customer: "Malaysia",      watchlist: "Malaysia",        match: true  },
        { field: "Day of Birth (DOB)",          customer: "17 Aug",        watchlist: "2 Jul",           match: false },
        { field: "Deceased Status",             customer: "FALSE",         watchlist: "FALSE",           match: true  },
        { field: "Primary Name",               customer: "MADZIR, Kalid", watchlist: "MADZIRI, Kalid", match: false },
        { field: "Former or Alias Name",        customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Gender",                      customer: "Male",          watchlist: "N/A",             match: false },
        { field: "Nationality",                 customer: "MYS",           watchlist: "MYS",             match: true  },
        { field: "Occupation",                  customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Weak Link",                   customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "C2C",                         customer: "N/A",           watchlist: "N/A",             match: true  },
        { field: "Passport/Tax/Identification", customer: "B4412209",      watchlist: "N/A",             match: false },
        { field: "Address",                     customer: "Malaysia",      watchlist: "N/A",             match: false },
      ] },
    // attr indices 12–25: 14 identifier fields
    { label: "Name",                        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Year of Birth (YOB)",         sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Country of Birth",            sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Day of Birth (DOB)",          sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Deceased Status",             sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Primary Name",               sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Former or Alias Name",        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Gender",                      sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Nationality",                 sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Occupation",                  sublabel: "Profile",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Weak Link",                   sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "C2C",                         sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Passport/Tax/Identification", sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Address",                     sublabel: "Geo",      risk: "high" as const, nodeType: "attribute" as const, attrIcon: "address" as const },
    // worldcheck source nodes — indices 26–30
    { label: "Interpol Red Notices", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "OFAC SDN List",        sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "UN Consolidated List", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "EU Sanctions List",    sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "World Bank Debarment", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
  ],
  // Benjamin Bernard — Adverse Media, Medium
  // Customer: Name "Benjamin Bernard" · YOB 1983 · COB France · DOB 3 Jun · Gender Male · Nationality FRA · Passport "10FX39201" · Address "Paris, France"
  5: [
    { label: "BERNARD, Benjamin", sublabel: "Adverse Media", risk: "high",   nodeType: "person" as const, matchScore: 57, matchedAttributeIndices: [13,14,15,16,18],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNARD, Benjamin", match: true  },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1983",               match: true  },
        { field: "Country of Birth",            customer: "France",          watchlist: "France",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "3 Jun",              match: true  },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNARD, Benjamin", match: true  },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "FRA",                match: true  },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "Paris, France",      match: true  },
      ] },
    { label: "Benjamin BERNARD",  sublabel: "OFAC SDN",     risk: "high",   nodeType: "person" as const, matchScore: 53, matchedAttributeIndices: [13,14,15,19],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "Benjamin BERNARD",  match: true  },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1983",               match: true  },
        { field: "Country of Birth",            customer: "France",          watchlist: "France",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "3 Jun",              match: true  },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "Benjamin BERNARD",  match: true  },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "FRA",                match: true  },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "10FX39201",          match: true  },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BERNARD, Ben",      sublabel: "Interpol",     risk: "high",   nodeType: "person" as const, matchScore: 48, matchedAttributeIndices: [13,15,20],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNARD, Ben",      match: true  },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1983",               match: true  },
        { field: "Country of Birth",            customer: "France",          watchlist: "France",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "9 Jun",              match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNARD, Ben",      match: true  },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "FRA",                match: true  },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BERNHARD, Benjamin", sublabel: "EU Sanctions", risk: "high",  nodeType: "person" as const, matchScore: 44, matchedAttributeIndices: [13,14,21],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNHARD, Benjamin",match: false },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1983",               match: true  },
        { field: "Country of Birth",            customer: "France",          watchlist: "Germany",            match: false },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "3 Jun",              match: true  },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNHARD, Benjamin",match: false },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "Male",               match: true  },
        { field: "Nationality",                 customer: "FRA",             watchlist: "DEU",                match: false },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BERNARD, Benjamen", sublabel: "Adverse Media",  risk: "high",  nodeType: "person" as const, matchScore: 40, matchedAttributeIndices: [13,18],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNARD, Benjamen",match: true  },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1981",               match: false },
        { field: "Country of Birth",            customer: "France",          watchlist: "Belgium",            match: false },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "14 Feb",             match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNARD, Benjamen",match: true  },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "BEL",                match: false },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BENARD, Benjamin",  sublabel: "Interpol",      risk: "medium", nodeType: "person" as const, matchScore: 36, matchedAttributeIndices: [13,14,20],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BENARD, Benjamin",  match: false },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1983",               match: true  },
        { field: "Country of Birth",            customer: "France",          watchlist: "Switzerland",        match: false },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "3 Jun",              match: true  },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BENARD, Benjamin",  match: false },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "CHE",                match: false },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BERNARD, Benjmin",  sublabel: "OFAC SDN",      risk: "medium", nodeType: "person" as const, matchScore: 32, matchedAttributeIndices: [13,15,19],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNARD, Benjmin",  match: true  },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1985",               match: false },
        { field: "Country of Birth",            customer: "France",          watchlist: "France",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "11 Sep",             match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNARD, Benjmin",  match: true  },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "FRA",                match: true  },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BERNERD, Benjamin", sublabel: "EU Sanctions",   risk: "medium", nodeType: "person" as const, matchScore: 28, matchedAttributeIndices: [13,21],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNERD, Benjamin", match: false },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1980",               match: false },
        { field: "Country of Birth",            customer: "France",          watchlist: "Netherlands",        match: false },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "27 Jul",             match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNERD, Benjamin", match: false },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "Male",               match: true  },
        { field: "Nationality",                 customer: "FRA",             watchlist: "NLD",                match: false },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BEN, Bernard",      sublabel: "Adverse Media",  risk: "medium", nodeType: "person" as const, matchScore: 24, matchedAttributeIndices: [13,15,18],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BEN, Bernard",       match: false },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1979",               match: false },
        { field: "Country of Birth",            customer: "France",          watchlist: "France",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "20 Mar",             match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BEN, Bernard",       match: false },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "FRA",                match: true  },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BERNARD, Benji",    sublabel: "Interpol",       risk: "medium", nodeType: "person" as const, matchScore: 20, matchedAttributeIndices: [13,15,20],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNARD, Benji",    match: true  },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1982",               match: false },
        { field: "Country of Birth",            customer: "France",          watchlist: "France",             match: true  },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "1 Dec",              match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNARD, Benji",    match: true  },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "FRA",                match: true  },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "B. BERNARD",        sublabel: "World Bank",     risk: "low",    nodeType: "person" as const, matchScore: 16, matchedAttributeIndices: [13,22],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "B. BERNARD",        match: false },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "Unknown",            match: false },
        { field: "Country of Birth",            customer: "France",          watchlist: "Unknown",            match: false },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "Unknown",            match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "B. BERNARD",        match: false },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "Unknown",            match: false },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BERNARD, Beniamin", sublabel: "EU Sanctions",   risk: "low",    nodeType: "person" as const, matchScore: 12, matchedAttributeIndices: [13,21],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNARD, Beniamin", match: true  },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1990",               match: false },
        { field: "Country of Birth",            customer: "France",          watchlist: "Poland",             match: false },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "8 Oct",              match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNARD, Beniamin", match: true  },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "POL",                match: false },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    { label: "BERNHARD, Ben",     sublabel: "Interpol",       risk: "low",    nodeType: "person" as const, matchScore: 10, matchedAttributeIndices: [13,20],
      matchFields: [
        { field: "Name",                        customer: "Benjamin Bernard", watchlist: "BERNHARD, Ben",     match: false },
        { field: "Year of Birth (YOB)",         customer: "1983",            watchlist: "1988",               match: false },
        { field: "Country of Birth",            customer: "France",          watchlist: "Germany",            match: false },
        { field: "Day of Birth (DOB)",          customer: "3 Jun",           watchlist: "15 Feb",             match: false },
        { field: "Deceased Status",             customer: "FALSE",           watchlist: "FALSE",              match: true  },
        { field: "Primary Name",               customer: "BERNARD, Benjamin",watchlist: "BERNHARD, Ben",     match: false },
        { field: "Former or Alias Name",        customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Gender",                      customer: "Male",            watchlist: "N/A",                match: false },
        { field: "Nationality",                 customer: "FRA",             watchlist: "DEU",                match: false },
        { field: "Occupation",                  customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Weak Link",                   customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "C2C",                         customer: "N/A",             watchlist: "N/A",                match: true  },
        { field: "Passport/Tax/Identification", customer: "10FX39201",       watchlist: "N/A",                match: false },
        { field: "Address",                     customer: "Paris, France",   watchlist: "N/A",                match: false },
      ] },
    // attr indices 13–26: 14 identifier fields
    { label: "Name",                        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Year of Birth (YOB)",         sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Country of Birth",            sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Day of Birth (DOB)",          sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "dob"     as const },
    { label: "Deceased Status",             sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Primary Name",               sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Former or Alias Name",        sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "name"    as const },
    { label: "Gender",                      sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Nationality",                 sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Occupation",                  sublabel: "Profile",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Weak Link",                   sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "C2C",                         sublabel: "Linkage",  risk: "high" as const, nodeType: "attribute" as const, attrIcon: "bank"    as const },
    { label: "Passport/Tax/Identification", sublabel: "Identity", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "id"      as const },
    { label: "Address",                     sublabel: "Geo",      risk: "high" as const, nodeType: "attribute" as const, attrIcon: "address" as const },
    // worldcheck source nodes — indices 27–31
    { label: "Adverse Media DB",     sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "OFAC SDN List",        sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "Interpol Red Notices", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "EU Sanctions List",    sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
    { label: "World Bank Debarment", sublabel: "WorldCheck", risk: "high" as const, nodeType: "attribute" as const, attrIcon: "source" as const },
  ],
};

// ─── Chat helpers ─────────────────────────────────────────────────────────────

type CopilotStep = 'overview' | 'identity' | 'sources' | 'adverse-news' | 'network' | 'complete';
type ChatMsg = {
  role: "ai" | "user";
  content: string;
  copilotStep?: CopilotStep;
  articleWidgetIdx?: number;
  reasoning?: {
    phases: string[];
    thoughts: string[];
    tasks: { title: string; description?: string; status: 'completed' | 'in-progress' | 'pending' }[];
    done?: boolean;
  };
};

function getInitialMessages(_c: typeof cases[0]): ChatMsg[] {
  return [{
    role: "ai", content: "", reasoning: {
      phases: ["Analyzing case", "Reviewing identifiers", "Assessing confidence"],
      thoughts: [
        "Cross-referencing customer identifiers against watchlist record…",
        "Scoring name phonetics, DOB proximity, and jurisdiction overlap…",
        "Calculating weighted field similarity and overall match confidence…",
      ],
      tasks: [
        { title: "Load case data", description: "Reading customer profile and watchlist record", status: "completed" as const },
        { title: "Compare identifiers", description: "Field-by-field similarity scoring", status: "in-progress" as const },
        { title: "Score match confidence", description: "Applying weighted scoring model", status: "pending" as const },
      ],
    },
  }];
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

const SECONDARY_FIELDS = new Set(["Primary Name","Former or Alias Name","Gender","Nationality","Occupation","Weak Link","C2C","Passport/Tax/Identification","Address"]);

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

function CaseListItem({ item, selected, onClick, darkMode, pinned, topMatchFields }: {
  item: typeof cases[0]; selected: boolean; onClick: () => void; darkMode: boolean; pinned?: boolean;
  topMatchFields?: Array<{ match: boolean }> | null;
}) {
  const dm = (l: string, d: string) => darkMode ? d : l;
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left px-3 py-3 transition-colors border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
        selected
          ? dm("bg-indigo-100/80", "bg-indigo-500/10")
          : dm("hover:bg-gray-100/70", "hover:bg-white/[0.05]")
      }`}
      style={{ borderColor: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}
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
            <span className={`text-sm truncate ${item.unread
              ? `font-semibold ${dm("text-gray-900","text-white")}`
              : `font-medium ${dm("text-gray-800","text-slate-200")}`}`}>
              {item.customerName}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {pinned && <Pin className={`h-2.5 w-2.5 fill-current ${dm("text-indigo-500","text-indigo-400")}`} />}
              <span className={`text-xs tabular-nums ${dm("text-gray-500","text-gray-400")}`}>{item.time}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[13px] truncate flex-1 min-w-0 ${dm("text-gray-700","text-gray-400")}`}>
              ↔ <span className="font-medium">{item.watchlistName}</span>
            </span>
            <span className={`text-xs font-semibold flex-shrink-0 ${riskTextColor[item.risk]}`}>{item.confidence}%</span>
          </div>
          <div className="flex items-center gap-2">
            {topMatchFields && topMatchFields.length > 0 && (() => {
              const secondary = topMatchFields.slice(5, 14);
              const secMatched = secondary.filter(f => f.match).length;
              const isHigh = secMatched >= 7;
              const matched = topMatchFields.filter(f => f.match).length;
              const total   = topMatchFields.length;
              return (
                <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={isHigh
                  ? { background: darkMode ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.10)", color: darkMode ? "rgb(252,165,165)" : "rgb(185,28,28)", border: `1px solid ${darkMode ? "rgba(239,68,68,0.28)" : "rgba(239,68,68,0.25)"}` }
                  : { background: darkMode ? "rgba(251,146,60,0.15)" : "rgba(251,146,60,0.10)", color: darkMode ? "rgb(253,186,116)" : "rgb(194,65,12)", border: `1px solid ${darkMode ? "rgba(251,146,60,0.25)" : "rgba(251,146,60,0.30)"}` }
                }>
                  {matched}/{total} identifiers
                </span>
              );
            })()}
            <p className={`text-xs ${dm("text-gray-600","text-gray-500")}`}>
              {item.matchCount} total matches
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [collapsed, setCollapsed]           = useState(true);
  const [darkMode, setDarkMode]             = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  const [caseListOpen, setCaseListOpen]     = useState(true);
  const [caseListWidth, setCaseListWidth]   = useState(288);
  const [chatPanelWidth, setChatPanelWidth] = useState(380);
  const [chatCollapsed, setChatCollapsed]   = useState(false);
  const [pinnedCaseIds, setPinnedCaseIds]   = useState<Set<number>>(new Set());
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseTab, setCaseTab]               = useState<"overview"|"details"|"caselog"|"audit">("overview");
  const [networkVisible, setNetworkVisible] = useState(true);
  const [forceExpandPanel, setForceExpandPanel] = useState(false);
  const [dispositionSubmitted, setDispositionSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt]             = useState<string>("");
  const [submittedChoice, setSubmittedChoice]     = useState<"false-positive"|"true-hit-high"|"true-hit-medium"|null>(null);
  const [submittedComment, setSubmittedComment]   = useState<string>("");
  const [isChangingDisposition, setIsChangingDisposition] = useState(false);
  const [changeReason, setChangeReason]           = useState("");
  const [auditLog, setAuditLog]                   = useState<{title:string;desc:string;tags:string[];time:string}[]>([]);
  const [chatInput, setChatInput]           = useState("");
  const [chatMessages, setChatMessages]     = useState<ChatMsg[]>([]);
  const [comparisonNode, setComparisonNode] = useState<FraudNode | null>(null);
  const [sourceActiveLabels, setSourceActiveLabels] = useState<string[] | null>(null);
  const [activeAttrLabel, setActiveAttrLabel]       = useState<string | null>(null);
  const [rightPaneOpen, setRightPaneOpen] = useState(true);
  const [rightPaneWidth, setRightPaneWidth] = useState(400);
  const [caseFilter, setCaseFilter] = useState<"all" | "unread" | "high" | "low">("all");
  const [dispositionChoice, setDispositionChoice] = useState<"false-positive" | "true-hit-high" | "true-hit-medium" | null>(null);
  const [trueHitStep, setTrueHitStep] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifsRead, setNotifsRead] = useState<number[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [dispositionComment, setDispositionComment] = useState("");
  const [adverseDetail, setAdverseDetail]     = useState<{ outlet: string; date: string; headline: string; sourceType?: "worldcheck" | "adverse"; tags?: string; origIdx?: number } | null>(null);
  const [adverseArticleIdx, setAdverseArticleIdx] = useState(0);
  const [aiGuidanceStep, setAiGuidanceStep]   = useState<'overview'|'identity'|'sources'|'adverse-news'|'network'|'complete'>('overview');
  const [reviewState, setReviewState]         = useState({ identityReviewed: false, watchlistReviewed: false, adverseNewsReviewed: false, networkReviewed: false });
  const [accordionValue, setAccordionValue]   = useState<string[]>(["identifiers"]);
  const [submittedNodes, setSubmittedNodes]   = useState<Map<string, "false-positive"|"true-hit-high"|"true-hit-medium">>(new Map());
  const [forcedAutoDisposed, setForcedAutoDisposed] = useState<Set<string>>(new Set());
  const [pulseSection, setPulseSection]       = useState<string|null>(null);
  const [adverseSearchState, setAdverseSearchState] = useState<'idle'|'loading'|'complete'>('idle');
  const [adverseAttrNodes, setAdverseAttrNodes]     = useState<FraudNode[]>([]);
  const [primaryScoreBoost, setPrimaryScoreBoost]   = useState(0);
  const [adverseMatchUnlocked, setAdverseMatchUnlocked] = useState(false);
  const [adverseArticleStatuses, setAdverseArticleStatuses] = useState<Record<number, 'pending'|'added'|'excluded'>>({});
  const [adverseArticlePopupIdx, setAdverseArticlePopupIdx] = useState<number | null>(null);
  const [adverseAddingSet, setAdverseAddingSet]     = useState<Set<number>>(new Set());
  const [confirmRemoveIdx, setConfirmRemoveIdx]     = useState<number | null>(null);
  const [searchOpen, setSearchOpen]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState("");
  const [caseLogColWidths, setCaseLogColWidths] = useState<number[]>([20, 55, 140, 72, 72, 72, 110, 130, 130, 90, 260]);
  const [caseLogUnread, setCaseLogUnread]       = useState(false);
  const [caseLogSortCol, setCaseLogSortCol]     = useState<string>("Last Updated");
  const [caseLogSortDir, setCaseLogSortDir]     = useState<"asc"|"desc">("desc");
  const caseLogResizeRef = useRef<{ col: number; startX: number; startWidth: number } | null>(null);
  const chatEndRef                            = useRef<HTMLDivElement>(null);
  const chatScrollRef                         = useRef<HTMLDivElement>(null);
  const prevMsgCountRef                       = useRef(0);
  const searchInputRef                        = useRef<HTMLInputElement>(null);
  const typeoutRef                            = useRef<ReturnType<typeof setInterval> | null>(null);

  const RAIL_WIDTH = 44;

  // ── Panel handlers ────────────────────────────────────────────────────────
  const hideNetwork = () => {
    if (!rightPaneOpen) setRightPaneOpen(true);
    setNetworkVisible(false);
    setForceExpandPanel(false);
  };
  const showNetwork = () => setNetworkVisible(true);
  const collapseMatchAnalysis = () => { if (networkVisible) setRightPaneOpen(false); };
  const restoreMatchAnalysis  = () => setRightPaneOpen(true);

  // Guard: match analysis and network can never both be hidden
  useEffect(() => {
    if (!networkVisible && !rightPaneOpen) setRightPaneOpen(true);
  }, [networkVisible]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setTimeout(() => {
        setChatMessages(prev => prev.map(m => m.reasoning && !m.reasoning.done ? { ...m, reasoning: { ...m.reasoning, done: true } } : m));
        setTimeout(() => setChatMessages(prev => [...prev, { role: "ai" as const, content: "", copilotStep: "overview" as const }]), 300);
      }, 4000);
      setChatInput("");
      setCaseTab("overview");
      setDispositionChoice(null);
      setTrueHitStep(false);
      setRegenerating(false);
      setDispositionComment("");
      setDispositionSubmitted(false);
      setSubmittedAt("");
      setSubmittedChoice(null);
      setSubmittedComment("");
      setIsChangingDisposition(false);
      setChangeReason("");
      setAuditLog([]);
      setAdverseDetail(null);
      setAiGuidanceStep('overview');
      setReviewState({ identityReviewed: false, watchlistReviewed: false, adverseNewsReviewed: false, networkReviewed: false });
      setAccordionValue(["identifiers"]);
      setPulseSection(null);
      setTimeout(() => setPulseSection('identifiers'), 400);
      setSubmittedNodes(new Map());
      setForcedAutoDisposed(new Set());
      setAdverseSearchState('idle');
      setAdverseAttrNodes([]);
      setPrimaryScoreBoost(0);
      setAdverseMatchUnlocked(false);
      const caseNodes = CASE_NODES[selectedCaseId as number] ?? [];
      const defaultNode = caseNodes.find((n: FraudNode) => n.risk === "critical") ?? caseNodes.find((n: FraudNode) => n.risk === "high") ?? caseNodes[0] ?? null;
      setComparisonNode(defaultNode);
      setSourceActiveLabels(null);
      setRightPaneOpen(true);
    }
  }, [selectedCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll chat so the reader sees from the right entry point when new messages arrive
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const prev = prevMsgCountRef.current;
    const curr = chatMessages.length;
    const added = curr - prev;

    if (added > 0 && prev > 0) {
      // For a batch of purely AI messages (e.g. 4 article widgets), anchor to the
      // message just before the batch so context stays visible at the top.
      // When the first new message is from the user (user bubble + reasoning), scroll
      // to the user message itself so the turn starts in view.
      const firstNewIsUser = chatMessages[prev]?.role === "user";
      const anchorIdx = (!firstNewIsUser && added > 1) ? Math.max(0, prev - 1) : prev;
      const target = el.querySelector<HTMLElement>(`[data-msg-index="${anchorIdx}"]`);
      if (target) {
        const containerTop = el.getBoundingClientRect().top;
        const elemTop = target.getBoundingClientRect().top;
        el.scrollTo({ top: el.scrollTop + (elemTop - containerTop) - 12, behavior: "smooth" });
      }
    } else if (curr > 0 && prev === 0) {
      // Very first batch — scroll to bottom so initial summary is visible
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    prevMsgCountRef.current = curr;
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
    // If match analysis is showing a different node, snap it to the primary node the search is about
    const personNodes = (CASE_NODES[selectedCaseId as number] ?? []).filter((n: FraudNode) => n.nodeType !== "attribute");
    const primaryNode = personNodes.length > 0 ? personNodes.reduce((b: FraudNode, n: FraudNode) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b, personNodes[0]) : null;
    if (primaryNode && comparisonNode?.label !== primaryNode.label) {
      setAdverseDetail(null);
      setComparisonNode(primaryNode);
      setDispositionChoice(null);
      setDispositionComment("");
      setDispositionSubmitted(false);
      setTrueHitStep(false);
    }
    setAdverseSearchState('loading');
    setRightPaneOpen(true);
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
    // Inject skeleton placeholder news nodes immediately so they appear on canvas while loading
    setAdverseAttrNodes([
      { label: "Loading…", attrIcon: "news" as const, nodeType: "attribute" as const, risk: "high" as const, isTrueHit: false, isLoading: true },
      { label: "Loading…", attrIcon: "news" as const, nodeType: "attribute" as const, risk: "high" as const, isTrueHit: false, isLoading: true },
      { label: "Loading…", attrIcon: "news" as const, nodeType: "attribute" as const, risk: "high" as const, isTrueHit: false, isLoading: true },
      { label: "Loading…", attrIcon: "news" as const, nodeType: "attribute" as const, risk: "high" as const, isTrueHit: false, isLoading: true },
    ]);
    // Collapse identifiers accordion so attention shifts to the news nodes being added
    setAccordionValue(prev => prev.filter(v => v !== 'identifiers'));
    setTimeout(() => {
      setChatMessages(prev => prev.map(m => m.reasoning && !m.reasoning.done ? { ...m, reasoning: { ...m.reasoning, done: true } } : m));
      setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', copilotStep: 'sources' as const }]);
    }, 4000);
    setTimeout(() => {
      setAdverseSearchState('complete');
      setReviewState(s => ({ ...s, adverseNewsReviewed: true }));
      // Adverse news corroborates one more identifier — boost primary node score 90→93
      setPrimaryScoreBoost(3);
      setAdverseMatchUnlocked(true);
      setComparisonNode(prev => {
        if (!prev || prev.nodeType === "attribute") return prev;
        const pNodes = (CASE_NODES[selectedCaseId as number] ?? []).filter((n: FraudNode) => n.nodeType !== "attribute");
        const primary = pNodes.length > 0 ? pNodes.reduce((b: FraudNode, n: FraudNode) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b, pNodes[0]) : null;
        if (!primary || prev.label !== primary.label) return prev;
        return {
          ...prev,
          matchScore: 93,
          matchFields: prev.matchFields?.map(f => f.field === "Occupation" ? { ...f, match: true } : f),
        };
      });
      // Replace skeletons with real nodes — 4 articles, sublabel is fixed source type label
      setAdverseAttrNodes(ADVERSE_ARTICLES.map(art => ({
        label:    art.outlet,
        sublabel: "Verified News Source",
        attrIcon: "news" as const,
        nodeType: "attribute" as const,
        risk:     "high" as const,
        isTrueHit: false,
        isLoading: false,
      })));
      // Init all articles as pending — user must explicitly add each to evidence
      setAdverseArticleStatuses({ 0: 'pending', 1: 'pending', 2: 'pending', 3: 'pending' });
      setAdverseAddingSet(new Set());
      // Inject slim article widget messages into chat
      ADVERSE_ARTICLES.forEach((_, idx) => {
        setChatMessages(prev => [...prev, { role: 'ai' as const, content: '', articleWidgetIdx: idx }]);
      });
    }, 5200);
  };

  const handleAddToEvidence = (idx: number) => {
    setAdverseAddingSet(prev => new Set([...prev, idx]));
    setAdverseArticlePopupIdx(null);
    setTimeout(() => {
      setAdverseArticleStatuses(prev => ({ ...prev, [idx]: 'added' }));
      setAdverseAddingSet(prev => { const s = new Set(prev); s.delete(idx); return s; });
    }, 900);
  };

  const handleDontInclude = (idx: number) => {
    setAdverseArticleStatuses(prev => ({ ...prev, [idx]: 'excluded' }));
    setAdverseArticlePopupIdx(null);
  };
  const handleReviewAdverseNews = () => {
    setAdverseArticleIdx(0);
    setAdverseDetail(ADVERSE_ARTICLES[0]);
    setRightPaneOpen(true);
    setAccordionValue(prev => [...new Set([...prev, 'sources'])]);
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
    background: darkMode ? "rgba(10,8,22,0.08)" : "rgba(255,255,255,0.52)",
    backdropFilter: darkMode ? undefined : "blur(32px) saturate(1.6)",
    WebkitBackdropFilter: darkMode ? undefined : "blur(32px) saturate(1.6)",
    border: `1px solid ${darkMode ? "rgba(255,255,255,0.11)" : "rgba(99,102,241,0.22)"}`,
    boxShadow: darkMode
      ? "0 4px 40px rgba(0,0,0,0.65)"
      : "0 4px 32px rgba(99,102,241,0.10), inset 0 1px 0 rgba(255,255,255,0.80)",
  };

  const innerCardStyle = {
    border: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(99,102,241,0.15)"}`,
    background: darkMode ? "rgba(28,22,52,0.01)" : "rgba(255,255,255,0.48)",
    backdropFilter: darkMode ? "blur(20px) saturate(1.8) brightness(0.80)" : "blur(52px) saturate(1.6)",
    WebkitBackdropFilter: darkMode ? "blur(20px) saturate(1.8) brightness(0.80)" : "blur(52px) saturate(1.6)",
    boxShadow: darkMode
      ? "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 0.5px rgba(255,255,255,0.04)"
      : "0 2px 16px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.80)",
  };

  const barStyle = {
    borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(99,102,241,0.14)"}`,
    background: darkMode ? "rgba(10,8,22,0.30)" : "rgba(255,255,255,0.50)",
    backdropFilter: "blur(24px) saturate(1.6)",
    WebkitBackdropFilter: "blur(24px) saturate(1.6)",
  };

  const chatPanelStyle = {
    background: darkMode ? "rgba(8,6,22,0.06)" : "rgba(255,255,255,0.48)",
    backdropFilter: darkMode ? "blur(20px) saturate(1.8) brightness(0.82)" : "blur(60px) saturate(1.6) brightness(1.02)",
    WebkitBackdropFilter: darkMode ? "blur(20px) saturate(1.8) brightness(0.82)" : "blur(60px) saturate(1.6) brightness(1.02)",
    borderLeft: `1px solid ${darkMode ? "rgba(139,92,246,0.18)" : "rgba(99,102,241,0.20)"}`,
    boxShadow: darkMode
      ? "inset 1px 0 0 rgba(139,92,246,0.12), -4px 0 32px rgba(0,0,0,0.35)"
      : "inset 1px 0 0 rgba(99,102,241,0.10), -4px 0 24px rgba(99,102,241,0.06)",
  };

  const caseNodes = selectedCase ? (() => {
    const all = CASE_NODES[selectedCase.id] ?? [];
    const persons = all.filter((n: FraudNode) => n.nodeType !== "attribute")
      .sort((a: FraudNode, b: FraudNode) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      .slice(0, 7);
    // Build field→customer-value map from strongest person node
    const strongest = persons[0];
    const valueMap: Record<string, string> = {};
    (strongest?.matchFields ?? []).forEach(f => { if (f.customer && f.customer !== "N/A") valueMap[f.field] = f.customer; });
    // Collect source keys that the top-7 persons actually reference
    const personSourceKeys = new Set(persons.map((n: FraudNode) => {
      const l = (n.sublabel ?? "").toLowerCase();
      if (l.includes("ofac") || l.includes("sdn")) return "ofac";
      if (l.includes("interpol"))  return "interpol";
      if (l.includes("world bank")) return "world bank";
      if (l.includes("adverse"))   return "adverse";
      if (l.includes("un pep"))    return "un pep";
      if (l.includes("eu pep"))    return "eu pep";
      if (l.includes("un ") || l === "un sanctions" || l === "un") return "un";
      if (l.includes("eu ") || l === "eu sanctions") return "eu";
      if (l.includes("pep"))       return "pep";
      return l;
    }));
    let primaryCount = 0;
    const attrs = all.filter((n: FraudNode) => n.nodeType === "attribute").filter((n: FraudNode) => {
      if (n.attrIcon !== "source") return true;
      // Only keep source nodes whose list is referenced by at least one top-7 person
      const lbl = n.label.toLowerCase();
      for (const key of personSourceKeys) {
        if (lbl.includes(key)) return true;
      }
      return false;
    }).map((n: FraudNode) => {
      if (n.attrIcon === "source" || n.attrIcon === "news") return n;
      const group: "primary" | "secondary" = primaryCount < 5 ? "primary" : "secondary";
      primaryCount++;
      return { ...n, attrGroup: group, sublabel: valueMap[n.label] ?? n.sublabel };
    });
    return [...persons, ...attrs];
  })() : [];
  const displayNodes = useMemo(() => caseNodes.map(n => ({
    ...n,
    isDisposed:   submittedNodes.has(n.label),
    isTrueHit:    (() => { const s = submittedNodes.get(n.label); return !!s && s !== "false-positive"; })(),
    isForcedAuto: forcedAutoDisposed.has(n.label),
    matchFields: adverseMatchUnlocked && n.label === "LI, Bin"
      ? n.matchFields?.map(f => f.field === "Occupation" ? { ...f, match: true } : f)
      : n.matchFields,
  })), [caseNodes, submittedNodes, forcedAutoDisposed, adverseMatchUnlocked]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeNodes  = caseNodes.filter(n => !submittedNodes.has(n.label));
  const critNodes    = caseNodes.filter(n => n.nodeType !== "attribute" && n.risk === "critical").length;
  const highNodes    = caseNodes.filter(n => n.nodeType !== "attribute" && n.risk === "high").length;
  const strongestNode = caseNodes.length > 0 ? caseNodes.reduce((b, n) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b, caseNodes[0]) : null;
  const isReasoningLoading = chatMessages.some(m => m.reasoning && !m.reasoning.done) && !chatMessages.some(m => m.copilotStep);

  // Ordered list of all source detail items traversable in the right pane:
  // WorldCheck sources (always present) + adverse articles added to evidence
  const traversableSourceItems = useMemo(() => [
    ...WORLDCHECK_SOURCE_DETAILS,
    ...ADVERSE_ARTICLES
      .map((art, i) => ({ ...art, sourceType: "adverse" as const, origIdx: i }))
      .filter(item => adverseArticleStatuses[item.origIdx] === "added"),
  ], [adverseArticleStatuses]);

  // Filter out news nodes for articles the user has excluded
  const visibleAdverseAttrNodes = useMemo(() =>
    adverseAttrNodes.filter((_, i) => adverseArticleStatuses[i] !== 'excluded'),
    [adverseAttrNodes, adverseArticleStatuses]
  );

  // Combine display nodes with dynamic adverse-news attr nodes
  const canvasNodes = useMemo(() => {
    if (visibleAdverseAttrNodes.length === 0) return displayNodes;
    const baseIdx = displayNodes.length;
    const personIdxByScore = displayNodes
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => n.nodeType !== "attribute")
      .sort((a, b) => (b.n.matchScore ?? 0) - (a.n.matchScore ?? 0));
    const primaryIdx   = personIdxByScore[0]?.i ?? -1;
    const secondaryIdx = personIdxByScore[1]?.i ?? -1;
    const tertiaryIdx  = personIdxByScore[2]?.i ?? -1;
    const newsIndices  = visibleAdverseAttrNodes.map((_, ai) => baseIdx + ai);
    const adverseLoaded = visibleAdverseAttrNodes.every(n => !n.isLoading);
    return displayNodes.map((n, i) => {
      if (i === primaryIdx) {
        return {
          ...n,
          matchScore: adverseLoaded ? (n.matchScore ?? 0) + primaryScoreBoost : n.matchScore,
          matchedAttributeIndices: [...(n.matchedAttributeIndices ?? []), ...newsIndices],
        };
      }
      if (i === secondaryIdx && newsIndices.length > 0) {
        return {
          ...n,
          matchedAttributeIndices: [...(n.matchedAttributeIndices ?? []), newsIndices[0]],
        };
      }
      if (i === tertiaryIdx && newsIndices.length > 2) {
        return {
          ...n,
          matchedAttributeIndices: [...(n.matchedAttributeIndices ?? []), newsIndices[2]],
        };
      }
      return n;
    }).concat(visibleAdverseAttrNodes.map(n => ({ ...n, matchFields: n.matchFields, isDisposed: false, isTrueHit: false, isForcedAuto: false })));
  }, [displayNodes, visibleAdverseAttrNodes, primaryScoreBoost]); // eslint-disable-line react-hooks/exhaustive-deps

  // While the initial reasoning is loading, show all surrounding nodes as skeleton placeholders.
  // Also derives matchedAttributeIndices dynamically from matchFields so each person node
  // connects to exactly the identifier attr nodes it actually matches, plus its source node.
  const graphNodes = useMemo(() => {
    const base = isReasoningLoading
      ? canvasNodes.filter(n => n.nodeType === "person").map(n => ({ ...n, isLoading: true }))
      : canvasNodes;
    // Build label→index map for identifier attr nodes (non-WorldCheck attributes)
    const fieldAttrMap: Record<string, number> = {};
    base.forEach((n, i) => {
      if (n.nodeType === "attribute" && n.sublabel !== "WorldCheck") fieldAttrMap[n.label] = i;
    });
    // Map person sublabel to partial source label for fuzzy match
    const sublabelKey = (s: string) => {
      const l = s.toLowerCase();
      if (l.includes("ofac")) return "ofac";
      if (l.includes("interpol")) return "interpol";
      if (l.includes("world bank")) return "world bank";
      if (l.includes("adverse")) return "adverse";
      if (l === "un pep" || l === "un pep list") return "un pep";
      if (l === "eu pep" || l === "eu pep list") return "eu pep";
      if (l.includes("un ") || l === "un sanctions") return "un ";
      if (l.includes("eu ") || l === "eu sanctions") return "eu ";
      if (l.includes("pep")) return "pep";
      return l;
    };
    return base.map(node => {
      if (node.nodeType !== "person" || !node.matchFields?.length) return node;
      const identifierIndices = node.matchFields
        .map((f, fi) => (f.match && fieldAttrMap[f.field] !== undefined ? fieldAttrMap[f.field] : -1))
        .filter(i => i >= 0);
      const key = sublabelKey(node.sublabel ?? "");
      const sourceIdx = base.findIndex(n =>
        n.nodeType === "attribute" && n.sublabel === "WorldCheck" && n.label.toLowerCase().includes(key)
      );
      const existingNewsIndices = (node.matchedAttributeIndices ?? []).filter(idx => base[idx]?.attrIcon === "news");
      const computed = [...identifierIndices, ...(sourceIdx >= 0 ? [sourceIdx] : []), ...existingNewsIndices];
      return computed.length ? { ...node, matchedAttributeIndices: computed } : node;
    });
  }, [isReasoningLoading, canvasNodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const riskInlineColor: Record<string,string> = {
    Critical: "#f87171", High: "#fb923c", Medium: "#fbbf24", Low: "#4ade80",
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden px-3 pb-3 pt-2 gap-2 relative${darkMode ? " dark" : ""}`}
      style={{
        background: darkMode
          ? "linear-gradient(155deg,#1e1340 0%,#160f32 35%,#110c26 65%,#0c081c 100%)"
          : "linear-gradient(135deg,#f4f2fa 0%,#eef1fb 40%,#f0edf9 70%,#eaf3f8 100%)",
      }}
    >
      {/* ── Remove from evidence confirmation dialog ── */}
      <Dialog open={confirmRemoveIdx !== null} onOpenChange={open => { if (!open) setConfirmRemoveIdx(null); }}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove from Found Sources?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this article from Found Sources? You can re-add it from the chat.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemoveIdx(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmRemoveIdx !== null) {
                setAdverseArticleStatuses(prev => ({ ...prev, [confirmRemoveIdx]: 'pending' }));
                if (adverseDetail && (adverseDetail as { origIdx?: number }).origIdx === confirmRemoveIdx) setAdverseDetail(null);
                setConfirmRemoveIdx(null);
              }
            }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Article detail popup ── */}
      {adverseArticlePopupIdx !== null && (() => {
        const popArt = ADVERSE_ARTICLES[adverseArticlePopupIdx];
        const popStatus = adverseArticleStatuses[adverseArticlePopupIdx];
        const popAdded = popStatus === 'added';
        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(4,2,14,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", animation: "search-backdrop-in 0.18s ease-out both" }}
            onClick={() => setAdverseArticlePopupIdx(null)}
          >
            <div
              style={{ width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", background: darkMode ? "rgba(12,9,26,0.98)" : "rgba(255,255,255,0.99)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)"}`, borderRadius: 16, boxShadow: darkMode ? "0 32px 96px rgba(0,0,0,0.80), 0 0 0 0.5px rgba(99,102,241,0.18)" : "0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(99,102,241,0.12)", overflow: "hidden", animation: "search-panel-in 0.2s cubic-bezier(0.16,1,0.3,1) both", position: "relative" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setAdverseArticlePopupIdx(null)}
                style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)" }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
                {/* Source row */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}>{popArt.outlet}</span>
                  <ExternalLink style={{ width: 11, height: 11, color: darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.30)", marginLeft: 5 }} />
                </div>
                <p style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", margin: "0 0 10px" }}>{popArt.date}</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)", lineHeight: 1.35, marginBottom: 12 }}>{popArt.headline}</p>
                {/* Tags */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "2px 8px" }}>
                    <AlertTriangle style={{ width: 10, height: 10 }} />Adverse News
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20, padding: "2px 8px" }}>
                    Web crawl
                  </span>
                  {popArt.topics.map((t, ti) => (
                    <span key={ti} style={{ display: "inline-flex", fontSize: 11, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.45)", background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`, borderRadius: 20, padding: "2px 8px" }}>
                      {t}
                    </span>
                  ))}
                </div>
                {/* Blurb */}
                <div style={{ background: darkMode ? "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(9,7,22,0.80) 70%) padding-box, linear-gradient(135deg, rgba(129,140,248,0.5) 0%, rgba(192,132,252,0.4) 50%, rgba(244,114,182,0.35) 100%) border-box" : "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(240,236,255,0.80) 100%) padding-box, linear-gradient(135deg, rgba(129,140,248,0.5) 0%, rgba(192,132,252,0.4) 50%, rgba(244,114,182,0.35) 100%) border-box", border: "1px solid transparent", borderRadius: 8, padding: "10px 12px", marginBottom: 18, fontSize: 12, color: darkMode ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.60)", lineHeight: 1.55 }}>
                  This article mentions <strong style={{ color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)", fontWeight: 600 }}>{selectedCase?.customerName}</strong> in relation to asset freezes and alleged links to sanctioned entities.
                </div>
                {/* Matched Person */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", marginBottom: 10 }}>Matched Person</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, padding: "10px 12px", borderRadius: 8, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold flex-shrink-0 ${darkMode ? (selectedCase?.colorDark ?? "") : (selectedCase?.colorLight ?? "")}`}>{selectedCase?.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)" }}>{selectedCase?.customerName}</div>
                    <div style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.40)", marginTop: 1 }}>↔ {selectedCase?.watchlistName}</div>
                  </div>
                  {(() => { const fields = comparisonNode?.matchFields ?? []; const matched = fields.filter(f => f.match).length; const total = fields.length; const score = (comparisonNode?.matchScore ?? selectedCase?.confidence ?? 0) + primaryScoreBoost; const col = score >= 80 ? "#ef4444" : score >= 60 ? "#f59e0b" : "#6b7280"; const bg = score >= 80 ? "rgba(239,68,68,0.12)" : score >= 60 ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.12)"; return <span style={{ fontSize: 11, fontWeight: 600, color: col, background: bg, borderRadius: 20, padding: "3px 9px", flexShrink: 0, whiteSpace: "nowrap" }}>{total ? `${matched}/${total} identifiers` : ""}{total ? " • " : ""}{score}% similarity</span>; })()}
                </div>
                {/* Identifiers Discovered */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", marginBottom: 10 }}>Identifiers Discovered <span style={{ color: darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(3)</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 18 }}>
                  {[
                    { icon: <User style={{ width: 13, height: 13 }} />, label: "Name",              value: selectedCase?.customerName },
                    { icon: <Globe style={{ width: 13, height: 13 }} />, label: "Nationality",     value: selectedCase?.id === 1 ? "China (PRC)" : selectedCase?.id === 2 ? "Bangladesh" : selectedCase?.id === 3 ? "Malaysia" : selectedCase?.id === 4 ? "Malaysia" : "France" },
                    { icon: <Building2 style={{ width: 13, height: 13 }} />, label: "Associated entity", value: (selectedCase?.id ?? 0) <= 2 ? "Front Co. Ltd" : "Horizon Advisory Ltd" },
                  ].map((row, ri, rarr) => (
                    <div key={ri} style={{ display: "grid", gridTemplateColumns: "18px 1fr 1fr", gap: 6, alignItems: "center", padding: "7px 0", borderBottom: ri < rarr.length - 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` : "none" }}>
                      <span style={{ color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)" }}>{row.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)" }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                {/* Matched in Article */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", marginBottom: 10 }}>Matched in Article <span style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>2 key excerpts</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {[
                    { para: "Paragraph 3", text: `...authorities identified `, highlighted: selectedCase?.customerName ?? "", after: ` as an associate of Horizon Directors Ltd, a company linked to sanctioned individuals...` },
                    { para: "Paragraph 6", text: `Assets belonging to `, highlighted: selectedCase?.customerName ?? "", after: ` and related entities have been frozen under the latest round of sanctions...` },
                  ].map((ex, ei) => (
                    <div key={ei} style={{ borderRadius: 8, border: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`, padding: "10px 12px", background: darkMode ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)" }}>
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
                {/* View full article */}
                <div style={{ padding: "12px 0 16px" }}>
                  <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, color: darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.70)" }}>
                    View full article <ExternalLink style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>

              {/* Footer actions */}
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}>
                {popAdded ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#4ade80" }}>
                    <Check style={{ width: 14, height: 14 }} /> Added to evidence
                  </span>
                ) : (<>
                  <button
                    onClick={() => handleDontInclude(adverseArticlePopupIdx!)}
                    style={{ fontSize: 13, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.42)", background: "none", border: "none", cursor: "pointer", padding: "4px 4px" }}
                  >
                    Don&apos;t include
                  </button>
                  <BorderBeamButton
                    type="button"
                    variant="outline"
                    beamSize="md"
                    colorVariant="colorful"
                    active={true}
                    onClick={() => handleAddToEvidence(adverseArticlePopupIdx!)}
                    className="rounded-lg font-semibold border-transparent"
                    style={{ height: 36, fontSize: 13, padding: "0 16px", background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(250,249,255,0.95)", color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}
                  >
                    Add to evidence
                  </BorderBeamButton>
                </>)}
              </div>
            </div>
          </div>
        );
      })()}

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
            animation: "search-backdrop-in 0.18s ease-out both",
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
              animation: "search-panel-in 0.2s cubic-bezier(0.16,1,0.3,1) both",
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

      <div className="absolute inset-0 pointer-events-none" style={{ zIndex:0, opacity: darkMode ? 0.15 : 0.22 }}>
        <ColorBends
          colors={darkMode ? ["#7c3aed","#a855f7","#4f46e5"] : ["#6366f1","#818cf8","#8b5cf6"]}
          rotation={90} speed={0.15} bandWidth={6} intensity={darkMode ? 1.2 : 1.5}
          transparent warpStrength={1} mouseInfluence={0.3} noise={0} frequency={1} iterations={1}
        />
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex:0, background: darkMode ? "rgba(10,7,22,0.45)" : "rgba(238,235,255,0.38)" }} />

      {/* Top bar card */}
      <div className="flex-shrink-0 rounded-2xl flex items-center px-4 py-1.5 relative" style={{ zIndex:2, ...panelStyle, boxShadow:"none", border:"none", background:"transparent", backdropFilter:"none", WebkitBackdropFilter:"none" }}>
        {/* Logo */}
        <button
          onClick={() => setSelectedCaseId(null)}
          className="flex items-center gap-2.5 flex-shrink-0"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 22.6L17.66 16.03L0 9.13V0L30.24 12.18V19.75L0 32V22.6Z" fill="#A100FF"/>
          </svg>
          <div className={`w-px h-4 ${dm("bg-gray-300","bg-white/20")}`} />
          <span className={`text-xs font-light tracking-[0.18em] uppercase ${dm("text-gray-700","text-slate-200")}`}>Gator</span>
        </button>

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
                <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white rounded-full flex items-center justify-center" style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>
                  {2 - notifsRead.length}
                </span>
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
                      { id: 0, title: "New match detected", body: "Li Bin matched against OFAC SDN", time: "12 min ago", action: "View case", unread: true },
                      { id: 1, title: "Investigation assigned to you", body: "Rahman Mohammad Mizanur", time: "1 hr ago", action: "Open", unread: true },
                      { id: 2, title: "AI analysis completed", body: "8 new sources analysed for Li Bin", time: "2 hr ago", action: "View results", unread: false },
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
                            <button style={{ fontSize: 11, color: "#818cf8", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500, display: "flex", alignItems: "center", gap: 2 }}>
                              {n.action}
                              <ChevronRight style={{ width: 11, height: 11 }} />
                            </button>
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
                <AvatarFallback className={`text-xs font-semibold ${dm("bg-gray-900 text-white","bg-indigo-600 text-white")}`}>VC</AvatarFallback>
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
              <div className={`px-2 py-1.5 flex flex-col gap-0.5 ${dm("border-b border-black/[0.06]","border-b border-white/[0.08]")}`}>
                <span className={`text-sm font-medium ${dm("text-gray-900","text-slate-100")}`}>Victor Chee</span>
                <span className={`text-xs ${dm("text-gray-500","text-gray-400")}`}>victor.chee@accenture.com</span>
              </div>
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
      {(() => {
        const showIconStrip = networkVisible && selectedCaseId !== null && !forceExpandPanel;
        const riskStroke = (risk: string) =>
          risk === "Critical" ? "#ef4444" : risk === "High" ? "#f59e0b" : risk === "Medium" ? "#eab308" : "#6b7280";
        return (
        <div
          className="flex-shrink-0 transition-all duration-200 overflow-hidden rounded-lg"
          style={{ width: showIconStrip ? 56 : (caseListOpen ? caseListWidth : 6), position:"relative", zIndex:1, ...((showIconStrip || caseListOpen) ? panelStyle : {}) }}
        >
          {showIconStrip ? (
            /* ── Icon strip — shown when network is visible and a case is selected ── */
            <div className="h-full flex flex-col" style={{ width: 56 }}>
              {/* Header with inbox → expand-on-hover */}
              <button
                onClick={() => { setForceExpandPanel(true); setCaseListOpen(true); }}
                title="Expand case list"
                className="group flex-shrink-0 flex items-center justify-center transition-colors focus-visible:outline-none"
                style={{ height: 46, width: "100%", background: "none", border: "none", cursor: "pointer", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}
              >
                <Inbox className={`h-3.5 w-3.5 transition-opacity group-hover:opacity-0 group-hover:hidden ${dm("text-gray-500","text-gray-400")}`} />
                <PanelLeftOpen className={`h-3.5 w-3.5 hidden group-hover:block transition-opacity ${dm("text-gray-700","text-gray-200")}`} />
              </button>
              {/* Avatar list */}
              <div className="flex-1 overflow-y-auto no-scrollbar" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", gap: 10 }}>
                {cases.map(c => {
                  const isSelected = selectedCaseId === c.id;
                  const stroke = riskStroke(c.risk);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.id === selectedCaseId ? null : c.id)}
                      title={c.customerName}
                      style={{ position: "relative", flexShrink: 0, padding: 0, background: "none", border: "none", cursor: "pointer" }}
                    >
                      {c.unread && (
                        <span style={{ position: "absolute", top: 1, right: 1, width: 7, height: 7, borderRadius: "50%", background: "#6366f1", border: `1.5px solid ${darkMode ? "rgba(15,13,30,1)" : "rgba(248,247,255,1)"}`, zIndex: 1 }} />
                      )}
                      <Avatar style={{ width: 36, height: 36, border: `2px solid ${isSelected ? stroke : stroke + "55"}`, boxShadow: isSelected ? `0 0 0 3px ${stroke}28` : "none", transition: "box-shadow 0.15s, border-color 0.15s" }}>
                        <AvatarFallback className={`text-[11px] font-bold ${darkMode ? c.colorDark : c.colorLight}`}>
                          {c.initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
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
              onClick={() => { setCaseListOpen(false); setForceExpandPanel(false); }}
              aria-label="Hide case list"
              className={`p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${dm("text-gray-400 hover:text-gray-700 hover:bg-white/40","text-gray-500 hover:text-gray-300 hover:bg-white/[0.07]")}`}
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Filter pills */}
          <div className="flex gap-1.5 px-3 overflow-x-auto flex-shrink-0 no-scrollbar" style={{ height: 44, alignItems: "center", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
            {([ ["all","All"], ["unread","Unread"], ["high","High Match"], ["low","Low Match"] ] as const).map(([key, label]) => {
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
              const getSecondaryMatchCount = (caseId: number) => {
                const pn = (CASE_NODES[caseId] ?? []).filter((n: FraudNode) => n.nodeType !== "attribute");
                if (!pn.length) return 0;
                const top = pn.reduce((b: FraudNode, n: FraudNode) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b, pn[0]);
                return (top.matchFields ?? []).slice(5, 14).filter((f: { match: boolean }) => f.match).length;
              };
              const filtered = cases.filter(c => {
                if (caseFilter === "unread") return c.unread;
                if (caseFilter === "high")   return getSecondaryMatchCount(c.id) >= 7;
                if (caseFilter === "low")    return getSecondaryMatchCount(c.id) < 7;
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
                          onClick={() => { const nid = c.id === selectedCaseId ? null : c.id; setSelectedCaseId(nid); if (nid !== null && !networkVisible) setCaseListOpen(false); }} darkMode={darkMode}
                          topMatchFields={(() => { const pn = (CASE_NODES[c.id] ?? []).filter((n: FraudNode) => n.nodeType !== "attribute"); if (!pn.length) return null; return pn.reduce((b: FraudNode, n: FraudNode) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b, pn[0]).matchFields ?? null; })()} />
                      ))}
                      <div className={`mx-3 my-1 border-t ${dm("border-gray-100","border-white/[0.06]")}`} />
                    </>
                  )}
                  {unpinned.map(c => (
                    <CaseListItem key={c.id} item={c} selected={selectedCaseId === c.id}
                      onClick={() => { const nid = c.id === selectedCaseId ? null : c.id; setSelectedCaseId(nid); if (nid !== null && !networkVisible) setCaseListOpen(false); }} darkMode={darkMode}
                      topMatchFields={(() => { const pn = (CASE_NODES[c.id] ?? []).filter((n: FraudNode) => n.nodeType !== "attribute"); if (!pn.length) return null; return pn.reduce((b: FraudNode, n: FraudNode) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b, pn[0]).matchFields ?? null; })()} />
                  ))}
                </>
              );
            })()}
          </div>
          </div>
          )}
        {/* Cases panel resize / expand handle — only in full panel mode */}
        {!showIconStrip && <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, zIndex: 10 }}>
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
        </div>}
        </div>
        );
      })()}

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

              {/* Time — right edge */}
              <span className={`text-[10px] flex-shrink-0 ml-auto pl-4 tabular-nums ${dm("text-gray-400","text-gray-600")}`}>
                {selectedCase.time}
              </span>
            </div>
          );
        })()}

        {/* Top nav — only shown when a case is open */}
        {selectedCase && (
          <nav className="flex items-center gap-4 px-5 flex-shrink-0 relative" style={{ ...barStyle, zIndex: 12, height: 44 }}>
            <div className="flex items-center gap-4">
              {[
                { key:"overview",  label:"Overview" },
                { key:"details",   label:"Customer Details" },
                { key:"caselog",   label:"Case Log" },
                { key:"audit",     label:"Audit Trail" },
              ].map(({ key, label }) => {
                const active = caseTab === key;
                const showDot = key === "caselog" && caseLogUnread && !active;
                return (
                  <button key={key}
                    onClick={() => { setCaseTab(key as typeof caseTab); if (key === "caselog") setCaseLogUnread(false); }}
                    className={`text-sm font-medium pb-0.5 relative transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      active
                        ? dm("text-gray-900 after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-gray-900 after:rounded-full","text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-indigo-400 after:rounded-full")
                        : dm("text-gray-400 hover:text-gray-700","text-gray-500 hover:text-gray-300")
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {label}
                      {showDot && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {caseTab === "overview" && (
              <button
                onClick={() => networkVisible ? hideNetwork() : showNetwork()}
                aria-label={networkVisible ? "Hide network graph" : "Show network graph"}
                style={{
                  marginLeft: "auto",
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 99,
                  cursor: "pointer",
                  background: networkVisible ? "rgba(129,140,248,0.12)" : "rgba(129,140,248,0.25)",
                  border: "1px solid rgba(129,140,248,0.35)",
                  color: "#818cf8",
                }}
              >
                {networkVisible ? <EyeOff style={{ width: 11, height: 11 }} /> : <Eye style={{ width: 11, height: 11 }} />}
                {networkVisible ? "Hide network" : "Show network"}
              </button>
            )}
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
              {networkVisible && <FraudNetworkCanvas
                centerLabel={selectedCase.customerName}
                nodes={graphNodes}
                dark={darkMode}
                style={{ position:"absolute", inset:0 }}
                selectedNodeLabel={comparisonNode?.label}
                activeNodeLabels={sourceActiveLabels ?? undefined}
                highlightAttrLabel={(adverseDetail ? ADVERSE_ARTICLES[adverseArticleIdx]?.outlet : activeAttrLabel) ?? undefined}
                controlsRight={chatCollapsed ? RAIL_WIDTH + 8 : chatPanelWidth + 16}
                onNodeClick={(node) => {
                  // Attribute/news/source node: activate all connected persons, show highest match in pane
                  if (node.nodeType === "attribute") {
                    const attrIdx = graphNodes.findIndex(n => n === node);
                    if (attrIdx < 0) return;
                    const connectedPersons = graphNodes.filter(
                      n => n.nodeType === "person" && (n.matchedAttributeIndices ?? []).includes(attrIdx)
                    );
                    if (!connectedPersons.length) return;
                    const primaryNode = connectedPersons.reduce((b, n) => (n.matchScore ?? 0) > (b.matchScore ?? 0) ? n : b);
                    setSourceActiveLabels(connectedPersons.map(n => n.label));
                    setActiveAttrLabel(node.label);
                    const isAutoDisp = primaryNode.risk === "medium" || primaryNode.risk === "low" || !!primaryNode.isForcedAuto;
                    setAdverseDetail(null);
                    setReviewState(s => ({ ...s, networkReviewed: true }));
                    setComparisonNode(primaryNode);
                    if (!primaryNode.isDisposed) {
                      if (isAutoDisp) {
                        setDispositionChoice("false-positive");
                        setTrueHitStep(false);
                        setDispositionSubmitted(false);
                        setDispositionComment(
                          `Match score of ${primaryNode.matchScore ?? 0}% falls below the review threshold. ` +
                          `Name similarity detected against ${primaryNode.sublabel ?? "the watchlist"}, however date of birth, ` +
                          `nationality, and identity document number do not align with the customer's verified records. ` +
                          `No beneficial ownership or transactional nexus identified. Assessed as a false positive — no further action required.`
                        );
                      } else {
                        setDispositionChoice(null);
                        setDispositionComment("");
                        setDispositionSubmitted(false);
                        setTrueHitStep(false);
                      }
                    }
                    return;
                  }
                  // Person node clicked: clear multi-highlight
                  setSourceActiveLabels(null);
                  setActiveAttrLabel(null);
                  const isAutoDisp = node.risk === "medium" || node.risk === "low" || !!node.isForcedAuto;
                  setAdverseDetail(null);
                  setReviewState(s => ({ ...s, networkReviewed: true }));
                  setComparisonNode(prev => prev?.label === node.label ? null : node);
                  if (!node.isDisposed) {
                    if (isAutoDisp) {
                      setDispositionChoice("false-positive");
                      setTrueHitStep(false);
                      setDispositionSubmitted(false);
                      setDispositionComment(
                        `Match score of ${node.matchScore ?? 0}% falls below the review threshold. ` +
                        `Name similarity detected against ${node.sublabel ?? "the watchlist"}, however date of birth, ` +
                        `nationality, and identity document number do not align with the customer's verified records. ` +
                        `No beneficial ownership or transactional nexus identified. Assessed as a false positive — no further action required.`
                      );
                    } else {
                      setDispositionChoice(null);
                      setDispositionComment("");
                      setDispositionSubmitted(false);
                      setTrueHitStep(false);
                    }
                  }
                }}
              />}

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
                {caseNodes.filter((n: FraudNode) => n.nodeType !== "attribute").length} watchlist matches
                {(critNodes + highNodes) > 0 && <span style={{ color: "#f87171", fontWeight: 600 }}>· {critNodes + highNodes} high-risk</span>}
              </div>

              {/* Shared prompt bar — fixed position, never moves */}
              <div style={{
                position: "absolute",
                zIndex: 20,
                right: 16,
                bottom: 16,
                width: chatPanelWidth - 32,
                transition: "width 0.2s ease-out",
                display: chatCollapsed ? "none" : undefined,
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
                      placeholder="Ask Casework Agent anything"
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

              {/* AI rail — shown when chat is collapsed */}
              {chatCollapsed && (
                <div style={{
                  position: "absolute", top: 0, right: 0, bottom: 0, width: RAIL_WIDTH, zIndex: 20,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                  background: darkMode ? "rgba(8,6,22,0.36)" : "rgba(255,255,255,0.45)",
                  backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
                  borderLeft: `1px solid ${darkMode ? "rgba(139,92,246,0.18)" : "rgba(99,102,241,0.20)"}`,
                }}>
                  <button
                    onClick={() => setChatCollapsed(false)}
                    aria-label="Open Ask AI"
                    title="Open Ask AI"
                    style={{
                      background: "none", border: "none", cursor: "pointer", padding: 8,
                      color: darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.35)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    }}
                  >
                    <Sparkles style={{ width: 14, height: 14, color: "#818cf8" }} />
                    <span style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.30)",
                      writingMode: "vertical-rl", transform: "rotate(180deg)",
                    }}>Ask AI</span>
                  </button>
                </div>
              )}

              {/* AI chat panel — right overlay */}
              <div
                style={{ position:"absolute", top:0, right:0, bottom:0, width: chatCollapsed ? 0 : chatPanelWidth, zIndex:10, display:"flex", flexDirection:"column", overflow:"hidden", transition:"width 0.2s ease-out", ...(!chatCollapsed ? chatPanelStyle : {}) }}
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
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-5 py-5" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {chatMessages.map((msg, i) => {
                    const isLast = i === chatMessages.length - 1;

                    if (msg.role === "user") {
                      return (
                        <div key={i} data-msg-index={i} className="flex justify-end">
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
                        <button className={`p-1 rounded transition-colors ${dm("text-gray-400 hover:text-green-600 hover:bg-green-50","text-gray-600 hover:text-green-400 hover:bg-green-400/10")}`} title="Good response">
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button className={`p-1 rounded transition-colors ${dm("text-gray-400 hover:text-red-500 hover:bg-red-50","text-gray-600 hover:text-red-400 hover:bg-red-400/10")}`} title="Bad response">
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    );

                    // Reasoning (chain-of-thought) AI message
                    if (msg.reasoning) {
                      return (
                        <div key={i} data-msg-index={i} className="w-full">
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

                    // Article widget message
                    if (msg.articleWidgetIdx !== undefined) {
                      const artIdx = msg.articleWidgetIdx;
                      const art = ADVERSE_ARTICLES[artIdx];
                      const artStatus = adverseArticleStatuses[artIdx];
                      const isAdding = adverseAddingSet.has(artIdx);
                      const isAdded = artStatus === 'added';
                      const isExcluded = artStatus === 'excluded';
                      return (
                        <div key={i} data-msg-index={i} className="w-full">
                          <div
                            onClick={() => !isExcluded && !isAdded && setAdverseArticlePopupIdx(artIdx)}
                            onMouseEnter={e => { if (!isExcluded && !isAdded) { const el = e.currentTarget as HTMLElement; el.style.border = `1px solid ${darkMode ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"}`; el.style.background = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"; el.style.boxShadow = darkMode ? "0 2px 12px rgba(0,0,0,0.18)" : "0 2px 10px rgba(0,0,0,0.08)"; } }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.border = `1px solid ${isAdded ? "rgba(74,222,128,0.25)" : isExcluded ? (darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") : (darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)")}`; el.style.background = isAdded ? (darkMode ? "rgba(74,222,128,0.05)" : "rgba(74,222,128,0.04)") : isExcluded ? (darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") : (darkMode ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.025)"); el.style.boxShadow = "none"; }}
                            style={{
                              borderRadius: 10,
                              border: `1px solid ${isAdded ? "rgba(74,222,128,0.25)" : isExcluded ? (darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") : (darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)")}`,
                              background: isAdded ? (darkMode ? "rgba(74,222,128,0.05)" : "rgba(74,222,128,0.04)") : isExcluded ? (darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") : (darkMode ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.025)"),
                              overflow: "hidden",
                              cursor: isExcluded || isAdded ? "default" : "pointer",
                              opacity: isExcluded ? 0.45 : 1,
                              transition: "opacity 0.2s, background 0.15s, border-color 0.15s, box-shadow 0.15s",
                            }}
                          >
                            {/* Card header */}
                            <div style={{ padding: "10px 12px 0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}>{art.outlet}</span>
                                <ExternalLink style={{ width: 10, height: 10, color: darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.30)" }} />
                                <span style={{ marginLeft: "auto", fontSize: 11, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>{art.date}</span>
                              </div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: isExcluded ? (darkMode ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.45)") : (darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)"), lineHeight: 1.4, margin: "0 0 8px" }}>
                                {isExcluded ? <s>{art.headline}</s> : art.headline}
                              </p>
                              {/* Topic tags */}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                                {art.topics.map((t, ti) => (
                                  <span key={ti} style={{ fontSize: 10, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.45)", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20, padding: "2px 7px" }}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {/* Action row */}
                            <div style={{ padding: "8px 12px 10px", borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                              {isAdded ? (
                                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#4ade80" }}>
                                  <Check style={{ width: 13, height: 13 }} /> Added to evidence
                                </span>
                              ) : isExcluded ? (
                                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                                  <X style={{ width: 12, height: 12 }} /> Not included
                                </span>
                              ) : isAdding ? (
                                <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.40)" }}>Adding…</span>
                              ) : (<>
                                <button
                                  onClick={e => { e.stopPropagation(); handleDontInclude(artIdx); }}
                                  style={{ fontSize: 12, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.40)", background: "none", border: "none", cursor: "pointer", padding: "4px 4px" }}
                                >
                                  Don&apos;t include
                                </button>
                                <BorderBeamButton
                                  type="button"
                                  variant="outline"
                                  beamSize="sm"
                                  colorVariant="colorful"
                                  active={true}
                                  onClick={e => { e.stopPropagation(); handleAddToEvidence(artIdx); }}
                                  className="rounded-md font-semibold border-transparent"
                                  style={{ height: 28, fontSize: 12, padding: "0 10px", background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(250,249,255,0.95)", color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}
                                >
                                  Add to evidence
                                </BorderBeamButton>
                              </>)}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Regular (non-copilot) AI message
                    if (!msg.copilotStep) {
                      return (
                        <div key={i} data-msg-index={i} className="w-full">
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
                      <div key={i} data-msg-index={i} className="w-full [&_p]:text-[14px] [&_p]:leading-snug" style={{ fontSize: 14, color: aiColor, lineHeight: 1.65 }}>

                        {/* ── overview ── */}
                        {msg.copilotStep === "overview" && (<>
                          <p style={{ marginBottom: 10 }}>
                            I&apos;ve analyzed this case. The strongest watchlist match is{" "}
                            <strong style={{ color: darkMode ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.85)" }}>{strongestNode?.label ?? selectedCase.watchlistName}</strong>{" "}
                            on the{" "}
                            <strong style={{ color: darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>{strongestNode?.sublabel ?? selectedCase.watchlistSource}</strong>{" "}
                            list — <strong style={{ color: "#ef4444" }}>{(strongestNode?.matchScore ?? selectedCase.confidence) + primaryScoreBoost}% identity similarity</strong>.
                          </p>
                          {(() => {
                            const fields = strongestNode?.matchFields ?? [];
                            const matched = fields.filter(f => f.match);
                            const summary = matched.length === fields.length && fields.length > 0
                              ? `All ${fields.length} identifiers match exactly — ${fields.map(f => f.field.toLowerCase()).join(", ")}.`
                              : `${matched.length} of ${fields.length} identifiers match — ${matched.map(f => f.field.toLowerCase()).join(", ")}.`;
                            return (<>
                              {fields.length > 0 && (
                                <div style={{ marginBottom: 12 }}>
                                  {fields.map((f, fi, arr) => (
                                    <div key={fi} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "5px 0", borderBottom: fi < arr.length - 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}` : "none" }}>
                                      <span style={{ fontSize: 13, color: dimColor, flexShrink: 1, minWidth: 0 }}>{f.field}</span>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: f.match ? "#4ade80" : "#f87171", flexShrink: 0 }}>{f.match ? "Match" : "No match"}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p style={{ marginBottom: 12 }}>{summary}</p>
                            </>);
                          })()}
                          <p style={{ marginBottom: 12 }}>
                            My initial assessment:{" "}
                            <strong style={{ color: selectedCase.confidence >= 85 ? "#ef4444" : selectedCase.confidence >= 65 ? "#f59e0b" : "#9ca3af" }}>
                              {selectedCase.confidence >= 85 ? "Likely True Hit" : selectedCase.confidence >= 65 ? "Probable True Hit" : "Possible Match"}
                            </strong>{" · "}
                            <strong style={{ color: selectedCase.confidence >= 85 ? "#ef4444" : selectedCase.confidence >= 65 ? "#f59e0b" : "#9ca3af" }}>
                              {selectedCase.confidence}%
                            </strong>
                          </p>
                          {isLast && (
                            <BorderBeamButton
                              type="button"
                              variant="outline"
                              beamSize="md"
                              colorVariant="colorful"
                              active={true}
                              onClick={handleTriggerAdverseSearch}
                              className="w-full justify-center rounded-lg font-semibold border-transparent"
                              style={{ height: 32, fontSize: 13, background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(250,249,255,0.95)", color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}
                            >
                              Trigger Adverse News Search
                            </BorderBeamButton>
                          )}
                        </>)}

                        {/* ── identity ── */}
                        {msg.copilotStep === "identity" && (<>
                          <div style={{ marginBottom: 14 }}>
                            {(comparisonNode?.matchFields ?? []).map((f, fi, arr) => (
                              <div key={fi} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "5px 0", borderBottom: fi < arr.length - 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}` : "none" }}>
                                <span style={{ fontSize: 13, color: dimColor, flexShrink: 1, minWidth: 0 }}>{f.field}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: f.match ? "#4ade80" : "#f87171", flexShrink: 0 }}>{f.match ? "Match" : "No match"}</span>
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
                          {adverseSearchState !== "loading" && (
                            <p style={{ marginBottom: 4 }}>
                              Found <strong style={{ color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)" }}>{ADVERSE_ARTICLES.length} adverse news articles</strong> referencing{" "}
                              <strong style={{ color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)" }}>{selectedCase.watchlistName}</strong>.{" "}
                              Review each article below and add any that support your assessment.
                            </p>
                          )}
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

              {/* ── Restore handle: match analysis (left edge of network) ── */}
              {!rightPaneOpen && networkVisible && (
                <button
                  onClick={restoreMatchAnalysis}
                  aria-label="Show match analysis"
                  title="Show match analysis"
                  style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 20, zIndex: 26,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: darkMode ? "rgba(9,7,22,0.55)" : "rgba(255,255,255,0.60)",
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    borderRight: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                    cursor: "pointer", border: "none",
                    color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.30)",
                    transition: "color 0.15s",
                  }}
                >
                  <ChevronRight style={{ width: 12, height: 12 }} />
                </button>
              )}

              {/* ── Unified left pane: Match Analysis + Disposition ── */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: !rightPaneOpen
                  ? 0
                  : networkVisible
                    ? rightPaneWidth
                    : `calc(100% - ${chatCollapsed ? 0 : chatPanelWidth}px)`,
                zIndex: 25,
                display: "flex", flexDirection: "column",
                background: darkMode ? "rgba(9,7,22,0.84)" : "rgba(255,255,255,0.86)",
                backdropFilter: "blur(32px) saturate(1.8)",
                WebkitBackdropFilter: "blur(32px) saturate(1.8)",
                borderRight: rightPaneOpen ? `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}` : "none",
                overflowX: "hidden",
                overflowY: "hidden",
                transition: "width 0.2s ease-out",
              }}>
                {/* Resize handle on right edge — only when network is visible */}
                {rightPaneOpen && networkVisible && (
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
                  const activePersonNodes = activeNodes.filter(n => n.nodeType !== "attribute");
                  const nodeIdx = comparisonNode ? activePersonNodes.findIndex(n => n.label === comparisonNode.label) : -1;
                  const canPrev = nodeIdx > 0;
                  const canNext = nodeIdx >= 0 && nodeIdx < activePersonNodes.length - 1;
                  const goTo = (idx: number) => {
                    const n = activePersonNodes[idx];
                    if (!n) return;
                    setAdverseDetail(null);
                    setComparisonNode(n);
                    if (n.risk === "medium" || n.risk === "low" || forcedAutoDisposed.has(n.label)) {
                      setDispositionChoice("false-positive");
                      setTrueHitStep(false);
                      setDispositionSubmitted(false);
                      setDispositionComment(`Match score of ${n.matchScore ?? 0}% falls below the review threshold. Name similarity detected against ${n.sublabel ?? "the watchlist"}, however date of birth, nationality, and identity document number do not align with the customer's verified records. No beneficial ownership or transactional nexus identified. Assessed as a false positive — no further action required.`);
                    } else {
                      setDispositionChoice(null);
                      setDispositionComment("");
                      setDispositionSubmitted(false);
                      setTrueHitStep(false);
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
                                style={{ background: darkMode ? "rgba(9,7,22,0.90)" : "rgba(255,255,255,0.88)" }}
                              >
                                <ChevronLeft className="h-3 w-3" style={{ color: darkMode ? "rgba(255,255,255,0.70)" : "rgba(80,60,160,0.80)" }} />
                              </BorderBeamIconButton>
                              <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)", minWidth: 100, textAlign: "center", whiteSpace: "nowrap" }}>
                                {nodeIdx >= 0 ? `${nodeIdx + 1}/${activePersonNodes.length}` : `·/${activePersonNodes.length}`} watchlist records
                              </span>
                              <BorderBeamIconButton
                                type="button" variant="outline" beamSize="sm" colorVariant="colorful"
                                active={canNext} staticColors={true}
                                disabled={!canNext}
                                aria-label="Next node"
                                onClick={() => goTo(nodeIdx + 1)}
                                className="h-6 w-6 rounded-md border-transparent disabled:opacity-30"
                                style={{ background: darkMode ? "rgba(9,7,22,0.90)" : "rgba(255,255,255,0.88)" }}
                              >
                                <ChevronRight className="h-3 w-3" style={{ color: darkMode ? "rgba(255,255,255,0.70)" : "rgba(80,60,160,0.80)" }} />
                              </BorderBeamIconButton>
                            </>
                          )}
                          {networkVisible && (
                            <button
                              onClick={collapseMatchAnalysis}
                              aria-label="Collapse match analysis"
                              title="Collapse match analysis"
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, lineHeight: 1, marginLeft: 2, color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.30)" }}
                            >
                              <PanelLeftClose className="h-3.5 w-3.5" />
                            </button>
                          )}
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
                      {/* Row 1: pagination centred */}
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 0, background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 20, padding: "2px 4px" }}>
                          <button
                            onClick={() => { const i = Math.max(0, adverseArticleIdx - 1); setAdverseArticleIdx(i); setAdverseDetail(traversableSourceItems[i]); }}
                            disabled={adverseArticleIdx === 0}
                            style={{ background: "none", border: "none", cursor: adverseArticleIdx === 0 ? "default" : "pointer", padding: "2px 6px", color: adverseArticleIdx === 0 ? (darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.20)") : (darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.60)"), display: "flex", alignItems: "center" }}
                          >
                            <ChevronLeft style={{ width: 12, height: 12 }} />
                          </button>
                          <span style={{ fontSize: 11, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)", padding: "0 2px", userSelect: "none", whiteSpace: "nowrap" }}>
                            {adverseArticleIdx + 1} of {traversableSourceItems.length}
                          </span>
                          <button
                            onClick={() => { const i = Math.min(traversableSourceItems.length - 1, adverseArticleIdx + 1); setAdverseArticleIdx(i); setAdverseDetail(traversableSourceItems[i]); }}
                            disabled={adverseArticleIdx === traversableSourceItems.length - 1}
                            style={{ background: "none", border: "none", cursor: adverseArticleIdx === traversableSourceItems.length - 1 ? "default" : "pointer", padding: "2px 6px", color: adverseArticleIdx === traversableSourceItems.length - 1 ? (darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.20)") : (darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.60)"), display: "flex", alignItems: "center" }}
                          >
                            <ChevronRight style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                      {/* Row 2: outlet • date (left) + Don't include (right) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <button onClick={() => {}} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: 1 }} title={adverseDetail.outlet}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)", textDecoration: "underline", textUnderlineOffset: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "50%" }}>{adverseDetail.outlet}</span>
                          <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)", flexShrink: 0 }}>•</span>
                          <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.45)", flexShrink: 0 }}>{adverseDetail.date}</span>
                        </button>
                        {(() => {
                          const isAdverse = adverseDetail.sourceType === "adverse" && adverseDetail.origIdx !== undefined;
                          return (
                            <button
                              disabled={!isAdverse}
                              onClick={isAdverse ? () => {
                                setConfirmRemoveIdx((adverseDetail as { origIdx?: number }).origIdx!);
                              } : undefined}
                              title={isAdverse ? "Remove from evidence" : "WorldCheck sources cannot be removed"}
                              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: "3px 0", cursor: isAdverse ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 500, color: isAdverse ? "#f87171" : (darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.22)"), opacity: isAdverse ? 0.75 : 1, transition: "opacity 0.15s" }}
                              onMouseEnter={e => { if (isAdverse) (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                              onMouseLeave={e => { if (isAdverse) (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                            >
                              <X style={{ width: 11, height: 11 }} />
                              Don&apos;t include
                            </button>
                          );
                        })()}
                      </div>
                      {/* Headline */}
                      <p style={{ fontSize: 16, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)", lineHeight: 1.35, marginBottom: 10 }}>{adverseDetail.headline}</p>
                      {/* Tags — WorldCheck vs adverse news */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                        {adverseDetail.sourceType === "worldcheck" ? (<>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#4ade80", background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.22)", borderRadius: 20, padding: "2px 8px" }}>
                            <ShieldCheck style={{ width: 10, height: 10 }} />WorldCheck
                          </span>
                          <span style={{ display: "inline-flex", fontSize: 11, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20, padding: "2px 8px" }}>
                            {adverseDetail.tags}
                          </span>
                        </>) : (<>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "2px 8px" }}>
                            <AlertTriangle style={{ width: 10, height: 10 }} />Adverse News
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20, padding: "2px 8px" }}>
                            Web crawl
                          </span>
                          {(adverseDetail.origIdx !== undefined ? ADVERSE_ARTICLES[adverseDetail.origIdx]?.topics : [])?.map((t, ti) => (
                            <span key={ti} style={{ display: "inline-flex", fontSize: 11, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20, padding: "2px 8px" }}>{t}</span>
                          ))}
                        </>)}
                      </div>
                      {/* Blurb */}
                      <div style={{ background: darkMode ? "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(9,7,22,0.80) 70%) padding-box, linear-gradient(135deg, rgba(129,140,248,0.5) 0%, rgba(192,132,252,0.4) 50%, rgba(244,114,182,0.35) 100%) border-box" : "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(240,236,255,0.80) 100%) padding-box, linear-gradient(135deg, rgba(129,140,248,0.5) 0%, rgba(192,132,252,0.4) 50%, rgba(244,114,182,0.35) 100%) border-box", border: "1px solid transparent", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: darkMode ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.60)", lineHeight: 1.55 }}>
                        {adverseDetail.sourceType === "worldcheck"
                          ? <>This record lists <strong style={{ color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)", fontWeight: 600 }}>{selectedCase.customerName}</strong> as a sanctioned entity on the <strong style={{ color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)", fontWeight: 600 }}>{adverseDetail.outlet}</strong>.</>
                          : <>This article mentions <strong style={{ color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)", fontWeight: 600 }}>{selectedCase.customerName}</strong> in relation to asset freezes and alleged links to sanctioned entities.</>
                        }
                      </div>
                      {/* Matched Person */}
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", marginBottom: 10 }}>Matched Person</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                        <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold flex-shrink-0 ${darkMode ? selectedCase.colorDark : selectedCase.colorLight}`}>{selectedCase.initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)" }}>{selectedCase.customerName}</div>
                          <div style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.40)", marginTop: 1 }}>↔ {selectedCase.watchlistName}</div>
                        </div>
                        {(() => { const fields = comparisonNode?.matchFields ?? []; const matched = fields.filter(f => f.match).length; const total = fields.length; const score = comparisonNode?.matchScore ?? selectedCase.confidence; const col = score >= 80 ? "#ef4444" : score >= 60 ? "#f59e0b" : "#6b7280"; const bg = score >= 80 ? "rgba(239,68,68,0.12)" : score >= 60 ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.12)"; return <span style={{ fontSize: 11, fontWeight: 600, color: col, background: bg, borderRadius: 20, padding: "3px 9px", flexShrink: 0, whiteSpace: "nowrap" }}>{total ? `${matched}/${total} identifiers` : ""}{total ? " • " : ""}{score}% similarity</span>; })()}
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
                      {adverseDetail.sourceType === "worldcheck" ? (<>
                        {/* Matched Fields — for WorldCheck records */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", margin: 0 }}>Matched Fields</p>
                          <span style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>{comparisonNode?.matchFields?.filter(f => f.match).length ?? 0} matched</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 20 }}>
                          {(comparisonNode?.matchFields?.filter(f => f.match) ?? []).slice(0, 5).map((f, fi, arr) => (
                            <div key={fi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, alignItems: "center", padding: "6px 0", borderBottom: fi < arr.length - 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` : "none" }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)" }}>{f.field}</span>
                              <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>{f.watchlist}</span>
                            </div>
                          ))}
                        </div>
                      </>) : (<>
                        {/* Matched in Article — for adverse news */}
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
                      </>)}
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
                    </div>
                    <div style={{ borderLeft: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`, paddingLeft: 10 }}>
                      <div style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Watchlist Person</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.85)" }}>{comparisonNode.label}</div>
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
                  {/* Flag indicators — icon + label, no background */}
                  {(() => {
                    type FlagEntry = { label: string; Icon: React.ElementType; color: string };
                    let flagList: FlagEntry[] = [];

                    if (comparisonNode.classifications?.length) {
                      // Use explicit classifications data
                      flagList = comparisonNode.classifications.map(label => {
                        const l = label.toLowerCase();
                        if (l.includes("sanction"))     return { label, Icon: XCircle,   color: "#f87171" };
                        if (l.includes("enforcement"))  return { label, Icon: Gavel,    color: "#fb923c" };
                        if (l.includes("pep rca"))      return { label, Icon: Landmark,  color: "#818cf8" };
                        return                                 { label, Icon: Landmark,  color: "#a78bfa" }; // PEP
                      });
                    } else {
                      // Fallback: derive from sublabel
                      const sub = (comparisonNode.sublabel ?? "").toLowerCase();
                      const sanctionLabel = sub.includes("ofac") || sub.includes("sdn") ? "Sanctioned by OFAC"
                        : sub.includes("un sanction") || sub === "un" ? "Sanctioned by UN"
                        : sub.includes("eu sanction") ? "Sanctioned by EU"
                        : sub.includes("world bank") ? "Sanctioned by World Bank"
                        : (sub.includes("sanction") || sub.includes("target") || sub.includes("blocked")) ? "Sanctioned"
                        : null;
                      if (sanctionLabel) flagList.push({ label: sanctionLabel, Icon: XCircle, color: "#f87171" });
                      if (sub.includes("pep")) {
                        flagList.push({ label: "Foreign PEP",     Icon: Landmark, color: "#a78bfa" });
                        flagList.push({ label: "Foreign PEP RCA", Icon: Landmark, color: "#818cf8" });
                      }
                      if (sub.includes("interpol") || sub.includes("adverse") || sub.includes("world bank")) {
                        flagList.push({ label: "Legal Enforcement Action", Icon: Gavel, color: "#fb923c" });
                      }
                    }

                    if (flagList.length === 0) return null;
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 6, marginBottom: 2 }}>
                        {flagList.map(({ label, Icon, color }) => (
                          <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color, whiteSpace: "nowrap" }}>
                            <Icon style={{ width: 11, height: 11 }} />
                            {label}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

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
                          {isReasoningLoading
                            ? <div className="ai-skeleton" style={{ height: 16, width: 52, borderRadius: 4 }} />
                            : (() => {
                                const fields = comparisonNode.matchFields ?? [];
                                const matched = fields.filter(f => f.match).length;
                                const secMatched = fields.filter(f => SECONDARY_FIELDS.has(f.field) && f.match).length;
                                const level = secMatched >= 7 ? "HIGH" : "LOW";
                                const col = matched === fields.length ? "#4ade80" : matched > 0 ? "#f59e0b" : "#f87171";
                                const bg  = matched === fields.length ? "rgba(74,222,128,0.12)" : matched > 0 ? "rgba(245,158,11,0.12)" : "rgba(248,113,113,0.12)";
                                return (
                                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0, textTransform: "none", color: col, background: bg, borderRadius: 4, padding: "1px 6px" }}>
                                    {level} · {matched}/{fields.length} match
                                  </span>
                                );
                              })()
                          }
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ paddingBottom: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {/* Primary identifier section header */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0 7px" }}>
                            <div style={{ flex: 1, height: 1, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)", flexShrink: 0 }}>Primary</span>
                            <div style={{ flex: 1, height: 1, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
                          </div>
                          {isReasoningLoading
                            ? (comparisonNode.matchFields ?? []).map((_, fi) => (
                                <Fragment key={fi}>
                                  {fi === 5 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 0 4px" }}>
                                      <div style={{ flex: 1, height: 1, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
                                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)", flexShrink: 0 }}>Secondary</span>
                                      <div style={{ flex: 1, height: 1, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
                                    </div>
                                  )}
                                  <div style={{ display: "grid", gridTemplateColumns: "96px 1fr 1fr 16px", gap: 6, alignItems: "center", padding: "4px 0" }}>
                                    <div className="ai-skeleton" style={{ height: 10, width: "60%", borderRadius: 4 }} />
                                    <div className="ai-skeleton" style={{ height: 10, borderRadius: 4 }} />
                                    <div className="ai-skeleton" style={{ height: 10, borderRadius: 4 }} />
                                    <div className="ai-skeleton" style={{ height: 10, width: 12, borderRadius: "50%" }} />
                                  </div>
                                </Fragment>
                              ))
                            : (comparisonNode.matchFields ?? []).map((f, fi) => (
                                <Fragment key={fi}>
                                  {fi === 5 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 0 4px" }}>
                                      <div style={{ flex: 1, height: 1, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
                                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)", flexShrink: 0 }}>Secondary</span>
                                      <div style={{ flex: 1, height: 1, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
                                    </div>
                                  )}
                                  <div style={{ display: "grid", gridTemplateColumns: "96px 1fr 1fr 16px", gap: 6, alignItems: "flex-start", padding: "4px 0" }}>
                                    <span style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)", fontWeight: 600, lineHeight: 1.3, wordBreak: "break-word" }}>{f.field}</span>
                                    <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.customer}</span>
                                    <span style={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.watchlist}</span>
                                    <span style={{ display: "flex", justifyContent: "center", alignItems: "center", color: f.match ? "#4ade80" : "#f87171", paddingTop: 2 }}>
                                      {f.match ? <CheckCircle style={{ width: 12, height: 12 }} /> : <X style={{ width: 12, height: 12 }} />}
                                    </span>
                                  </div>
                                </Fragment>
                              ))
                          }
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Found Sources */}
                    <AccordionItem value="sources" className={pulseSection === 'sources' ? 'ai-pulse' : ''} style={{ border: "none" }}>
                      <AccordionTrigger className="hover:no-underline" style={{ padding: "10px 0", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          Found Sources
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0, textTransform: "none", color: "#818cf8", background: "rgba(129,140,248,0.12)", borderRadius: 4, padding: "1px 5px" }}>
                            {2 + Object.values(adverseArticleStatuses).filter(s => s === 'added').length + adverseAddingSet.size}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ paddingBottom: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {/* WorldCheck verified sources */}
                          {(() => {
                            const srcNodes = graphNodes.filter(n => n.nodeType === "attribute" && n.sublabel === "WorldCheck" && n.attrIcon === "source");
                            return WORLDCHECK_SOURCE_DETAILS.map((src, i) => (
                            <div key={i} onClick={() => { const n = srcNodes[i]; if (n) setActiveAttrLabel(n.label); setAdverseArticleIdx(i); setAdverseDetail(WORLDCHECK_SOURCE_DETAILS[i]); setReviewState(s => ({ ...s, adverseNewsReviewed: true })); }} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, cursor: "pointer" }}>
                              <ShieldCheck style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1, color: "#4ade80" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: "#818cf8" }}>WorldCheck</span>
                                  <span style={{ marginLeft: "auto", fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)", flexShrink: 0 }}>{src.date}</span>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)", marginBottom: 3 }}>{src.outlet}</div>
                                <div style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>{src.tags}</div>
                              </div>
                            </div>
                          ));
                        })()}
                          {/* Skeleton row while an article is being added */}
                          {[...adverseAddingSet].map(idx => (
                            <div key={`adding-${idx}`} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
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
                          {/* Only show articles explicitly added to evidence */}
                          {ADVERSE_ARTICLES.map((art, i) => adverseArticleStatuses[i] === 'added' ? (
                            <div key={i} onClick={() => { const pos = traversableSourceItems.findIndex(s => s.sourceType === 'adverse' && (s as { origIdx?: number }).origIdx === i); setAdverseArticleIdx(pos >= 0 ? pos : WORLDCHECK_SOURCE_DETAILS.length); setAdverseDetail({ ...art, sourceType: 'adverse', origIdx: i }); setReviewState(s => ({ ...s, adverseNewsReviewed: true })); }} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, cursor: "pointer" }}>
                              <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 2, color: "#f59e0b" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: "#f59e0b" }}>Adverse News</span>
                                  <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)" }}>· Web crawl</span>
                                  <span style={{ marginLeft: "auto", fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)", flexShrink: 0 }}>{art.date}</span>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)", marginBottom: 3, lineHeight: 1.45 }}>{art.headline}</div>
                                <div style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>{art.topics.join(' • ')}</div>
                              </div>
                            </div>
                          ) : null)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* ── Disposition ── */}
                <div className={pulseSection === 'disposition' ? 'ai-pulse' : ''} style={{ padding: "14px 16px", flexShrink: 0, borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}`, background: darkMode ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.025)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#818cf8", textTransform: "uppercase" }}>Disposition</span>
                  </div>
                  {/* Step 1 — False Positive or True Hit (hidden when submitted and not editing) */}
                  {(!dispositionSubmitted || isChangingDisposition) && (() => {
                    const isFP      = dispositionChoice === "false-positive";
                    const isTH      = trueHitStep || dispositionChoice === "true-hit-high" || dispositionChoice === "true-hit-medium";
                    const step1 = [
                      { id: "fp" as const,  label: "False Positive", icon: <XCircle className="h-4 w-4 flex-shrink-0" />, color: "rgb(34,197,94)",  bg: darkMode ? "rgba(34,197,94,0.12)"  : "rgba(34,197,94,0.10)"  },
                      { id: "th" as const,  label: "True Hit",       icon: <Check   className="h-4 w-4 flex-shrink-0" />, color: "rgb(239,68,68)",  bg: darkMode ? "rgba(239,68,68,0.12)"  : "rgba(239,68,68,0.10)"  },
                    ];
                    const wideMode = !networkVisible;
                    const makePriorityButtons = (fullWidth: boolean) => (
                      <div style={{ display: fullWidth ? "flex" : "inline-flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`, width: fullWidth ? "100%" : undefined }}>
                        {([
                          { key: "true-hit-high"   as const, label: "High",   color: "rgb(239,68,68)",  bg: darkMode ? "rgba(239,68,68,0.18)"  : "rgba(239,68,68,0.10)"  },
                          { key: "true-hit-medium" as const, label: "Medium", color: "rgb(251,191,36)", bg: darkMode ? "rgba(251,191,36,0.18)" : "rgba(251,191,36,0.10)" },
                        ] as const).map((p, i) => {
                          const active = dispositionChoice === p.key;
                          return (
                            <button key={p.key} onClick={() => setDispositionChoice(active ? null : p.key)} style={{
                              flex: fullWidth ? 1 : undefined, width: fullWidth ? undefined : 80,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              padding: "9px 8px", cursor: "pointer",
                              borderLeft: i === 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}` : "none",
                              transition: "background 0.12s, color 0.12s",
                              background: active ? p.bg : "transparent",
                            }}>
                              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? p.color : darkMode ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }}>{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    );

                    return (<>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: isTH && !wideMode ? 10 : isTH ? 10 : 0, flexWrap: "wrap" }}>
                        <div style={{ display: wideMode ? "inline-flex" : "flex", gap: 6, flex: wideMode ? undefined : 1 }}>
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
                                width: wideMode ? 130 : undefined, flex: wideMode ? undefined : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 8px",
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
                        {/* Priority inline when wide mode */}
                        {wideMode && isTH && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>Priority</span>
                            {makePriorityButtons(false)}
                          </div>
                        )}
                      </div>

                      {/* Step 2 — Priority stacked when narrow */}
                      {!wideMode && isTH && (
                        <div style={{ marginBottom: 6 }}>
                          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.40)" }}>Select Priority</p>
                          {makePriorityButtons(true)}
                        </div>
                      )}
                    </>);
                  })()}
                  {dispositionChoice && (!dispositionSubmitted || isChangingDisposition) && (() => {
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
                            {isChangingDisposition ? "Updated Comment" : <>Comment <span style={{ fontWeight: 400, color: darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.25)" }}>(required)</span></>}
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
                              style={{ background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(255,255,255,0.88)", color: darkMode ? "rgba(255,255,255,0.75)" : "rgba(80,60,160,0.85)" }}
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
                                color: darkMode ? "rgba(255,255,255,0.75)" : "rgba(80,60,160,0.90)",
                                background: darkMode
                                  ? "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(9,7,22,0.92) 60%) padding-box, linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%) border-box"
                                  : "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(240,236,255,0.90) 100%) padding-box, linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%) border-box",
                                border: "1px solid transparent",
                                boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)" : "0 1px 4px rgba(99,102,241,0.18)",
                              }}
                            >
                              <Sparkles className="h-3 w-3" />
                              {dispositionComment.trim() ? "Regenerate" : "Generate"}
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
                  {dispositionSubmitted && !isChangingDisposition ? (() => {
                    const typeLabel  = submittedChoice === "false-positive" ? "False Positive" : submittedChoice === "true-hit-high" ? "True Hit" : "True Hit";
                    const priorityLabel = submittedChoice === "true-hit-high" ? "High" : submittedChoice === "true-hit-medium" ? "Medium" : null;
                    const sep = <div style={{ height: 1, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", margin: "10px 0" }} />;
                    const cNodes = (CASE_NODES[selectedCaseId as number] ?? []).filter(n => n.nodeType !== "attribute");
                    const nextPersonNode = cNodes.find(n => !submittedNodes.has(n.label) && n.label !== comparisonNode?.label) ?? null;
                    const purpleColor = darkMode ? "rgba(167,139,250,0.9)" : "rgba(109,40,217,0.75)";
                    return (
                      <div style={{ marginTop: 10 }}>
                        {/* Status row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="7" cy="7" r="6.5" stroke="rgb(34,197,94)" strokeWidth="1.2" />
                            <path d="M4 7l2 2 4-4" stroke="rgb(34,197,94)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
                              strokeDasharray="10" strokeDashoffset="10"
                              style={{ animation: "dash-draw 0.4s ease-out 0.05s forwards" }} />
                          </svg>
                          <span style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.80)" }}>
                            {typeLabel}{priorityLabel && <span style={{ fontWeight: 400, color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}> · {priorityLabel}</span>}
                          </span>
                          <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>· Submitted</span>
                        </div>
                        {/* Timestamp */}
                        <p style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)", margin: "0 0 8px" }}>VC · {submittedAt}</p>
                        {/* Action buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <button onClick={() => setCaseTab("audit")} style={{ fontSize: 11, fontWeight: 500, background: "none", border: "none", cursor: "pointer", color: purpleColor, display: "flex", alignItems: "center", gap: 3, padding: 0 }}>
                            <Eye style={{ width: 10, height: 10 }} />
                            View audit trail
                          </button>
                          <button onClick={() => { setIsChangingDisposition(true); setDispositionChoice(submittedChoice); setDispositionComment(submittedComment); setTrueHitStep(submittedChoice === "true-hit-high" || submittedChoice === "true-hit-medium"); }}
                            style={{ fontSize: 11, fontWeight: 500, background: "none", border: "none", cursor: "pointer", color: purpleColor, padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                            <Pencil style={{ width: 10, height: 10 }} />
                            Change disposition
                          </button>
                        </div>
                        {sep}
                        {/* Comment */}
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.32)" }}>Comment</p>
                        <p style={{ fontSize: 12, lineHeight: 1.6, color: darkMode ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)", margin: 0 }}>{submittedComment}</p>
                        {(() => {
                          const allSubmitted = cNodes.every(n => submittedNodes.has(n.label));
                          const firstTrueHitLabel = allSubmitted
                            ? [...submittedNodes.entries()].find(([, v]) => v !== "false-positive")?.[0] ?? null
                            : null;
                          const firstTrueHitNode = firstTrueHitLabel
                            ? cNodes.find(n => n.label === firstTrueHitLabel) ?? null
                            : null;

                          if (nextPersonNode) return (<>
                            {sep}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <BorderBeamButton
                                type="button" variant="outline" beamSize="sm" colorVariant="colorful" active={true}
                                onClick={() => {
                                  setAdverseDetail(null);
                                  setComparisonNode(nextPersonNode);
                                  const nextIsAuto = nextPersonNode.risk === "medium" || nextPersonNode.risk === "low" || forcedAutoDisposed.has(nextPersonNode.label);
                                  if (nextIsAuto) {
                                    setDispositionChoice("false-positive");
                                    setTrueHitStep(false);
                                    setDispositionSubmitted(false);
                                    setDispositionComment(`Match score of ${nextPersonNode.matchScore ?? 0}% falls below the review threshold. Name similarity detected against ${nextPersonNode.sublabel ?? "the watchlist"}, however date of birth, nationality, and identity document number do not align with the customer's verified records. No beneficial ownership or transactional nexus identified. Assessed as a false positive — no further action required.`);
                                  } else {
                                    setDispositionChoice(null);
                                    setDispositionComment("");
                                    setDispositionSubmitted(false);
                                    setTrueHitStep(false);
                                  }
                                }}
                                style={{ fontSize: 12, padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: 6, background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(250,249,255,0.95)", color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}
                              >
                                Next Watchlist Record
                                <ArrowRight className="h-3.5 w-3.5" />
                              </BorderBeamButton>
                            </div>
                          </>);

                          if (firstTrueHitNode) return (<>
                            {sep}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <BorderBeamButton
                                type="button" variant="outline" beamSize="sm" colorVariant="colorful" active={true}
                                onClick={() => {
                                  setAdverseDetail(null);
                                  setComparisonNode(firstTrueHitNode);
                                  setSubmittedChoice(submittedNodes.get(firstTrueHitNode.label) ?? null);
                                  setDispositionChoice(submittedNodes.get(firstTrueHitNode.label) ?? null);
                                  setDispositionSubmitted(true);
                                  setIsChangingDisposition(false);
                                  setCaseTab("caselog");
                                }}
                                style={{ fontSize: 12, padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: 6, background: darkMode ? "rgba(9,7,22,0.92)" : "rgba(250,249,255,0.95)", color: darkMode ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)" }}
                              >
                                View Case Log
                                <ArrowRight className="h-3.5 w-3.5" />
                              </BorderBeamButton>
                            </div>
                          </>);

                          return null;
                        })()}
                      </div>
                    );
                  })() : (() => {
                    const isChange = dispositionSubmitted && isChangingDisposition;
                    const canSubmit = !!dispositionChoice && !!dispositionComment.trim();
                    const handleSubmit = () => {
                      if (!dispositionChoice || !dispositionComment.trim()) return;
                      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                      if (isChange) {
                        const prevLabel = submittedChoice === "false-positive" ? "False Positive" : submittedChoice === "true-hit-high" ? "True Hit · High" : "True Hit · Medium";
                        const newLabel  = dispositionChoice === "false-positive" ? "False Positive" : dispositionChoice === "true-hit-high" ? "True Hit · High" : "True Hit · Medium";
                        setAuditLog(prev => [{ title: "Disposition changed", desc: `${prevLabel} → ${newLabel}`, tags: ["Disposition", "Change"], time: `${dateStr}, ${now}` }, ...prev]);
                      } else {
                        const label = dispositionChoice === "false-positive" ? "False Positive" : dispositionChoice === "true-hit-high" ? "True Hit · High" : "True Hit · Medium";
                        setAuditLog(prev => [{ title: "Disposition submitted", desc: `${label} by VC.`, tags: ["Disposition"], time: `${dateStr}, ${now}` }, ...prev]);
                      }
                      setSubmittedAt(now);
                      setSubmittedChoice(dispositionChoice);
                      setSubmittedComment(dispositionComment);
                      setDispositionSubmitted(true);
                      setIsChangingDisposition(false);
                      setCaseLogUnread(true);

                      // Track this node as actual disposed
                      const newSubmittedMap = new Map(submittedNodes).set(comparisonNode!.label, dispositionChoice);
                      setSubmittedNodes(newSubmittedMap);

                      // Auto-navigate to true hit node when last disposition is submitted
                      const cNodesAll = (CASE_NODES[selectedCaseId as number] ?? []).filter(n => n.nodeType !== "attribute");
                      const allNowSubmitted = cNodesAll.every(n => newSubmittedMap.has(n.label));
                      if (allNowSubmitted) {
                        const trueHitLabelNow = [...newSubmittedMap.entries()].find(([, v]) => v !== "false-positive")?.[0] ?? null;
                        const trueHitNodeNow = trueHitLabelNow ? cNodesAll.find(n => n.label === trueHitLabelNow) ?? null : null;
                        if (trueHitNodeNow && trueHitNodeNow.label !== comparisonNode?.label) {
                          setAdverseDetail(null);
                          setComparisonNode(trueHitNodeNow);
                          setSubmittedChoice(newSubmittedMap.get(trueHitNodeNow.label) ?? null);
                          setDispositionChoice(newSubmittedMap.get(trueHitNodeNow.label) ?? null);
                          setDispositionSubmitted(true);
                          setIsChangingDisposition(false);
                        }
                      }

                      // If true hit: push all other critical/high nodes to ring 3
                      const newForcedAuto = new Set(forcedAutoDisposed);
                      if (dispositionChoice !== "false-positive" && comparisonNode) {
                        const cNodes = CASE_NODES[selectedCaseId as number] ?? [];
                        cNodes.forEach(n => {
                          if (n.label !== comparisonNode.label && n.nodeType !== "attribute") {
                            newForcedAuto.add(n.label);
                          }
                        });
                        if (newForcedAuto.size !== forcedAutoDisposed.size) setForcedAutoDisposed(newForcedAuto);
                      }

                    };
                    return (<>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        {isChange && (
                          <button onClick={() => { setIsChangingDisposition(false); setDispositionChoice(submittedChoice); setDispositionComment(submittedComment); setTrueHitStep(false); }} style={{
                            padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                            color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)", border: "none",
                          }}>Cancel</button>
                        )}
                        <button disabled={!canSubmit} onClick={handleSubmit} style={{
                          flex: 1, padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: canSubmit ? "pointer" : "not-allowed",
                          transition: "opacity 0.15s, background 0.15s",
                          opacity: canSubmit ? 1 : 0.35,
                          background: dispositionChoice
                            ? (darkMode
                                ? (dispositionChoice === "false-positive" ? "rgba(22,163,74,0.55)" : dispositionChoice === "true-hit-high" ? "rgba(185,28,28,0.70)" : "rgba(161,98,7,0.55)")
                                : (dispositionChoice === "false-positive" ? "rgb(22,163,74)" : dispositionChoice === "true-hit-high" ? "rgb(185,28,28)" : "rgb(161,98,7)"))
                            : darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                          color: dispositionChoice ? "rgba(255,255,255,0.95)" : darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)", border: "none",
                        }}>
                          {isChange ? "Re-submit Disposition" : "Submit Disposition"}
                        </button>
                      </div>
                    </>);
                  })()}
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

              {/* ── Case Log tab ── */}
              {caseTab === "caselog" && (() => {
                const personNodes = caseNodes.filter(n => n.nodeType === "person");
                const getCaseType = (n: typeof personNodes[0]) => {
                  const secondaryMatched = (n.matchFields ?? []).filter(f => SECONDARY_FIELDS.has(f.field) && f.match).length;
                  return secondaryMatched >= 7 ? "High" : "Low";
                };
                const getDispositionLabel = (nodeLabel: string) => {
                  const d = submittedNodes.get(nodeLabel);
                  if (!d) return null;
                  if (d === "false-positive") return { label: "False Positive", color: "#4ade80", bg: "rgba(74,222,128,0.12)" };
                  if (d === "true-hit-high")  return { label: "True Hit · High", color: "#f87171", bg: "rgba(248,113,113,0.12)" };
                  return { label: "True Hit · Med", color: "#fb923c", bg: "rgba(251,146,60,0.12)" };
                };
                const getMethodologyLines = (n: typeof personNodes[0]) => {
                  const fields = n.matchFields ?? [];
                  const matched  = fields.filter(f => f.match).map(f => `${f.field}: ${f.watchlist}`);
                  const differed = fields.filter(f => !f.match).map(f => `${f.field}: customer '${f.customer}' vs watchlist '${f.watchlist}'`);
                  const lines: string[] = [];
                  if (matched.length)  lines.push(`PRIMARY MATCHED: ${matched.join(" | ")}`);
                  if (differed.length) lines.push(`PRIMARY DIFFERED: ${differed.join(" | ")}`);
                  if (!lines.length)   lines.push("No identifier data available");
                  return lines;
                };

                const borderColor = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
                const headerBg    = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
                const rowHoverBg  = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";
                const textDim     = darkMode ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)";
                const textMain    = darkMode ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.80)";
                const textSub     = darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";

                const colHeaders = ["", "Alert ID", "Watchlist Name", "Case Type", "Identifiers", "Score", "Disposition", "Last Updated", "Created", "Party Key", "Key Methodology"];
                const STICKY_DOT_LEFT  = 0;
                const STICKY_NAME_LEFT = caseLogColWidths[0]; // dot col width

                const startColResize = (colIdx: number, e: React.MouseEvent) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startWidth = caseLogColWidths[colIdx];
                  const onMove = (me: MouseEvent) => {
                    setCaseLogColWidths(prev => {
                      const next = [...prev];
                      next[colIdx] = Math.max(40, startWidth + (me.clientX - startX));
                      return next;
                    });
                  };
                  const onUp = () => {
                    document.removeEventListener("mousemove", onMove);
                    document.removeEventListener("mouseup", onUp);
                  };
                  document.addEventListener("mousemove", onMove);
                  document.addEventListener("mouseup", onUp);
                };

                const handleSort = (col: string) => {
                  if (caseLogSortCol === col) {
                    setCaseLogSortDir(d => d === "asc" ? "desc" : "asc");
                  } else {
                    setCaseLogSortCol(col);
                    setCaseLogSortDir("desc");
                  }
                };

                // Per-row data derived before sorting
                const rowData = personNodes.map((n, idx) => {
                  const disp        = getDispositionLabel(n.label);
                  const fields      = n.matchFields ?? [];
                  const matched     = fields.filter(f => f.match).length;
                  const alertId     = `A${1000 + (selectedCaseId ?? 1) * 100 + idx}`;
                  const partyKey    = ["337329833","503161061","366976200","241899312","374349146","615926766"][idx % 6];
                  const createdDate = ["2026-09-08 09:14","2026-09-08 09:15","2026-09-08 09:17","2026-09-08 09:20","2026-09-08 09:22"][idx % 5];
                  const lastUpdated = disp ? `${new Date().toLocaleDateString("en-CA")} ${submittedAt || createdDate.slice(11)}` : createdDate;
                  return { n, idx, disp, fields, matched, alertId, partyKey, createdDate, lastUpdated };
                });

                const sortedRows = [...rowData].sort((a, b) => {
                  let va: string | number = "", vb: string | number = "";
                  switch (caseLogSortCol) {
                    case "Alert ID":       va = a.alertId;       vb = b.alertId; break;
                    case "Watchlist Name": va = a.n.label;       vb = b.n.label; break;
                    case "Case Type":      va = getCaseType(a.n); vb = getCaseType(b.n); break;
                    case "Identifiers":    va = a.fields.length ? a.matched / a.fields.length : -1; vb = b.fields.length ? b.matched / b.fields.length : -1; break;
                    case "Score":          va = a.n.matchScore ?? 0; vb = b.n.matchScore ?? 0; break;
                    case "Disposition":    va = a.disp?.label ?? ""; vb = b.disp?.label ?? ""; break;
                    case "Last Updated":   va = a.lastUpdated;   vb = b.lastUpdated; break;
                    case "Created":        va = a.createdDate;   vb = b.createdDate; break;
                    case "Party Key":      va = a.partyKey;      vb = b.partyKey; break;
                    default: return 0;
                  }
                  const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                  return caseLogSortDir === "asc" ? cmp : -cmp;
                });

                // Table container has an explicit bg so we can use the same value for sticky cells
                const tableBg     = darkMode ? "rgb(16,13,36)"   : "rgb(246,245,254)";
                const stickyHdrBg = darkMode ? "rgb(20,17,40)"   : "rgb(243,242,251)";  // tableBg + headerBg overlay
                const stickyActBg = darkMode ? "rgb(25,22,54)"   : "rgb(239,238,254)";  // tableBg + active overlay
                const stickyHovBg = darkMode ? "rgb(20,17,40)"   : "rgb(243,242,249)";  // tableBg + hover overlay
                const stickyShad  = `2px 0 6px -2px ${darkMode ? "rgba(0,0,0,0.40)" : "rgba(0,0,0,0.10)"}`;

                return (
                  <div className="absolute inset-0 overflow-auto" style={{ zIndex: 1 }}>
                    <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
                      <colgroup>
                        {caseLogColWidths.map((w, ci) => <col key={ci} style={{ width: w }} />)}
                      </colgroup>
                      <thead>
                        <tr style={{ background: stickyHdrBg, borderBottom: `1px solid ${borderColor}`, position: "sticky", top: 0, zIndex: 4 }}>
                          {colHeaders.map((h, hi) => {
                            const isDotCol  = hi === 0;
                            const isSorted  = !isDotCol && caseLogSortCol === h;
                            const isNameCol = hi === 2;
                            const isStickyCol = isDotCol || isNameCol;
                            const SortIcon  = isSorted ? (caseLogSortDir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
                            return (
                              <th key={hi} onClick={isDotCol ? undefined : () => handleSort(h)} style={{
                                padding: isDotCol ? "9px 4px" : "9px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                                color: textDim,
                                whiteSpace: "nowrap", position: isStickyCol ? "sticky" : "relative",
                                left: isDotCol ? STICKY_DOT_LEFT : isNameCol ? STICKY_NAME_LEFT : undefined,
                                zIndex: isStickyCol ? 5 : undefined,
                                background: isStickyCol ? stickyHdrBg : "transparent",
                                cursor: isDotCol ? "default" : "pointer", userSelect: "none",
                                boxShadow: isNameCol ? `2px 0 6px -2px ${darkMode ? "rgba(0,0,0,0.40)" : "rgba(0,0,0,0.10)"}` : undefined,
                              }}>
                                {!isDotCol && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    {h}
                                    <SortIcon style={{ width: 10, height: 10, opacity: isSorted ? 0.9 : 0.4, flexShrink: 0 }} />
                                  </span>
                                )}
                                {!isDotCol && hi < colHeaders.length - 1 && (
                                  <div
                                    onMouseDown={e => { e.stopPropagation(); startColResize(hi, e); }}
                                    style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 6, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <div style={{ width: 1, height: "60%", background: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)" }} />
                                  </div>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRows.map(({ n, idx, disp, fields, matched, alertId, partyKey, createdDate, lastUpdated }, si) => {
                          const isActive   = comparisonNode?.label === n.label;
                          const rowBg      = isActive ? stickyActBg : tableBg;
                          return (
                            <tr
                              key={n.label}
                              onClick={() => { setComparisonNode(n); setCaseTab("overview"); }}
                              style={{ cursor: "pointer", borderBottom: `1px solid ${borderColor}`, background: rowBg, transition: "background 0.12s" }}
                              onMouseEnter={e => {
                                if (!isActive) {
                                  const tr = e.currentTarget as HTMLElement;
                                  tr.style.background = stickyHovBg;
                                  (tr.children[0] as HTMLElement).style.background = stickyHovBg;
                                  (tr.children[2] as HTMLElement).style.background = stickyHovBg;
                                }
                              }}
                              onMouseLeave={e => {
                                const tr = e.currentTarget as HTMLElement;
                                tr.style.background = rowBg;
                                (tr.children[0] as HTMLElement).style.background = rowBg;
                                (tr.children[2] as HTMLElement).style.background = rowBg;
                              }}
                            >
                              {/* New-alert dot — sticky */}
                              <td style={{ padding: "10px 4px", overflow: "hidden", verticalAlign: "middle", position: "sticky", left: STICKY_DOT_LEFT, zIndex: 1, background: rowBg }}>
                                {si < 2 && <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: "#818cf8", margin: "0 auto" }} />}
                              </td>
                              {/* Alert ID */}
                              <td style={{ padding: "10px 8px", overflow: "hidden" }}>
                                <span style={{ fontFamily: "monospace", fontSize: 11, color: darkMode ? "rgba(129,140,248,0.85)" : "rgba(79,70,229,0.80)", background: darkMode ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", borderRadius: 4, padding: "2px 5px" }}>{alertId}</span>
                              </td>
                              {/* Watchlist Name — sticky */}
                              <td style={{ padding: "10px 12px", overflow: "hidden", position: "sticky", left: STICKY_NAME_LEFT, zIndex: 1, background: rowBg, boxShadow: stickyShad }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.label}</div>
                                  <div style={{ fontSize: 10, color: textDim, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.sublabel}</div>
                                </div>
                              </td>
                              {/* Case Type */}
                              <td style={{ padding: "10px 12px", overflow: "hidden" }}>
                                {(() => {
                                  const ct = getCaseType(n);
                                  const isHigh = ct === "High";
                                  const ctColor = isHigh ? (darkMode ? "rgba(251,146,60,0.90)" : "rgb(194,65,12)") : (darkMode ? "rgba(167,243,208,0.80)" : "rgb(21,128,61)");
                                  const ctBg    = isHigh ? (darkMode ? "rgba(251,146,60,0.12)" : "rgba(254,215,170,0.60)") : (darkMode ? "rgba(74,222,128,0.10)" : "rgba(187,247,208,0.60)");
                                  return <span style={{ fontSize: 10, fontWeight: 700, color: ctColor, background: ctBg, borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap" }}>{ct}</span>;
                                })()}
                              </td>
                              {/* Identifiers */}
                              <td style={{ padding: "10px 12px", overflow: "hidden", color: fields.length ? (matched === fields.length ? "#4ade80" : matched > 0 ? "#f59e0b" : "#f87171") : textDim }}>
                                {fields.length ? `${matched}/${fields.length}` : "N/A"}
                              </td>
                              {/* Score */}
                              <td style={{ padding: "10px 12px", overflow: "hidden" }}>
                                <span style={{ fontWeight: 700, color: (n.matchScore ?? 0) >= 85 ? "#f87171" : (n.matchScore ?? 0) >= 65 ? "#f59e0b" : "#9ca3af" }}>{n.matchScore ?? "—"}%</span>
                              </td>
                              {/* Disposition */}
                              <td style={{ padding: "10px 12px", overflow: "hidden" }}>
                                {disp ? <span style={{ fontSize: 10, fontWeight: 600, color: disp.color, background: disp.bg, borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>{disp.label}</span>
                                      : <span style={{ fontSize: 10, color: textDim }}>Pending</span>}
                              </td>
                              {/* Last Updated */}
                              <td style={{ padding: "10px 12px", overflow: "hidden", color: textSub, whiteSpace: "nowrap", fontSize: 11 }}>{lastUpdated}</td>
                              {/* Created */}
                              <td style={{ padding: "10px 12px", overflow: "hidden", color: textSub, whiteSpace: "nowrap", fontSize: 11 }}>{createdDate}</td>
                              {/* Party Key */}
                              <td style={{ padding: "10px 12px", overflow: "hidden" }}>
                                <span style={{ fontFamily: "monospace", fontSize: 11, color: textSub }}>{partyKey}</span>
                              </td>
                              {/* Methodology */}
                              <td style={{ padding: "10px 12px", fontSize: 11, overflow: "hidden" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                  {getMethodologyLines(n).map((line, li) => {
                                    const labelEnd = line.indexOf(":") + 1;
                                    const label    = line.slice(0, labelEnd);
                                    const body     = line.slice(labelEnd);
                                    return (
                                      <div key={li} style={{ color: textDim, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {label ? <><span style={{ fontWeight: 700, color: textSub }}>{label}</span>{body}</> : line}
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* ── Audit Trail tab ── */}
              {caseTab === "audit" && (() => {
                const staticEntries = [
                  {
                    title: `Case reviewed by Victor Chee`,
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
                const entries = [...auditLog, ...staticEntries];

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
                    You have{" "}
                    <span style={{
                      fontWeight: 500,
                      background: "linear-gradient(90deg, #818cf8, #c084fc, #818cf8)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "gradient-shift 4s linear infinite",
                    }}>5 cases pending your review</span>
                    {" "}since your last session.
                  </p>
                  <style>{`@keyframes gradient-shift { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }`}</style>
                </div>

                {/* Stat cards */}
                <div className="w-full max-w-3xl flex flex-col gap-2">
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#818cf8", margin: 0 }}>Platform Overview</p>
                <div className="grid grid-cols-3 gap-3 w-full items-stretch">
                  {([
                    { icon:Users,         end:142, label:"Customers with watchlist matches", change:"+22 since last week",  variant:"neutral" as const },
                    { icon:AlertTriangle, end:89,  label:"New matches detected",             change:"+42% vs last week",    variant:"neutral" as const },
                    { icon:FileText,      end:4,   label:"High-risk customers",              change:"↑ 2 this week",        variant:"alert"   as const },
                  ]).map((s,i) => (
                    <StatCard key={s.label} icon={s.icon} end={s.end} label={s.label} change={s.change} variant={s.variant} index={i} dark={darkMode} />
                  ))}
                </div>
                </div>

                {/* Prompt bar */}
                <div className="w-full max-w-xl flex flex-col gap-3">
                  <p style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", margin: 0 }}>
                    What would you like to do?
                  </p>
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
                        placeholder="Ask Casework Agent anything"
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
                  {/* Predefined action chips */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                    {([
                      {
                        label: "Review next case",
                        icon: <ArrowRight style={{ width: 11, height: 11 }} />,
                        action: () => {
                          const next = cases.find(c => c.unread) ?? cases[0];
                          setSelectedCaseId(next.id);
                        },
                      },
                      {
                        label: "Show highest-risk case",
                        icon: <AlertTriangle style={{ width: 11, height: 11 }} />,
                        action: () => {
                          const top = cases.reduce((max, c) => c.confidence > max.confidence ? c : max);
                          setSelectedCaseId(top.id);
                        },
                      },
                      {
                        label: "Summarise pending cases",
                        icon: <FileText style={{ width: 11, height: 11 }} />,
                        action: () => {
                          setSelectedCaseId(cases[0].id);
                          setChatInput("Summarise pending cases");
                        },
                      },
                    ] as { label: string; icon: React.ReactNode; action: () => void }[]).map(({ label, icon, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 12, fontWeight: 500,
                          padding: "6px 12px", borderRadius: 9999,
                          cursor: "pointer",
                          background: darkMode ? "rgba(129,140,248,0.08)" : "rgba(99,102,241,0.07)",
                          border: `1px solid ${darkMode ? "rgba(129,140,248,0.22)" : "rgba(99,102,241,0.18)"}`,
                          color: darkMode ? "rgba(165,180,252,0.90)" : "rgba(79,70,229,0.85)",
                          transition: "background 0.15s, border-color 0.15s",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = darkMode ? "rgba(129,140,248,0.16)" : "rgba(99,102,241,0.13)";
                          (e.currentTarget as HTMLElement).style.borderColor = darkMode ? "rgba(129,140,248,0.38)" : "rgba(99,102,241,0.30)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = darkMode ? "rgba(129,140,248,0.08)" : "rgba(99,102,241,0.07)";
                          (e.currentTarget as HTMLElement).style.borderColor = darkMode ? "rgba(129,140,248,0.22)" : "rgba(99,102,241,0.18)";
                        }}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
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
