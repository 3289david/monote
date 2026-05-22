"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORY_LABELS: Record<string, string> = { exam: "시험", performance: "수행평가", event: "행사" };
const CATEGORY_COLORS: Record<string, string> = {
  exam: "bg-violet-100 text-violet-700",
  performance: "bg-rose-100 text-rose-700",
  event: "bg-emerald-100 text-emerald-700",
};

const SUBJECTS = ["국어", "수학", "영어", "과학", "사회", "역사", "물리", "화학", "생명과학", "지구과학", "기타"];

function getDday(targetDate: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DDayPage() {
  const examMode = useUIStore((s) => s.examMode);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", category: "exam", subject: "", color: "#533afd" });

  const { data, isLoading } = useQuery({
    queryKey: ["ddays"],
    queryFn: () => fetch("/api/dday").then((r) => r.json()),
  });

  const ddays = useMemo(() => {
    const items = data?.items ?? [];
    return [...items].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      fetch("/api/dday", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, date: new Date(payload.date).toISOString() }) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ddays"] });
      setShowForm(false);
      setForm({ title: "", date: "", category: "exam", subject: "", color: "#533afd" });
      toast.success("D-Day가 추가되었어요!");
    },
    onError: () => toast.error("추가에 실패했어요"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/dday?id=${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ddays"] }); toast.success("삭제되었어요"); },
  });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.date) { toast.error("제목과 날짜를 입력해주세요"); return; }
    createMutation.mutate(form);
  };

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";
  const cardBg = examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-xl font-light", textColor)} style={{ letterSpacing: "-0.4px" }}>D-Day</h1>
          <p className={cn("text-sm", mutedText)}>시험, 수행평가 일정 관리</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4] transition-colors">
          <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
          추가
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className={cn("rounded-xl border p-4 space-y-3", cardBg)}>
          <p className={cn("text-sm font-medium", textColor)}>새 D-Day 등록</p>
          <div className="space-y-2.5">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: 수학 1차 지필평가"
              maxLength={50}
              className={cn("w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#533afd]",
                examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={cn("rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")}
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={cn("rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")}
              >
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={cn("w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#533afd]",
                examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")}
            >
              <option value="">과목 선택 (선택사항)</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className={cn("flex-1 py-2 rounded-xl text-sm", examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d]")}>취소</button>
            <button onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1 py-2 rounded-xl bg-[#533afd] text-white text-sm hover:bg-[#4434d4] transition-colors disabled:opacity-50">
              {createMutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      {/* D-Day list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className={cn("rounded-xl border h-24 animate-pulse", cardBg)} />)}
        </div>
      )}

      {!isLoading && ddays.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#eeeaff] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#533afd]">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.5} />
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </div>
          <p className={cn("font-medium mb-1", textColor)}>아직 일정이 없어요</p>
          <p className={cn("text-sm", mutedText)}>시험이나 수행평가 일정을 등록해보세요</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4]">
            + 일정 추가
          </button>
        </div>
      )}

      <div className="space-y-3">
        {ddays.map((item: any) => {
          const dday = getDday(item.date);
          const isToday = dday === 0;
          const isPast = dday < 0;

          return (
            <div key={item.id} className={cn(
              "rounded-xl border p-4 flex items-start gap-4 transition-all",
              isPast ? (examMode ? "bg-[#1c1e54]/50 border-[#2a2d6b]/50 opacity-60" : "bg-white/60 border-[#e3e8ee]/60 opacity-70") : cardBg,
              !isPast && !examMode && "hover:shadow-[0_4px_12px_rgba(83,58,253,0.1)] hover:border-[#b9b9f9]"
            )}>
              {/* D-Day number */}
              <div className={cn(
                "w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 text-white",
                isPast ? "bg-gray-400" : isToday ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-[#533afd] to-[#1c1e54]"
              )}>
                <span className="text-[10px] font-medium opacity-80">{isPast ? "지남" : isToday ? "오늘!" : "D-"}</span>
                <span className="text-xl font-bold leading-none">
                  {isPast ? Math.abs(dday) : isToday ? "" : dday}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", CATEGORY_COLORS[item.category] ?? "bg-gray-100 text-gray-600")}>
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  {item.subject && (
                    <span className={cn("text-[11px]", mutedText)}>{item.subject}</span>
                  )}
                </div>
                <p className={cn("font-medium text-[15px]", textColor)}>{item.title}</p>
                <p className={cn("text-xs mt-0.5", mutedText)}>
                  {new Date(item.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                </p>
              </div>

              <button
                onClick={() => deleteMutation.mutate(item.id)}
                className={cn("p-1.5 rounded-lg transition-colors flex-shrink-0", examMode ? "text-white/30 hover:text-white/60" : "text-[#64748d]/40 hover:text-red-500")}
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
