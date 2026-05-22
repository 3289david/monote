"use client";
import { useState } from "react";
import { useChatRooms } from "@/hooks/useChat";
import { useUIStore } from "@/store/ui-store";
import { cn, timeAgo } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

const ROOM_TYPE_LABELS: Record<string, string> = {
  school: "전체", grade: "학년", subject: "과목", open: "자유",
};
const ROOM_TYPE_COLORS: Record<string, string> = {
  school: "bg-blue-100 text-blue-700",
  grade: "bg-violet-100 text-violet-700",
  subject: "bg-emerald-100 text-emerald-700",
  open: "bg-amber-100 text-amber-700",
};

export default function ChatPage() {
  const examMode = useUIStore((s) => s.examMode);
  const { rooms, loading } = useChatRooms();
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";
  const cardBg = examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]";

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error("채팅방 이름을 입력해주세요");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoomName.trim(), type: "open" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성에 실패했어요");
      toast.success(`"${newRoomName}" 채팅방이 생성되었어요!`);
      setShowCreate(false);
      setNewRoomName("");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-xl font-light", textColor)} style={{ letterSpacing: "-0.4px" }}>채팅</h1>
          <p className={cn("text-sm", mutedText)}>반 친구들과 실시간 소통</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4] transition-colors"
        >
          <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
          새 채팅방
        </button>
      </div>

      {showCreate && (
        <div className={cn("rounded-xl border p-4 space-y-3", cardBg)}>
          <p className={cn("text-sm font-medium", textColor)}>새 채팅방 만들기</p>
          <input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="채팅방 이름 (예: 수학 2반 스터디)"
            className={cn(
              "w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#533afd]",
              examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]"
            )}
            onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className={cn("flex-1 py-2 rounded-xl text-sm", examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d]")}>취소</button>
            <button onClick={handleCreateRoom} disabled={creating} className="flex-1 py-2 rounded-xl bg-[#533afd] text-white text-sm hover:bg-[#4434d4] transition-colors disabled:opacity-50">
              {creating ? "만드는 중..." : "만들기"}
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("rounded-xl border p-4 animate-pulse h-20", cardBg)}>
              <div className={cn("h-4 rounded w-1/3 mb-2", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")} />
              <div className={cn("h-3 rounded w-2/3", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")} />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {rooms.map((room: any) => (
          <Link key={room.id} href={`/chat/${room.id}`}>
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-all",
              "hover:shadow-[0_4px_12px_rgba(0,55,112,0.08)] hover:-translate-y-0.5",
              examMode ? "bg-[#1c1e54] border-[#2a2d6b] hover:border-[#533afd]" : "bg-white border-[#e3e8ee] hover:border-[#b9b9f9]"
            )}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#533afd] to-[#1c1e54] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="none" className="w-6 h-6">
                  <path d="M18 13a2 2 0 01-2 2H6l-4 4V5a2 2 0 012-2h12a2 2 0 012 2v8z" stroke="white" strokeWidth={1.5} fill="white" fillOpacity={0.2} />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={cn("font-medium text-[15px] truncate", textColor)}>{room.name}</p>
                  {room.type && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium", ROOM_TYPE_COLORS[room.type] ?? "bg-gray-100 text-gray-600")}>
                      {ROOM_TYPE_LABELS[room.type] ?? room.type}
                    </span>
                  )}
                </div>
                <p className={cn("text-sm truncate", mutedText)}>
                  {room.lastMessage?.content ?? "대화를 시작해보세요"}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {room.lastMessage?.createdAt && (
                  <p className={cn("text-xs", mutedText)}>{timeAgo(new Date(room.lastMessage.createdAt))}</p>
                )}
                <div className={cn("flex items-center gap-1 text-xs", mutedText)}>
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth={1} />
                    <path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth={1} />
                  </svg>
                  {room._count?.members ?? 0}명
                </div>
              </div>
            </div>
          </Link>
        ))}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-12">
            <p className={cn("text-sm", mutedText)}>아직 채팅방이 없어요</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-[#533afd] hover:underline">새 채팅방 만들기</button>
          </div>
        )}
      </div>

      <div className={cn("rounded-xl p-3 text-xs leading-relaxed", examMode ? "bg-[#1c1e54] text-white/40" : "bg-[#f6f9fc] text-[#64748d]")}>
        채팅방에서 타인을 비방하거나 부적절한 내용을 공유하면 영구 차단될 수 있습니다.
      </div>
    </div>
  );
}
