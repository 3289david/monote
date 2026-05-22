"use client";
import Link from "next/link";
import { cn, timeAgo, getImportanceLabel, getImportanceColor, getCategoryLabel, getCategoryColor } from "@/lib/utils";
import type { Post } from "@/types";
import Avatar from "@/components/ui/Avatar";
import { useVote, useBookmark } from "@/hooks/usePosts";
import { useShare } from "@/hooks/useCommunity";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface PostCardProps {
  post: Post;
  compact?: boolean;
  examMode?: boolean;
}

const IMPORTANCE_ICONS: Record<string, string> = {
  critical: "🔥",
  high: "⚠",
  medium: "★",
  low: "•",
};

export default function PostCard({ post, compact = false, examMode = false }: PostCardProps) {
  const { data: session } = useSession();
  const voteMutation = useVote(post.id);
  const bookmarkMutation = useBookmark(post.id);
  const shareMutation = useShare();

  const voted = post.userVoted ?? false;
  const bookmarked = post.userBookmarked ?? false;
  const voteCount = post.voteCount;

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) return;
    if (navigator.vibrate) navigator.vibrate(30);
    voteMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) return;
    bookmarkMutation.mutate();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const pageUrl = `${window.location.origin}/post/${post.id}`;

    // Try native share sheet first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.slice(0, 120),
          url: pageUrl,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through to v.gd
      }
    }

    // Shorten via v.gd then copy
    try {
      const result = await shareMutation.mutateAsync(pageUrl);
      await navigator.clipboard.writeText(result.shortUrl);
      toast.success(result.fallback ? "링크가 복사됐어요" : `짧은 링크 복사 완료!\n${result.shortUrl}`, {
        duration: 3000,
      });
    } catch {
      await navigator.clipboard.writeText(pageUrl).catch(() => {});
      toast.success("링크가 복사됐어요");
    }
  };

  return (
    <Link href={`/post/${post.id}`}>
      <article
        className={cn(
          "group rounded-xl border transition-all duration-150",
          "hover:shadow-[0_8px_24px_rgba(0,55,112,0.08),0_2px_6px_rgba(0,55,112,0.04)]",
          "hover:-translate-y-0.5",
          examMode
            ? "bg-[#1c1e54]/80 border-[#2a2d6b] hover:border-[#533afd]"
            : "bg-white border-[#e3e8ee] hover:border-[#b9b9f9]",
          post.isPinned && !examMode && "border-l-4 border-l-[#533afd]"
        )}
      >
        <div className={cn("p-4", compact && "py-3")}>
          {/* Top: Category + Importance + Subject */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {post.isPinned && (
              <span className="text-[10px] bg-[#533afd] text-white px-2 py-0.5 rounded-full font-medium">
                고정
              </span>
            )}
            <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", getCategoryColor(post.category))}>
              {getCategoryLabel(post.category)}
            </span>
            <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium border", getImportanceColor(post.importance))}>
              {IMPORTANCE_ICONS[post.importance]} {getImportanceLabel(post.importance)}
            </span>
            <span className={cn("text-[11px] px-2 py-0.5 rounded-full ml-auto", examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d]")}>
              {post.subject}
            </span>
          </div>

          {/* Title */}
          <h3
            className={cn("font-normal text-base leading-snug mb-1", examMode ? "text-white" : "text-[#0d253d]", "group-hover:text-[#533afd] transition-colors")}
            style={{ letterSpacing: "-0.2px" }}
          >
            {post.verified && (
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 inline-block mr-1 text-[#533afd]">
                <circle cx="8" cy="8" r="7" fill="#533afd" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {post.title}
          </h3>

          {/* Content preview */}
          {!compact && (
            <p className={cn("text-sm leading-relaxed line-clamp-2 mb-3", examMode ? "text-white/60" : "text-[#64748d]")}>
              {post.content}
            </p>
          )}

          {/* Tags */}
          {post.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.map((tag) => (
                <span key={tag} className={cn("text-[11px] px-2 py-0.5 rounded-full", examMode ? "bg-[#2a2d6b] text-[#b9b9f9]" : "bg-[#b9b9f9]/30 text-[#4434d4]")}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* File indicator */}
          {post.files.length > 0 && (
            <div className={cn("flex items-center gap-1 text-xs mb-3", examMode ? "text-white/50" : "text-[#64748d]")}>
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M9 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V7l-5-5z" stroke="currentColor" strokeWidth={1.3} />
                <path d="M9 2v5h5" stroke="currentColor" strokeWidth={1.3} />
              </svg>
              파일 {post.files.length}개 첨부
            </div>
          )}

          {/* Exam date */}
          {post.examDate && (
            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg mb-3 w-fit">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth={1.3} />
                <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
              </svg>
              시험 {Math.max(0, Math.ceil((new Date(post.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}일 전
            </div>
          )}

          {/* Due date */}
          {post.dueDate && (
            <div className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-lg mb-3 w-fit">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth={1.3} />
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
              </svg>
              제출 {Math.max(0, Math.ceil((new Date(post.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}일 전
            </div>
          )}

          {/* Bottom: Author + Stats + Actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Avatar nickname={post.anonymous ? "익명" : post.authorNickname} level={post.authorLevel} size="xs" />
              <div>
                <span className={cn("text-xs font-medium", examMode ? "text-white/70" : "text-[#273951]")}>
                  {post.anonymous ? "익명" : post.authorNickname}
                </span>
                <span className={cn("text-xs ml-1", examMode ? "text-white/40" : "text-[#64748d]")}>
                  · {timeAgo(new Date(post.createdAt))}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("flex items-center gap-1 text-xs", examMode ? "text-white/40" : "text-[#64748d]")}>
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                  <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth={1.2} />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth={1.2} />
                </svg>
                {post.viewCount}
              </span>

              <span className={cn("flex items-center gap-1 text-xs", examMode ? "text-white/40" : "text-[#64748d]")}>
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                  <path d="M14 10a2 2 0 01-2 2H6l-3 3V5a2 2 0 012-2h7a2 2 0 012 2v5z" stroke="currentColor" strokeWidth={1.2} />
                </svg>
                {post.commentCount}
              </span>

              <button
                onClick={handleVote}
                disabled={voteMutation.isPending}
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors",
                  voted
                    ? "bg-[#533afd] text-white"
                    : examMode
                    ? "bg-[#2a2d6b] text-white/60 hover:bg-[#363996]"
                    : "bg-[#f6f9fc] text-[#273951] hover:bg-[#eeeaff] hover:text-[#533afd]"
                )}
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                  <path d="M8 2l1.5 4.5H14l-3.8 2.8 1.5 4.5L8 11.1l-3.7 2.7 1.5-4.5L2 6.5h4.5L8 2z"
                    stroke="currentColor" strokeWidth={1.2} fill={voted ? "currentColor" : "none"} />
                </svg>
                {voteCount}
              </button>

              <button
                onClick={handleBookmark}
                disabled={bookmarkMutation.isPending}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  bookmarked ? "text-[#533afd]" : examMode ? "text-white/40 hover:text-white/70" : "text-[#64748d] hover:text-[#533afd]"
                )}
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M3 2h10a1 1 0 011 1v11l-6-3-6 3V3a1 1 0 011-1z"
                    stroke="currentColor" strokeWidth={1.3}
                    fill={bookmarked ? "currentColor" : "none"}
                  />
                </svg>
              </button>

              {/* Share button */}
              <button
                onClick={handleShare}
                disabled={shareMutation.isPending}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  examMode ? "text-white/40 hover:text-white/70" : "text-[#64748d] hover:text-[#533afd]"
                )}
                title="공유하기"
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth={1.3}/>
                  <circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth={1.3}/>
                  <circle cx="3" cy="8" r="1.5" stroke="currentColor" strokeWidth={1.3}/>
                  <path d="M4.5 7.2l7-3.5M4.5 8.8l7 3.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
