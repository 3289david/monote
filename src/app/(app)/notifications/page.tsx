"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/ui-store";
import { cn, timeAgo } from "@/lib/utils";
import Link from "next/link";

import type { ReactElement } from "react";

type NotifType = "vote" | "comment" | "system" | "badge";

const TYPE_ICONS: Record<NotifType | string, ReactElement> = {
  vote: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M8 2l1.5 4.5H14l-3.8 2.8 1.5 4.5L8 11.1l-3.7 2.7 1.5-4.5L2 6.5h4.5L8 2z" stroke="currentColor" strokeWidth={1.2} fill="currentColor" />
    </svg>
  ),
  comment: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M14 10a2 2 0 01-2 2H6l-3 3V5a2 2 0 012-2h7a2 2 0 012 2v5z" stroke="currentColor" strokeWidth={1.2} fill="currentColor" fillOpacity={0.2} />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth={1.2} />
      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  ),
  badge: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M8 2l1.2 3.6H13l-3 2.2 1.2 3.6L8 9.1 4.8 11.4 6 7.8 3 5.6h3.8L8 2z" stroke="currentColor" strokeWidth={1.2} fill="currentColor" />
    </svg>
  ),
};

const TYPE_COLORS: Record<string, string> = {
  vote: "bg-amber-100 text-amber-600",
  comment: "bg-blue-100 text-blue-600",
  system: "bg-gray-100 text-gray-600",
  badge: "bg-violet-100 text-violet-600",
};

export default function NotificationsPage() {
  const examMode = useUIStore((s) => s.examMode);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
  });

  const markAllRead = useMutation({
    mutationFn: () => fetch("/api/notifications", { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-notif"] });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";
  const cardBg = examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-xl font-light", textColor)} style={{ letterSpacing: "-0.4px" }}>알림</h1>
          {unreadCount > 0 && (
            <p className={cn("text-sm", mutedText)}>읽지 않은 알림 {unreadCount}개</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
            className="text-sm text-[#533afd] hover:underline disabled:opacity-50">
            모두 읽음
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={cn("rounded-xl border p-4 h-16 animate-pulse", cardBg)} />
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#eeeaff] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#533afd]">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className={cn("font-medium mb-1", textColor)}>알림이 없어요</p>
          <p className={cn("text-sm", mutedText)}>게시물을 공유하거나 댓글을 달면 알림이 와요</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif: any) => {
          const content = (
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-all",
              notif.read
                ? cardBg
                : examMode ? "bg-[#2a2d6b] border-[#363996]" : "bg-[#eeeaff]/50 border-[#b9b9f9]",
              notif.postId && "hover:-translate-y-0.5"
            )}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", TYPE_COLORS[notif.type] ?? TYPE_COLORS.system)}>
                {TYPE_ICONS[notif.type as NotifType] ?? TYPE_ICONS.system}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", notif.read ? mutedText : textColor)}>{notif.message}</p>
                <p className={cn("text-xs mt-0.5", mutedText)}>{timeAgo(new Date(notif.createdAt))}</p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 bg-[#533afd] rounded-full flex-shrink-0 mt-1.5" />
              )}
            </div>
          );

          return notif.postId ? (
            <Link key={notif.id} href={`/post/${notif.postId}`}>{content}</Link>
          ) : (
            <div key={notif.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
