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

function IconEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3 h-3", className)}>
      <path d="M1 8C2.5 4.5 5 3 8 3s5.5 1.5 7 5c-1.5 3.5-4 5-7 5S2.5 11.5 1 8z" stroke="currentColor" strokeWidth={1.3}/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth={1.3}/>
    </svg>
  );
}

function IconComment({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3 h-3", className)}>
      <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-4 3V3z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={cn("w-3 h-3", className)}>
      <path d="M8.5 2L12 5.5l-3 1-2.5 4L5 9l-3 3M5 9l1.5-2.5M8.5 2L10 1M8.5 2L5.5 5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconVerified({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={cn("w-3.5 h-3.5", className)}>
      <path d="M7 1l1.5 1.5L10.5 2l.5 2 2 1-1 2 1 2-2 1-.5 2-2-.5L7 13l-1.5-1.5L3.5 12 3 10 1 9l1-2-1-2 2-1 .5-2L5.5 2.5 7 1z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth={1.2}/>
      <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconBookmark({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3.5 h-3.5", className)}>
      <path d="M3 2h10a1 1 0 011 1v11l-6-4-6 4V3a1 1 0 011-1z"
        stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}/>
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3.5 h-3.5", className)}>
      <circle cx="12" cy="3" r="1.5" stroke="currentColor" strokeWidth={1.3}/>
      <circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth={1.3}/>
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth={1.3}/>
      <path d="M5.5 7.1L10.5 4M5.5 8.9l5 3.1" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
    </svg>
  );
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
        examMode ? "bg-[#0f1138] border-[#2a2d6b] hover:bg-[#1c1e54]" : "bg-white border-gray-100 hover:bg-gray-50/80",
        post.isPinned && "border-l-2 border-l-[#533afd]"
      )}>
        {/* Title */}
        <h3 className={cn("font-medium text-[15px] leading-snug mb-1 flex items-start gap-1.5", examMode ? "text-white" : "text-gray-900")}>
          {post.isPinned && (
            <IconPin className="mt-0.5 flex-shrink-0 text-[#533afd]" />
          )}
          {post.verified && (
            <IconVerified className="mt-0.5 flex-shrink-0 text-[#533afd]" />
          )}
          <span className="flex-1">{post.title}</span>
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
            {post.examDate && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                  <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth={1.2}/>
                  <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"/>
                </svg>
                시험 {daysUntil(post.examDate)}일
              </span>
            )}
            {post.dueDate && (
              <span className="flex items-center gap-1 text-xs text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                  <path d="M2 2h8a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth={1.2}/>
                  <path d="M3 5h6M3 7h4" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"/>
                </svg>
                제출 {daysUntil(post.dueDate)}일
              </span>
            )}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <span className={cn("text-xs flex items-center gap-1.5", examMode ? "text-white/35" : "text-gray-400")}>
            {post.anonymous ? (
              <span>익명</span>
            ) : (
              <Link href={`/profile/${(post as any).authorId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-[#533afd] hover:underline transition-colors">
                {post.authorNickname}
              </Link>
            )}
            <span>·</span>
            {timeAgo(new Date(post.createdAt))}
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <IconEye />
              {post.viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <IconComment />
              {post.commentCount}
            </span>
          </span>
          <div className="flex items-center gap-1.5">
            {/* Vote */}
            <button onClick={handleVote} disabled={voteMutation.isPending}
              className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all active:scale-95",
                voted
                  ? "bg-[#533afd] text-white"
                  : examMode
                    ? "bg-white/10 text-white/60 hover:bg-white/20"
                    : "bg-gray-100 text-gray-500 hover:bg-[#eeeaff] hover:text-[#533afd]"
              )}>
              <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                <path d="M6 10V2M6 2L3 5M6 2l3 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {post.voteCount}
            </button>
            {/* Bookmark */}
            <button onClick={handleBookmark} disabled={bookmarkMutation.isPending}
              className={cn("transition-colors p-1",
                bookmarked ? "text-[#533afd]" : examMode ? "text-white/35 hover:text-white/60" : "text-gray-300 hover:text-gray-500"
              )}>
              <IconBookmark filled={bookmarked} />
            </button>
            {/* Share */}
            <button onClick={handleShare} disabled={shareMutation.isPending}
              className={cn("transition-colors p-1",
                examMode ? "text-white/35 hover:text-white/60" : "text-gray-300 hover:text-gray-500"
              )}>
              <IconShare />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
