"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import toast from "react-hot-toast";

type Tab = "info" | "todos" | "members";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("info");
  const [todoInput, setTodoInput] = useState("");
  const [dueDate, setDueDate] = useState("");

  // ── 색상 ──────────────────────────────────────────────
  const bg = examMode ? "bg-[#0f1138]" : "bg-[#f6f9fc]";
  const cardBg = examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]";
  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";
  const inputCls = cn(
    "w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#533afd]",
    examMode
      ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30"
      : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]"
  );

  // ── 그룹 상세 데이터 ───────────────────────────────────
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: () => fetch(`/api/groups/${id}`).then((r) => r.json()),
    enabled: !!id,
  });
  const group = groupData?.group;
  const isMember = group?.isMember ?? false;
  const myRole = group?.myRole ?? null;
  const isFull = group ? group.memberCount >= group.maxMembers : false;

  // ── 할 일 데이터 ───────────────────────────────────────
  const { data: todosData, isLoading: todosLoading } = useQuery({
    queryKey: ["group-todos", id],
    queryFn: () => fetch(`/api/groups/${id}/todos`).then((r) => r.json()),
    enabled: !!id && isMember,
  });
  const todos = todosData?.todos ?? [];

  // ── 참여/나가기 ────────────────────────────────────────
  const joinMutation = useMutation({
    mutationFn: (action: "join" | "leave") =>
      fetch(`/api/groups/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }).then((r) => r.json()),
    onSuccess: (data, action) => {
      if (data.error) { toast.error(data.error); return; }
      qc.invalidateQueries({ queryKey: ["group", id] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success(action === "join" ? "그룹에 참여했어요!" : "그룹에서 나왔어요");
    },
  });

  // ── 그룹 삭제 ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/groups/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      toast.success("그룹이 삭제되었어요");
      router.push("/groups");
    },
  });

  // ── Todo 추가 ─────────────────────────────────────────
  const addTodoMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/groups/${id}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: todoInput.trim(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      qc.invalidateQueries({ queryKey: ["group-todos", id] });
      setTodoInput("");
      setDueDate("");
    },
    onError: () => toast.error("추가 실패"),
  });

  // ── Todo 토글 ─────────────────────────────────────────
  const toggleTodoMutation = useMutation({
    mutationFn: (todoId: string) =>
      fetch(`/api/groups/${id}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", todoId }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-todos", id] }),
  });

  // ── Todo 삭제 ─────────────────────────────────────────
  const deleteTodoMutation = useMutation({
    mutationFn: (todoId: string) =>
      fetch(`/api/groups/${id}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", todoId }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      qc.invalidateQueries({ queryKey: ["group-todos", id] });
    },
  });

  // ── 로딩 ─────────────────────────────────────────────
  if (groupLoading) {
    return (
      <div className="space-y-4">
        <div className={cn("h-10 rounded-xl animate-pulse", examMode ? "bg-[#1c1e54]" : "bg-[#e3e8ee]")} />
        <div className={cn("h-40 rounded-xl animate-pulse", examMode ? "bg-[#1c1e54]" : "bg-[#e3e8ee]")} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className={cn("font-medium", textColor)}>그룹을 찾을 수 없어요</p>
        <button onClick={() => router.push("/groups")} className="mt-4 text-sm text-[#533afd] hover:underline">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "정보" },
    { key: "todos", label: `할 일 ${todos.length > 0 ? `(${todos.length})` : ""}` },
    { key: "members", label: `멤버 (${group.memberCount})` },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/groups")}
          className={cn("p-1.5 rounded-lg transition-colors", examMode ? "text-white/70 hover:bg-[#1c1e54]" : "text-[#64748d] hover:bg-[#e3e8ee]")}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={cn("text-lg font-medium flex-1 truncate", textColor)}>{group.name}</h1>
        {myRole === "leader" && (
          <button
            onClick={() => {
              if (confirm("정말 그룹을 삭제할까요?")) deleteMutation.mutate();
            }}
            className="text-xs text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
          >
            삭제
          </button>
        )}
      </div>

      {/* 배지 + 참여 버튼 */}
      <div className={cn("rounded-xl border p-4", cardBg)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700">
              {group.grade}학년
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
              {group.subject}
            </span>
            {group.isPrivate && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                비공개
              </span>
            )}
            {myRole === "leader" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                리더
              </span>
            )}
          </div>

          {myRole !== "leader" && (
            <button
              onClick={() => joinMutation.mutate(isMember ? "leave" : "join")}
              disabled={joinMutation.isPending || (isFull && !isMember)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50",
                isMember
                  ? examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d] hover:bg-rose-50 hover:text-rose-600"
                  : isFull ? "bg-[#f6f9fc] text-[#64748d] cursor-not-allowed" : "bg-[#533afd] text-white hover:bg-[#4434d4]"
              )}
            >
              {isMember ? "나가기" : isFull ? "마감" : "참여하기"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className={cn("flex items-center gap-1 text-xs", mutedText)}>
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
              <circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth={1} />
              <path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth={1} />
            </svg>
            {group.memberCount}/{group.maxMembers}명
          </span>
          {isFull && <span className="text-xs text-rose-500 font-medium">정원 마감</span>}
          {isMember && group.chatRoomId && (
            <Link
              href={`/chat/${group.chatRoomId}`}
              className="flex items-center gap-1 text-xs text-[#533afd] hover:underline"
            >
              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                <path d="M10 7a1 1 0 01-1 1H3L1 10V3a1 1 0 011-1h7a1 1 0 011 1v4z" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
              </svg>
              그룹 채팅 입장
            </Link>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className={cn("flex rounded-xl p-1 gap-1", examMode ? "bg-[#1c1e54]" : "bg-[#f0f4f8]")}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-[#533afd] text-white"
                : examMode ? "text-white/50 hover:text-white" : "text-[#64748d] hover:text-[#273951]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 탭: 정보 ── */}
      {tab === "info" && (
        <div className={cn("rounded-xl border p-4 space-y-3", cardBg)}>
          <div>
            <p className={cn("text-xs mb-1", mutedText)}>그룹명</p>
            <p className={cn("font-medium", textColor)}>{group.name}</p>
          </div>
          {group.description && (
            <div>
              <p className={cn("text-xs mb-1", mutedText)}>소개</p>
              <p className={cn("text-sm leading-relaxed", textColor)}>{group.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={cn("text-xs mb-1", mutedText)}>과목</p>
              <p className={cn("text-sm", textColor)}>{group.subject}</p>
            </div>
            <div>
              <p className={cn("text-xs mb-1", mutedText)}>학년</p>
              <p className={cn("text-sm", textColor)}>{group.grade}학년</p>
            </div>
          </div>
          {isMember && group.inviteCode && (
            <div>
              <p className={cn("text-xs mb-1", mutedText)}>초대 코드</p>
              <div className="flex items-center gap-2">
                <code className={cn("text-sm font-mono px-2 py-1 rounded-lg", examMode ? "bg-[#2a2d6b] text-white" : "bg-[#f0f4f8] text-[#533afd]")}>
                  {group.inviteCode}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(group.inviteCode); toast.success("복사됐어요!"); }}
                  className={cn("text-xs px-2 py-1 rounded-lg transition-colors", examMode ? "text-white/50 hover:text-white" : "text-[#64748d] hover:text-[#533afd]")}
                >
                  복사
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 탭: 할 일 ── */}
      {tab === "todos" && (
        <div className="space-y-3">
          {!isMember ? (
            <div className="text-center py-10">
              <p className={cn("text-sm", mutedText)}>그룹 멤버만 할 일을 볼 수 있어요</p>
              <button
                onClick={() => joinMutation.mutate("join")}
                disabled={isFull}
                className="mt-3 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4] disabled:opacity-50"
              >
                {isFull ? "정원 마감" : "그룹 참여하기"}
              </button>
            </div>
          ) : (
            <>
              {/* 할 일 추가 폼 */}
              <div className={cn("rounded-xl border p-3 space-y-2", cardBg)}>
                <input
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  placeholder="할 일 추가..."
                  className={inputCls}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && todoInput.trim()) {
                      addTodoMutation.mutate();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={cn(inputCls, "flex-1 text-xs")}
                  />
                  <button
                    onClick={() => todoInput.trim() && addTodoMutation.mutate()}
                    disabled={addTodoMutation.isPending || !todoInput.trim()}
                    className="px-4 py-2 bg-[#533afd] text-white rounded-xl text-sm hover:bg-[#4434d4] transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    추가
                  </button>
                </div>
              </div>

              {/* 할 일 목록 */}
              {todosLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("rounded-xl border h-14 animate-pulse", cardBg)} />
                  ))}
                </div>
              ) : todos.length === 0 ? (
                <div className="text-center py-10">
                  <p className={cn("text-sm", mutedText)}>아직 할 일이 없어요</p>
                  <p className={cn("text-xs mt-1", mutedText)}>첫 할 일을 추가해보세요!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todos.map((todo: any) => (
                    <div
                      key={todo.id}
                      className={cn("rounded-xl border p-3 flex items-start gap-3 transition-all", cardBg)}
                    >
                      <button
                        onClick={() => toggleTodoMutation.mutate(todo.id)}
                        disabled={toggleTodoMutation.isPending}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all",
                          todo.completed
                            ? "bg-[#533afd] border-[#533afd]"
                            : examMode ? "border-white/30" : "border-[#a8c3de]"
                        )}
                      >
                        {todo.completed && (
                          <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                            <path d="M2 5l2.5 2.5 4-5" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", todo.completed ? "line-through " + mutedText : textColor)}>
                          {todo.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={cn("text-[10px]", mutedText)}>
                            {todo.createdBy?.nickname}
                          </span>
                          {todo.dueDate && (
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full",
                              new Date(todo.dueDate) < new Date() && !todo.completed
                                ? "bg-rose-100 text-rose-600"
                                : examMode ? "bg-[#2a2d6b] text-white/50" : "bg-[#f0f4f8] text-[#64748d]"
                            )}>
                              {new Date(todo.dueDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          {todo.completed && todo.completedById && (
                            <span className="text-[10px] text-emerald-600">완료됨</span>
                          )}
                        </div>
                      </div>

                      {(todo.createdById === session?.user?.id || myRole === "leader") && (
                        <button
                          onClick={() => deleteTodoMutation.mutate(todo.id)}
                          disabled={deleteTodoMutation.isPending}
                          className={cn("p-1 rounded-lg transition-colors flex-shrink-0", examMode ? "text-white/30 hover:text-white/60" : "text-[#a8c3de] hover:text-rose-400")}
                        >
                          <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
                            <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 탭: 멤버 ── */}
      {tab === "members" && (
        <div className="space-y-2">
          {group.members?.map((m: any) => (
            <div key={m.id} className={cn("rounded-xl border p-3 flex items-center gap-3", cardBg)}>
              <Avatar
                nickname={m.user.nickname}
                level={m.user.level}
                imageUrl={m.user.avatar ?? undefined}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", textColor)}>{m.user.nickname}</p>
                <p className={cn("text-xs", mutedText)}>Lv.{m.user.level}</p>
              </div>
              {m.role === "leader" && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 flex-shrink-0">
                  리더
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
