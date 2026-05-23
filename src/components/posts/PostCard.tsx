"use client";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";
import type { Post } from "@/types";
import { useVote, useBookmark } from "@/hooks/usePosts";
import { useShare } from "@/hooks/useCommunity";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface PostCardProps {
  post: Post;
  compact?: boolean;
  examMode?: boolean;
}

export default function PostCard({ post, compact = false, examMode = false }: PostCardProps) {
  const { data: session } = useSession();
  const voteMutation = useVote(post.id);
  const bookmarkMutation = useBookmark(post.id);
  const shareMutation = useShare();
  const voted = post.userVoted ?? (post as any).isVoted ?? false;
  const bookmarked = post.userBookmarked ?? (post as any).isBookmarked ?? false;

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!session?.user) return;
    if (navigator.vibrate) navigator.vibrate(20);
    voteMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!session?.user) return;
    bookmarkMutation.mutate();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: post.content.slice(0, 120), url }); return; } catch {}
    }
    try {
      const r = await shareMutation.mutateAsync(url);
      await navigator.clipboard.writeText(r.shortUrl);
      toast.success("링크 복사됨");
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("링크 복사됨");
    }
  };

  const daysUntil = (d: Date | string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

  return (
    <Link href={`/post/${post.id}`}>
      <article className={cn(
        "px-4 py-3.5 border-b transition-colors",
        examMode ? "bg-[#0f1138] border-[#2a2d6b] hover:bg-[#1c1e54]" : "bg-white border-gray-100 hover:bg-gray-50",
        post.isPinned && "border-l-2 border-l-[#533afd]"
      )}>
        {/* Title */}
        <h3 className={cn("font-medium text-[15px] leading-snug mb-1", examMode ? "text-white" : "text-gray-900")}>
          {post.isPinned && <span className="text-[#533afd] mr-1 text-xs">📌</span>}
          {post.verified && <span className="text-[#533afd] mr-1">✓</span>}
          {post.title}
        </h3>

        {/* Content preview */}
        {!compact && (
          <p className={cn("text-sm leading-relaxed line-clamp-2 mb-2", examMode ? "text-white/55" : "text-gray-500")}>
            {post.content}
          </p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.map((t) => (
              <span key={t} className={cn("text-xs px-2 py-0.5 rounded-full", examMode ? "bg-[#2a2d6b] text-[#b9b9f9]" : "bg-[#eeeaff] text-[#533afd]")}>
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Dates */}
        {(post.examDate || post.dueDate) && (
          <div className="flex gap-2 mb-2">
            {post.examDate && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">📅 시험 {daysUntil(post.examDate)}일</span>}
            {post.dueDate && <span className="text-xs text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">📋 제출 {daysUntil(post.dueDate)}일</span>}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <span className={cn("text-xs", examMode ? "text-white/35" : "text-gray-400")}>
            {post.anonymous ? "익명" : post.authorNickname} · {timeAgo(new Date(post.createdAt))} · 👁{post.viewCount} · 💬{post.commentCount}
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={handleVote} disabled={voteMutation.isPending}
              className={cn("text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                voted ? "bg-[#533afd] text-white" : examMode ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-500 hover:bg-[#eeeaff] hover:text-[#533afd]"
              )}>
              ↑ {post.voteCount}
            </button>
            <button onClick={handleBookmark} disabled={bookmarkMutation.isPending}
              className={cn("text-sm transition-colors", bookmarked ? "text-[#533afd]" : examMode ? "text-white/35" : "text-gray-300 hover:text-gray-500")}>
              {bookmarked ? "🔖" : "🔖"}
            </button>
            <button onClick={handleShare} disabled={shareMutation.isPending}
              className={cn("text-xs transition-colors", examMode ? "text-white/35" : "text-gray-300 hover:text-gray-500")}>
              ↗
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
