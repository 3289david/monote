"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@/hooks/useChat";
import { useUIStore } from "@/store/ui-store";
import { cn, timeAgo } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import toast from "react-hot-toast";

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, typingUsers, connected, sendMessage, emitTyping, emitStopTyping } = useChat(roomId);

  // Fetch room info
  const { data: roomData } = useQuery({
    queryKey: ["chat-room", roomId],
    queryFn: () => fetch(`/api/chat/${roomId}`).then((r) => r.json()),
    enabled: !!roomId,
  });
  const room = roomData?.room;

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      emitTyping();
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping();
    }, 2000);
  }, [isTyping, emitTyping, emitStopTyping]);

  const handleSend = () => {
    if (!input.trim() || !session?.user) return;
    sendMessage(input.trim());
    setInput("");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setIsTyping(false);
    emitStopTyping();
    inputRef.current?.focus();
  };

  const isOwnMessage = (senderId: string) => senderId === session?.user?.id;

  const textColor = examMode ? "text-white" : "text-[#0d253d]";

  return (
    <div className={cn("flex flex-col h-[calc(100vh-3.5rem)]", examMode ? "bg-[#0f1138]" : "bg-[#f6f9fc]")}>
      {/* Chat header */}
      <div className={cn("flex items-center gap-3 px-4 h-14 border-b sticky top-0 z-10", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
        <button onClick={() => router.back()} className={cn("p-1 -ml-1 rounded-lg", examMode ? "text-white/70" : "text-[#64748d]")}>
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={cn("font-medium text-[15px]", textColor)}>{room?.name ?? "채팅방"}</p>
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", connected ? "bg-emerald-500" : "bg-gray-400")} />
          </div>
          <p className={cn("text-xs", examMode ? "text-white/40" : "text-[#64748d]")}>
            {room?.memberCount ?? 0}명 참여중
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Date divider */}
        <div className="flex items-center gap-3">
          <div className={cn("flex-1 h-px", examMode ? "bg-[#2a2d6b]" : "bg-[#e3e8ee]")} />
          <span className={cn("text-xs px-2", examMode ? "text-white/30" : "text-[#64748d]")}>오늘</span>
          <div className={cn("flex-1 h-px", examMode ? "bg-[#2a2d6b]" : "bg-[#e3e8ee]")} />
        </div>

        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className={cn("text-sm", examMode ? "text-white/40" : "text-[#64748d]")}>
              첫 메시지를 보내보세요!
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = isOwnMessage(msg.senderId);
          const showAvatar = !isOwn && (i === 0 || messages[i - 1].senderId !== msg.senderId);
          const msgDate = new Date(msg.createdAt);

          return (
            <div key={msg.id} className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
              {!isOwn && (
                <div className="w-8 flex-shrink-0">
                  {showAvatar && (
                    <Avatar nickname={msg.sender.nickname} level={msg.sender.level} size="sm" imageUrl={msg.sender.avatar ?? undefined} />
                  )}
                </div>
              )}

              <div className={cn("max-w-[75%] flex flex-col", isOwn ? "items-end" : "items-start")}>
                {!isOwn && showAvatar && (
                  <p className={cn("text-xs px-1 mb-0.5", examMode ? "text-white/50" : "text-[#64748d]")}>
                    {msg.sender.nickname}
                  </p>
                )}

                {msg.type === "image" && msg.fileUrl ? (
                  <img src={msg.fileUrl} alt="첨부 이미지" className="max-w-full rounded-xl max-h-64 object-contain" />
                ) : (
                  <div className={cn(
                    "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                    isOwn
                      ? "bg-[#533afd] text-white rounded-tr-sm"
                      : examMode
                      ? "bg-[#1c1e54] text-white border border-[#2a2d6b] rounded-tl-sm"
                      : "bg-white text-[#273951] border border-[#e3e8ee] rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                )}

                <p className={cn("text-[10px] px-1 mt-0.5", examMode ? "text-white/30" : "text-[#64748d]")}>
                  {msgDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex gap-2 items-end">
            <div className="w-8 flex-shrink-0" />
            <div className={cn("px-3 py-2 rounded-2xl rounded-tl-sm", examMode ? "bg-[#1c1e54] border border-[#2a2d6b]" : "bg-white border border-[#e3e8ee]")}>
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={cn("w-1.5 h-1.5 rounded-full animate-bounce", examMode ? "bg-white/40" : "bg-[#64748d]")}
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
            <p className={cn("text-[10px] mb-1", examMode ? "text-white/30" : "text-[#64748d]")}>
              {typingUsers.map((u) => u.nickname).join(", ")}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className={cn("border-t px-3 py-2", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            placeholder="메시지 입력..."
            rows={1}
            className={cn(
              "flex-1 rounded-2xl px-3 py-2 text-sm resize-none border transition-colors",
              "focus:outline-none focus:border-[#533afd]",
              examMode
                ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30"
                : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]"
            )}
            style={{ minHeight: "40px", maxHeight: "120px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="w-10 h-10 rounded-full bg-[#533afd] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#4434d4] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M3 10l14-7-7 14V10L3 10z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
