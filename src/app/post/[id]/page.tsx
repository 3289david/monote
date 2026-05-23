"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePost, useVote, useBookmark, useComments, useAddComment } from "@/hooks/usePosts";
import { useReactions, useToggleReaction, useShare } from "@/hooks/useCommunity";
import { timeAgo, cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

// Kept as text/emoji since these ARE the reaction content users interact with
const REACTIONS = ["👍", "🔥", "😱", "🤔", "💯", "😂"];

function IconBack() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
      <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4.5 h-4.5">
      <circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth={1.5}/>
      <path d="M7 9l6-4M7 11l6 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
    </svg>
  );
}

function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4.5 h-4.5">
      <path d="M5 3h10a1 1 0 011 1v13l-6-4-6 4V4a1 1 0 011-1z"
        stroke="currentColor" strokeWidth={1.5}
        fill={filled ? "currentColor" : "none"}/>
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={cn("w-3 h-3", className)}>
      <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth={1.2}/>
      <path d="M1 6h12" stroke="currentColor" strokeWidth={1.2}/>
      <path d="M4 1v2M10 1v2" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"/>
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={cn("w-3 h-3", className)}>
      <rect x="2" y="2" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth={1.2}/>
      <path d="M4 2.5V2a1 1 0 011-1h4a1 1 0 011 1v.5" stroke="currentColor" strokeWidth={1.2}/>
      <path d="M4 7h6M4 9.5h4" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"/>
    </svg>
  );
}

function IconFileDoc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("w-5 h-5", className)}>
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth={1.5}/>
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
    </svg>
  );
}

function IconUpvote() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
      <path d="M8 13V3M8 3L4 7M8 3l4 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconSend() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
      <path d="M10 3v14M10 3L5 8M10 3l5 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const { data: postData, isLoading } = usePost(id);
  const { data: commentsData } = useComments(id);
  const { data: reactionsData } = useReactions(id);
  const voteMutation = useVote(id);
  const bookmarkMutation = useBookmark(id);
  const toggleReaction = useToggleReaction(id);
  const shareMutation = useShare();
  const addComment = useAddComment(id);

  const post = postData?.post;
  const comments = commentsData?.comments ?? [];
  const reactions = reactionsData?.reactions ?? REACTIONS.map((e) => ({ emoji: e, count: 0, reacted: false }));
  const isLoggedIn = !!session?.user;
  const voted = post?.isVoted ?? post?.userVoted ?? false;
  const bookmarked = post?.isBookmarked ?? post?.userBookmarked ?? false;

  const goLogin = () => router.push(`/login?callbackUrl=/post/${id}`);
  const daysUntil = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${id}`;
    if (navigator.share && post) {
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

  const handleSubmitComment = () => {
    if (!isLoggedIn) { goLogin(); return; }
    if (!comment.trim()) return;
    addComment.mutate({ content: comment.trim(), anonymous });
    setComment("");
  };

  const handleReport = async () => {
    if (!isLoggedIn) { goLogin(); return; }
    const res = await fetch(`/api/posts/${id}/report`, { method: "POST" });
    if (res.ok) toast.success("신고 접수됨");
    else toast.error("신고 실패");
  };

  if (isLoading) return (
    <div className="min-h-screen bg-white pb-32 animate-pulse">
      <div className="h-12 border-b border-gray-100" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-6 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 mx-auto mb-4 text-gray-200">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2"/>
          <path d="M32 20v16M32 42v2" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <p className="text-gray-500 mb-3">게시물을 찾을 수 없어요</p>
        <button onClick={() => router.back()} className="text-[#533afd] text-sm flex items-center gap-1 mx-auto">
          <IconBack /> 돌아가기
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 h-12">
        <button onClick={() => router.back()} className="text-gray-500 p-1 -ml-1 mr-auto">
          <IconBack />
        </button>
        <button onClick={handleShare} disabled={shareMutation.isPending} className="p-2 text-gray-400 hover:text-gray-700">
          <IconShare />
        </button>
        <button onClick={() => { if (!isLoggedIn) { goLogin(); return; } bookmarkMutation.mutate(); }}
          disabled={bookmarkMutation.isPending}
          className={cn("p-2", bookmarked ? "text-[#533afd]" : "text-gray-400 hover:text-gray-700")}>
          <IconBookmark filled={bookmarked} />
        </button>
      </header>

      {/* Gradient banner strip */}
      <div className="h-1.5" style={{
        background: "linear-gradient(90deg, #f5e9d4 0%, #f96bee 30%, #b9b9f9 55%, #533afd 78%, #1c1e54 100%)"
      }} />

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 leading-snug mb-2" style={{ letterSpacing: "-0.4px" }}>{post.title}</h1>
          <p className="text-sm text-gray-400">
            {post.anonymous ? "익명" : post.authorNickname} · {timeAgo(new Date(post.createdAt))} · 조회 {post.viewCount}
          </p>
        </div>

        {/* Date badges */}
        {(post.examDate || post.dueDate) && (
          <div className="flex gap-2 flex-wrap">
            {post.examDate && (
              <span className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <IconCalendar className="text-amber-500" />
                시험 {daysUntil(post.examDate as string)}일 전
              </span>
            )}
            {post.dueDate && (
              <span className="flex items-center gap-1.5 text-sm text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
                <IconClipboard className="text-rose-400" />
                제출 {daysUntil(post.dueDate as string)}일 전
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag: string) => (
              <Link key={tag} href={`/board?tag=${encodeURIComponent(tag)}`}
                className="text-sm px-2.5 py-1 rounded-full bg-[#eeeaff] text-[#533afd] hover:bg-[#b9b9f9]/30 transition-colors">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Files */}
        {(post.files as any[]).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">첨부파일</p>
            {(post.files as any[]).map((file: any, i: number) => {
              const isImage = file.type === "image" || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              return (
                <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#533afd] transition-colors group">
                  {isImage ? (
                    <img src={file.url} alt={file.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#eeeaff] flex items-center justify-center flex-shrink-0">
                      <IconFileDoc className="text-[#533afd]" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-[#533afd]">{file.name}</span>
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-gray-400 flex-shrink-0">
                    <path d="M8 3v9M8 12l-3-3M8 12l3-3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              );
            })}
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-4">
          {/* Emoji reactions — kept as emoji since these ARE the reaction content */}
          <div className="flex flex-wrap gap-1.5">
            {reactions.map(({ emoji, count, reacted }: { emoji: string; count: number; reacted: boolean }) => (
              <button key={emoji}
                onClick={() => { if (!isLoggedIn) { goLogin(); return; } toggleReaction.mutate(emoji); if (navigator.vibrate) navigator.vibrate(20); }}
                disabled={toggleReaction.isPending}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm border transition-all active:scale-95",
                  reacted ? "bg-[#eeeaff] border-[#533afd]/30 text-[#533afd]" : "bg-white border-gray-200 hover:border-gray-300"
                )}>
                {emoji}{count > 0 && <span className="text-xs font-medium text-gray-600">{count}</span>}
              </button>
            ))}
          </div>

          {/* Vote + Report */}
          <div className="flex items-center gap-2">
            <button onClick={() => { if (!isLoggedIn) { goLogin(); return; } voteMutation.mutate(); }}
              disabled={voteMutation.isPending}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors border",
                voted ? "bg-[#533afd] text-white border-[#533afd]" : "bg-white text-gray-700 border-gray-200 hover:border-[#533afd] hover:text-[#533afd]"
              )}>
              <IconUpvote />
              도움됐어요 {post.voteCount}
            </button>
            <button onClick={handleReport} className="ml-auto text-xs text-gray-300 hover:text-red-400 transition-colors px-2 py-1">
              신고
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">댓글 {comments.length}개</p>
          {comments.length === 0 && (
            <div className="text-center py-8">
              <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mx-auto mb-3 text-gray-200">
                <path d="M8 8h32a2 2 0 012 2v20a2 2 0 01-2 2H14l-8 6V10a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M16 18h16M16 24h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-sm text-gray-400">첫 댓글을 남겨보세요</p>
            </div>
          )}
          {comments.map((c: any) => (
            <div key={c.id} className={cn("py-3 border-b border-gray-50 last:border-0", c.isAnswer && "border-l-2 border-l-[#533afd] pl-3")}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800">{c.anonymous ? "익명" : c.author?.nickname}</span>
                <span className="text-xs text-gray-400">{timeAgo(new Date(c.createdAt))}</span>
                {c.isAnswer && (
                  <span className="text-xs text-[#533afd] bg-[#eeeaff] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    추가 정보
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed comment input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 md:bottom-0 bottom-14">
        <div className="max-w-2xl mx-auto">
          {!isLoggedIn ? (
            <button onClick={goLogin}
              className="w-full py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-400 text-center hover:bg-[#eeeaff] hover:text-[#533afd] hover:border-[#b9b9f9] transition-colors">
              로그인 후 댓글 달기
            </button>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="댓글 작성..." rows={1}
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none border border-gray-200 focus:outline-none focus:border-[#533afd] bg-gray-50"
                  style={{ minHeight: "40px", maxHeight: "100px" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSubmitComment(); } }}
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <button onClick={() => setAnonymous(!anonymous)}
                  className={cn("text-xs px-2.5 py-1.5 rounded-full border transition-colors",
                    anonymous ? "bg-[#533afd] text-white border-[#533afd]" : "border-gray-200 text-gray-500")}>
                  익명
                </button>
                <button onClick={handleSubmitComment} disabled={!comment.trim() || addComment.isPending}
                  className="w-9 h-9 rounded-full bg-[#533afd] text-white flex items-center justify-center disabled:opacity-30 hover:bg-[#4434d4] transition-colors flex-shrink-0">
                  <IconSend />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
