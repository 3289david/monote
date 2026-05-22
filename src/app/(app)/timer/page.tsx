"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const SUBJECTS = ["국어", "수학", "영어", "과학", "사회", "역사", "물리", "화학", "생명과학", "지구과학", "기타"];

const PRESETS = [
  { label: "25분 포모도로", work: 25, break: 5 },
  { label: "50분 집중", work: 50, break: 10 },
  { label: "90분 딥워크", work: 90, break: 15 },
];

type Phase = "idle" | "work" | "break";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function TimerPage() {
  const examMode = useUIStore((s) => s.examMode);
  const qc = useQueryClient();

  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalWork, setTotalWork] = useState(25);
  const [totalBreak, setTotalBreak] = useState(5);
  const [subject, setSubject] = useState("수학");
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [sessionElapsed, setSessionElapsed] = useState(0); // minutes worked this session
  const [rounds, setRounds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stats query
  const { data: statsData } = useQuery({
    queryKey: ["study-stats"],
    queryFn: () => fetch("/api/study-sessions?days=7").then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { subject: string; duration: number }) =>
      fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-stats"] });
      toast.success("공부 기록이 저장되었어요! +5P");
    },
  });

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        // Phase complete
        setPhase((currentPhase) => {
          if (currentPhase === "work") {
            // Save session
            const worked = Math.round(totalWork);
            saveMutation.mutate({ subject, duration: worked });
            setSessionElapsed((e) => e + worked);
            setRounds((r) => r + 1);
            // Switch to break
            setSecondsLeft(totalBreak * 60);
            // Play sound cue
            try { new Audio("/sounds/ding.mp3").play(); } catch {}
            toast.success(`집중 완료! ${totalBreak}분 휴식하세요`, { icon: "⏰" });
            return "break";
          } else {
            // Break done
            setSecondsLeft(totalWork * 60);
            try { new Audio("/sounds/ding.mp3").play(); } catch {}
            toast("휴식 끝! 다시 집중해볼까요?", { icon: "💪" });
            return "work";
          }
        });
        return prev; // will be overwritten above
      }
      return prev - 1;
    });
  }, [totalWork, totalBreak, subject, saveMutation]);

  useEffect(() => {
    if (phase === "work" || phase === "break") {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, tick]);

  // Update document title with timer
  useEffect(() => {
    if (phase !== "idle") {
      document.title = `${formatTime(secondsLeft)} - ${phase === "work" ? "집중중" : "휴식"} | monote`;
    } else {
      document.title = "공부 타이머 | monote";
    }
    return () => { document.title = "monote"; };
  }, [phase, secondsLeft]);

  const handleStart = () => {
    setTotalWork(customWork);
    setTotalBreak(customBreak);
    setSecondsLeft(customWork * 60);
    setPhase("work");
    setSessionElapsed(0);
    setRounds(0);
  };

  const handlePause = () => {
    setPhase("idle");
  };

  const handleResume = () => {
    setPhase(secondsLeft <= totalBreak * 60 ? "break" : "work");
  };

  const handleStop = () => {
    if (sessionElapsed > 0) {
      // Save any remaining time
      const remaining = Math.round((totalWork * 60 - secondsLeft) / 60);
      if (remaining > 0 && phase === "work") {
        saveMutation.mutate({ subject, duration: remaining });
      }
    }
    setPhase("idle");
    setSecondsLeft(customWork * 60);
    setRounds(0);
    setSessionElapsed(0);
  };

  const progress = phase === "work"
    ? 1 - secondsLeft / (totalWork * 60)
    : 1 - secondsLeft / (totalBreak * 60);

  const circumference = 2 * Math.PI * 88;

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";
  const cardBg = examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]";

  const totalMinutes = statsData?.totalMinutes ?? 0;
  const bySubject: Record<string, number> = statsData?.bySubject ?? {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className={cn("text-xl font-light", textColor)} style={{ letterSpacing: "-0.4px" }}>공부 타이머</h1>
        <p className={cn("text-sm", mutedText)}>포모도로 기법으로 집중력을 높여보세요</p>
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center">
        <div className="relative w-52 h-52">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none"
              className={examMode ? "stroke-[#2a2d6b]" : "stroke-[#e3e8ee]"} strokeWidth="8" />
            <circle cx="100" cy="100" r="88" fill="none"
              stroke={phase === "break" ? "#10b981" : "#533afd"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - (phase !== "idle" ? progress : 0))}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-4xl font-light tabular-nums", textColor)} style={{ letterSpacing: "-1px" }}>
              {formatTime(secondsLeft)}
            </span>
            <span className={cn("text-xs mt-1 font-medium", phase === "break" ? "text-emerald-500" : phase === "work" ? "text-[#533afd]" : mutedText)}>
              {phase === "work" ? "집중" : phase === "break" ? "휴식" : "대기"}
            </span>
            {rounds > 0 && (
              <span className={cn("text-xs mt-0.5", mutedText)}>{rounds}라운드 완료</span>
            )}
          </div>
        </div>

        {/* Subject + Controls */}
        <div className="mt-4 w-full max-w-xs space-y-3">
          {phase === "idle" && (
            <>
              {/* Subject picker */}
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={cn("w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")}
              >
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => { setCustomWork(p.work); setCustomBreak(p.break); }}
                    className={cn("py-2 px-1 rounded-xl border text-xs text-center transition-all",
                      customWork === p.work && customBreak === p.break
                        ? "border-[#533afd] bg-[#eeeaff] text-[#533afd] font-medium"
                        : examMode ? "border-[#2a2d6b] text-white/60" : "border-[#e3e8ee] text-[#64748d] hover:border-[#533afd]"
                    )}>
                    <div className="font-medium">{p.work}분</div>
                    <div className="opacity-60">휴식 {p.break}분</div>
                  </button>
                ))}
              </div>

              {/* Custom */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={cn("text-xs block mb-1", mutedText)}>집중 시간 (분)</label>
                  <input type="number" value={customWork} min={1} max={120}
                    onChange={(e) => setCustomWork(Number(e.target.value))}
                    className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                      examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")}
                  />
                </div>
                <div>
                  <label className={cn("text-xs block mb-1", mutedText)}>휴식 시간 (분)</label>
                  <input type="number" value={customBreak} min={1} max={30}
                    onChange={(e) => setCustomBreak(Number(e.target.value))}
                    className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                      examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")}
                  />
                </div>
              </div>

              <button onClick={handleStart} className="w-full py-3 rounded-xl bg-[#533afd] text-white font-medium hover:bg-[#4434d4] transition-colors">
                시작하기
              </button>
            </>
          )}

          {phase !== "idle" && (
            <div className="flex gap-2">
              <button onClick={handlePause} className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors", examMode ? "bg-[#2a2d6b] text-white/70" : "bg-[#f6f9fc] text-[#273951] hover:bg-[#e3e8ee]")}>
                일시정지
              </button>
              <button onClick={handleStop} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                종료
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Session info while running */}
      {phase !== "idle" && sessionElapsed > 0 && (
        <div className={cn("rounded-xl border p-4", cardBg)}>
          <p className={cn("text-sm font-medium mb-2", textColor)}>이번 세션</p>
          <div className="flex gap-4">
            <div>
              <p className={cn("text-xs", mutedText)}>총 공부 시간</p>
              <p className={cn("text-lg font-light", textColor)}>{sessionElapsed}분</p>
            </div>
            <div>
              <p className={cn("text-xs", mutedText)}>완료 라운드</p>
              <p className={cn("text-lg font-light", textColor)}>{rounds}회</p>
            </div>
            <div>
              <p className={cn("text-xs", mutedText)}>과목</p>
              <p className={cn("text-lg font-light", textColor)}>{subject}</p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly stats */}
      <div className={cn("rounded-xl border p-4", cardBg)}>
        <p className={cn("text-sm font-medium mb-3", textColor)}>이번 주 공부 현황</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={cn("rounded-xl p-3 text-center", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}>
            <p className={cn("text-xl font-light", textColor)}>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            <p className={cn("text-xs", mutedText)}>총 공부 시간</p>
          </div>
          <div className={cn("rounded-xl p-3 text-center", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}>
            <p className={cn("text-xl font-light", textColor)}>{Object.keys(bySubject).length}</p>
            <p className={cn("text-xs", mutedText)}>공부한 과목</p>
          </div>
          <div className={cn("rounded-xl p-3 text-center", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}>
            <p className={cn("text-xl font-light text-[#533afd]")}>{Math.round(totalMinutes / 7)}분</p>
            <p className={cn("text-xs", mutedText)}>일평균</p>
          </div>
        </div>

        {/* Subject breakdown */}
        {Object.entries(bySubject).length > 0 && (
          <div className="space-y-2">
            {Object.entries(bySubject)
              .sort(([, a], [, b]) => b - a)
              .map(([subj, mins]) => (
                <div key={subj} className="flex items-center gap-3">
                  <span className={cn("text-xs w-14 flex-shrink-0", mutedText)}>{subj}</span>
                  <div className={cn("flex-1 h-2 rounded-full overflow-hidden", examMode ? "bg-[#2a2d6b]" : "bg-[#e3e8ee]")}>
                    <div className="h-full bg-[#533afd] rounded-full" style={{ width: `${Math.min(100, (mins / Math.max(...Object.values(bySubject))) * 100)}%` }} />
                  </div>
                  <span className={cn("text-xs w-14 text-right flex-shrink-0", mutedText)}>{Math.floor(mins / 60)}h {mins % 60}m</span>
                </div>
              ))}
          </div>
        )}

        {Object.entries(bySubject).length === 0 && (
          <p className={cn("text-sm text-center py-4", mutedText)}>아직 공부 기록이 없어요</p>
        )}
      </div>
    </div>
  );
}
