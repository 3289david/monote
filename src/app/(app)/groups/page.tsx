"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

const SUBJECTS = ["국어", "수학", "영어", "과학", "사회", "역사", "물리", "화학", "생명과학", "지구과학", "기타"];

export default function GroupsPage() {
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", subject: "수학", grade: session?.user?.grade ?? 1, maxMembers: 10, isPrivate: false });

  const { data, isLoading } = useQuery({
    queryKey: ["groups", tab],
    queryFn: () => fetch(`/api/groups${tab === "mine" ? "?mine=true" : ""}`).then((r) => r.json()),
  });
  const groups = data?.groups ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      qc.invalidateQueries({ queryKey: ["groups"] });
      setShowForm(false);
      setForm({ name: "", description: "", subject: "수학", grade: session?.user?.grade ?? 1, maxMembers: 10, isPrivate: false });
      toast.success("스터디 그룹이 생성되었어요!");
    },
    onError: () => toast.error("생성에 실패했어요"),
  });

  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const joinMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "join" | "leave" }) => {
      setPendingGroupId(id);
      return fetch(`/api/groups/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }).then((r) => r.json());
    },
    onSuccess: (data, { action }) => {
      setPendingGroupId(null);
      if (data.error) { toast.error(data.error); return; }
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success(action === "join" ? "그룹에 참여했어요!" : "그룹에서 나왔어요");
      if (action === "join" && data.chatRoomId) {
        toast.success("그룹 채팅방이 생성되었어요!", { id: "group-chat" });
      }
    },
    onError: () => setPendingGroupId(null),
  });

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";
  const cardBg = examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-xl font-light", textColor)} style={{ letterSpacing: "-0.4px" }}>스터디 그룹</h1>
          <p className={cn("text-sm", mutedText)}>함께 공부할 친구들을 찾아보세요</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4] transition-colors">
          <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
          그룹 만들기
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className={cn("rounded-xl border p-4 space-y-3", cardBg)}>
          <p className={cn("text-sm font-medium", textColor)}>새 스터디 그룹 만들기</p>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="그룹 이름 (예: 수학 2학년 스터디)"
            className={cn("w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#533afd]",
              examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")}
          />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="그룹 소개 (선택사항)"
            rows={2}
            className={cn("w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#533afd] resize-none",
              examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={cn("text-xs block mb-1", mutedText)}>과목</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={cn("text-xs block mb-1", mutedText)}>학년</label>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")}>
                <option value={1}>1학년</option>
                <option value={2}>2학년</option>
                <option value={3}>3학년</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className={cn("text-xs block mb-1", mutedText)}>최대 인원</label>
              <input type="number" value={form.maxMembers} min={2} max={30}
                onChange={(e) => setForm({ ...form, maxMembers: Number(e.target.value) })}
                className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-5">
              <button type="button" onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })}
                className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  form.isPrivate ? "bg-[#533afd] border-[#533afd]" : "border-[#a8c3de]")}>
                {form.isPrivate && <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3"><path d="M2 5l2.5 2.5 4-5" stroke="white" strokeWidth={1.5} strokeLinecap="round" /></svg>}
              </button>
              <span className={cn("text-sm", textColor)}>비공개</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className={cn("flex-1 py-2 rounded-xl text-sm", examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d]")}>취소</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name.trim()}
              className="flex-1 py-2 rounded-xl bg-[#533afd] text-white text-sm hover:bg-[#4434d4] transition-colors disabled:opacity-50">
              {createMutation.isPending ? "만드는 중..." : "만들기"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={cn("flex rounded-xl p-1 gap-1", examMode ? "bg-[#1c1e54]" : "bg-[#f6f9fc]")}>
        {(["all", "mine"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t ? "bg-[#533afd] text-white" : (examMode ? "text-white/50 hover:text-white" : "text-[#64748d] hover:text-[#273951]"))}>
            {t === "all" ? "전체 그룹" : "내 그룹"}
          </button>
        ))}
      </div>

      {/* Group list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className={cn("rounded-xl border h-28 animate-pulse", cardBg)} />)}
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#eeeaff] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#533afd]">
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.5} />
              <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth={1.5} />
              <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </div>
          <p className={cn("font-medium mb-1", textColor)}>{tab === "mine" ? "참여한 그룹이 없어요" : "그룹이 없어요"}</p>
          <p className={cn("text-sm", mutedText)}>첫 스터디 그룹을 만들어보세요!</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4]">
            + 그룹 만들기
          </button>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group: any) => {
          const isFull = group.memberCount >= group.maxMembers;
          return (
            <div key={group.id} className={cn("rounded-xl border p-4 transition-all cursor-pointer", cardBg, !examMode && "hover:border-[#b9b9f9]")}
              onClick={() => window.location.href = `/groups/${group.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", "bg-violet-100 text-violet-700")}>
                      {group.grade}학년
                    </span>
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", "bg-emerald-100 text-emerald-700")}>
                      {group.subject}
                    </span>
                    {group.isPrivate && (
                      <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", "bg-gray-100 text-gray-600")}>
                        비공개
                      </span>
                    )}
                    {group.myRole === "leader" && (
                      <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", "bg-amber-100 text-amber-700")}>
                        리더
                      </span>
                    )}
                  </div>
                  <h3 className={cn("font-medium text-[15px]", textColor)}>{group.name}</h3>
                  {group.description && (
                    <p className={cn("text-sm mt-0.5 line-clamp-2", mutedText)}>{group.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={cn("flex items-center gap-1 text-xs", mutedText)}>
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth={1} />
                        <path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth={1} />
                      </svg>
                      {group.memberCount}/{group.maxMembers}명
                    </span>
                    {isFull && <span className="text-xs text-rose-500 font-medium">정원 마감</span>}
                    {group.isMember && group.chatRoomId && (
                      <span className="flex items-center gap-1 text-xs text-[#533afd]">
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                          <path d="M10 7a1 1 0 01-1 1H3L1 10V3a1 1 0 011-1h7a1 1 0 011 1v4z" stroke="currentColor" strokeWidth={1} strokeLinejoin="round"/>
                        </svg>
                        채팅 있음
                      </span>
                    )}
                    <span className={cn("text-xs flex items-center gap-1", mutedText)}>
                      세부 보기 →
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    joinMutation.mutate({ id: group.id, action: group.isMember ? "leave" : "join" });
                  }}
                  disabled={pendingGroupId === group.id || (isFull && !group.isMember) || group.myRole === "leader"}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    group.isMember
                      ? examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d] hover:bg-rose-50 hover:text-rose-600"
                      : isFull ? "bg-[#f6f9fc] text-[#64748d] opacity-50 cursor-not-allowed" : "bg-[#533afd] text-white hover:bg-[#4434d4]",
                    "disabled:opacity-50"
                  )}
                >
                  {group.myRole === "leader" ? "리더" : group.isMember ? "나가기" : isFull ? "마감" : "참여"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
