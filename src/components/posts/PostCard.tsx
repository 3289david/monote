"use client";
import Link from "next/link";
import { cn, timeAgo, getCategoryLabel, getImportanceLabel } from "@/lib/utils";
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

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-500",
  medium: "text-blue-500",
  low: "text-gray-400",
};

const IMPORTANCE_ICONS: Record<string, string> = {
  critical: "🔥", high: "⚠", medium: "★", low: "·",
};

export default function PostCard({ post, compact = false, examMode = false }: PostCardProps) {
  const { data: session } = useSession();
  const voteMutation = useVote(post.id);
  const bookmarkMutation = useBookmark(post.id);
  const shareMutation = useShare();

  const voted = post.userVoted ?? false;
  const bookmarked = post.userBookmarked ?? false;

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!session?.user) return;
    if (navigator.vibrate) navigator.vibrate(30);
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
      const result = await shareMutation.mutateAsync(url);
      await navigator.clipboard.writeText(result.shortUrl);
      toast.success("링크 복사됨");
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("링크 복사됨");
    }
  };

  const cardBase = examMode
    ? "bg-[#1c1e54] border-[#2a2d6b]"
    : "bg-white border-gray-100 hover:border-gray-200";

  const textPrimary = examMode ? "text-white" : "text-gray-900";
  const textMuted = examMode ? "text-white/50" : "text-gray-400";

  return (
    <Link href={`/post/${post.id}`}>
      <article className={cn("border rounded-lg px-4 py-3 transition-colors", cardBase, post.isPinned && !examMode && "border-l-2 border-l-[#533afd]")}>
        {/* Meta row */}
        <div className={cn("flex items-center gap-2 text-xs mb-1.5", textMuted)}>
          {post.isPinned && <span className="text-[#533afd] font-medium">📌</span>}
          <span className="text-[#533afd] font-medium">{getCategoryLabel(post.category)}</span>
          <span className={IMPORTANCE_COLORS[post.importance]}>
            {IMPORTANCE_ICONS[post.importance]} {getImportanceLabel(post.importance)}
          </span>
          <span className="ml-auto">{post.subject}</span>
          {post.examDate && (
            <span className="text-amber-500">시험 {Math.max(0, Math.ceil((new Date(post.examDate).getTime() - Date.now()) / 86400000))}일</span>
          )}
          {post.dueDate && (
            <span className="text-rose-500">제출 {Math.max(0, Math.ceil((new Date(post.dueDate).getTime() - Date.now()) / 86400000))}일</span>
          )}
        </div>

        {/* Title */}
        <h3 className={cn("font-medium text-sm leading-snug", textPrimary)}>
          {post.verified && <span className="text-[#533afd] mr-1">✓</span>}
          {post.title}
        </h3>

        {/* Content preview */}
        {!compact && (
          <p className={cn("text-xs leading-relaxed line-clamp-2 mt-1", textMuted)}>{post.content}</p>
        )}

        {/* Tags + files */}
        {!compact && (post.tags.length > 0 || post.files.length > 0) && (
          <div className={cn("flex flex-wrap gap-1 mt-1.5 text-[10px]", textMuted)}>
            {post.tags.map((t) => <span key={t} className="bg-gray-50 px-1.5 py-0.5 rounded">#{t}</span>)}
            {post.files.length > 0 && <span>📎 {post.files.length}개</span>}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-2">
          <span className={cn("text-[11px]", textMuted)}>
            {post.anonymous ? "익명" : post.authorNickname} · {timeAgo(new Date(post.createdAt))}
          </span>
          <div className="flex items-center gap-2">
            <span className={cn("text-[11px]", textMuted)}>👁 {post.viewCount}</span>
            <span className={cn("text-[11px]", textMuted)}>💬 {post.commentCount}</span>

            <button onClick={handleVote} disabled={voteMutation.isPending}
              className={cn("text-[11px] px-2 py-0.5 rounded-full transition-colors",
                voted ? "bg-[#533afd] text-white" : examMode ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-500 hover:bg-[#eeeaff] hover:text-[#533afd]"
              )}>
              ↑{post.voteCount}
            </button>

            <button onClick={handleBookmark} disabled={bookmarkMutation.isPending}
              className={cn("text-xs transition-colors", bookmarked ? "text-[#533afd]" : textMuted)}>
              {bookmarked ? "🔖" : "○"}
            </button>

            <button onClick={handleShare} disabled={shareMutation.isPending} className={cn("text-xs", textMuted)}>
              ↗
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
