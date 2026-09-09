"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type AgenticTaskStatus = "completed" | "in-progress" | "pending";

export interface AgenticTask {
  title: string;
  description?: string;
  status: AgenticTaskStatus;
}

interface Props {
  phases?: string[];
  thoughts?: string[];
  tasks?: AgenticTask[];
  phaseDuration?: number;
  dark?: boolean;
  done?: boolean;
}

function DotMatrixLoader() {
  const dots: { id: string; cx: number; cy: number; kf: string }[] = [
    { id: "_1", cx: 3,  cy: 3,  kf: "kf__1_opacity_0" },
    { id: "_2", cx: 10, cy: 3,  kf: "kf__2_opacity_0" },
    { id: "_3", cx: 17, cy: 3,  kf: "kf__3_opacity_0" },
    { id: "_4", cx: 3,  cy: 10, kf: "kf__4_opacity_0" },
    { id: "_5", cx: 10, cy: 10, kf: "kf__5_opacity_0" },
    { id: "_6", cx: 17, cy: 10, kf: "kf__6_opacity_0" },
    { id: "_7", cx: 3,  cy: 17, kf: "kf__7_opacity_0" },
    { id: "_8", cx: 10, cy: 17, kf: "kf__8_opacity_0" },
    { id: "_9", cx: 17, cy: 17, kf: "kf__9_opacity_0" },
  ];
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {dots.map(({ id, cx, cy, kf }) => (
        <circle
          key={id}
          id={id}
          cx={cx}
          cy={cy}
          r="2.5"
          fill="#818cf8"
          style={{ animation: `${kf} 3.6s linear infinite` }}
        />
      ))}
    </svg>
  );
}

function TaskIcon({ status }: { status: AgenticTaskStatus }) {
  if (status === "completed") {
    return (
      <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#43A047" />
        <path d="M6.5 11l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "in-progress") {
    return (
      <svg width="16" height="16" viewBox="0 0 22 22" fill="none" className="animate-spin" style={{ animationDuration: "1.2s" }}>
        <circle cx="11" cy="11" r="9" stroke="rgba(129,140,248,0.22)" strokeWidth="2" />
        <circle cx="11" cy="11" r="9" stroke="#818cf8" strokeWidth="2" strokeDasharray="42 15" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
      <path d="M11 7v4l2.5 2" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AIReasoningLoader({
  phases = ["Thinking", "Searching", "Preparing Results"],
  thoughts = [],
  tasks = [],
  phaseDuration = 3000,
  dark = true,
  done = false,
}: Props) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tasksOpen, setTasksOpen] = useState(true);

  const currentPhase = phases[phaseIdx % phases.length];
  const currentThought = thoughts.length ? thoughts[phaseIdx % thoughts.length] : null;

  const dim  = dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.38)";
  const text = dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.72)";

  // 14px icon + 8px gap = 22px indent so content aligns with text
  const textIndent = 22;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setPhaseIdx(i => i + 1), phaseDuration);
    return () => clearInterval(id);
  }, [phaseDuration, done]);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setElapsed(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  // auto-collapse when marked done
  useEffect(() => {
    if (done) setTasksOpen(false);
  }, [done]);

  // When done, show all tasks as completed
  const displayTasks = done
    ? tasks.map(t => ({ ...t, status: "completed" as const }))
    : tasks;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>

      {/* ── Header row (always the collapse toggle) ── */}
      <button
        type="button"
        onClick={() => setTasksOpen(o => !o)}
        style={done ? {
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "none", border: "none", padding: 0,
          cursor: "pointer", textAlign: "left",
        } : {
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "none", border: "none", padding: 0,
          cursor: "pointer", textAlign: "left", width: "100%",
        }}
      >
        {!done ? (
          /* Thinking state: dot matrix + gradient phase + elapsed + chevron */
          <>
            <DotMatrixLoader />
            <span style={{
              fontSize: 14, fontWeight: 600,
              background: "linear-gradient(90deg, #818cf8, #c084fc)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", color: "transparent",
            }}>
              {currentPhase}…
            </span>
            <span style={{ fontSize: 14, color: dim, marginLeft: "auto" }}>{elapsed}s</span>
            {tasksOpen
              ? <ChevronUp   style={{ width: 11, height: 11, color: dim, flexShrink: 0 }} />
              : <ChevronDown style={{ width: 11, height: 11, color: dim, flexShrink: 0 }} />}
          </>
        ) : (
          /* Done: compact chip — "Thought for Xs ↓" */
          <>
            <span style={{ fontSize: 13, color: dim }}>Thought for {elapsed}s</span>
            {tasksOpen
              ? <ChevronUp   style={{ width: 10, height: 10, color: dim }} />
              : <ChevronDown style={{ width: 10, height: 10, color: dim }} />}
          </>
        )}
      </button>

      {/* ── Expanded content (indented to text column) ── */}
      {tasksOpen && (
        <div style={{ paddingLeft: done ? 0 : textIndent, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* While thinking: italic current thought */}
          {!done && currentThought && (
            <p style={{ fontSize: 14, color: dim, fontStyle: "italic", lineHeight: 1.55, margin: 0 }}>
              {currentThought}
            </p>
          )}

          {/* When done: reasoning timeline o | o | o */}
          {done && thoughts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {thoughts.map((thought, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  {/* dot + connector */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 10, flexShrink: 0 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      border: "1.5px solid rgba(129,140,248,0.6)",
                      background: "rgba(129,140,248,0.15)",
                      marginTop: 3,
                    }} />
                    {i < thoughts.length - 1 && (
                      <div style={{ width: 1, flex: 1, minHeight: 14, background: "rgba(129,140,248,0.20)", margin: "3px 0" }} />
                    )}
                  </div>
                  {/* thought text */}
                  <p style={{
                    fontSize: 14, color: dim, lineHeight: 1.5, margin: 0,
                    paddingBottom: i < thoughts.length - 1 ? 10 : 0,
                  }}>
                    {thought}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Task list — gradient border + glassmorphism */}
          {displayTasks.length > 0 && (
            <div style={{
              borderRadius: 8, padding: 1,
              background: "linear-gradient(135deg, rgba(129,140,248,0.5), rgba(192,132,252,0.4), rgba(244,114,182,0.35))",
            }}>
              <div style={{
                borderRadius: 7,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                background: dark ? "rgba(10,10,20,0.55)" : "rgba(255,255,255,0.45)",
                overflow: "hidden",
              }}>
                {displayTasks.map((task, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      padding: "8px 10px",
                      borderBottom: i < displayTasks.length - 1
                        ? "1px solid rgba(129,140,248,0.12)"
                        : "none",
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: 1 }}>
                      <TaskIcon status={task.status} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: text, lineHeight: 1.4 }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: 14, color: dim, marginTop: 1, lineHeight: 1.4 }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
