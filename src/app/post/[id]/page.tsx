"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { usePost, useVote, useBookmark, useComments, useAddComment } from "@/hooks/usePosts";
import { useReactions, useToggleReaction, useShare } from "@/hooks/useCommunity";
import { timeAgo, getCategoryLabel, getCategoryColor, getImportanceLabel, getImportanceColor, getLevelColor, getLevelName, cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import toast from "react-hot-toast";

const IMPORTANCE_ICONS: Record<string, string> = { critical: "🔥", high: "⚠", medium: "★", low: "•" };
const REACTION_EMOJIS = ["👍", "🔥", "😱", "🤔", "💯", "😂"];

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const { data: postData, isLoading: postLoading } = usePost(id);
  const { data: commentsData } = useComments(id);
  const { data: reactionsData } = useReactions(id);
  const voteMutation = useVote(id);
  const bookmarkMutation = useBookmark(id);
  const toggleReaction = useToggleReaction(id);
  const shareMutation = useShare();
  const addComment = useAddComment(id);

  const post = postData?.post;
  const comments = commentsData?.comments ?? [];
  const reactions = reactionsData?.reactions ?? REACTION_EMOJIS.map(e => ({ emoji: e, count: 0, reacted: false }));

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    addComment.mutate({ content: comment.trim(), anonymous });
    setComment("");
  };

  const handleReport = async () => {
    const res = await fetch(`/api/posts/${id}/report`, { method: "POST" });
    if (res.ok) toast.success("신고가 접수되었어요");
    else toast.error("신고에 실패했어요");
  };

  const handleShare = async () => {
    const pageUrl = `${window.location.origin}/post/${id}`;
    if (navigator.share && post) {
      try {
        await navigator.share({ title: post.title, text: post.content.slice(0, 120), url: pageUrl });
        return;
      } catch {}
    }
    try {
      const result = await shareMutation.mutateAsync(pageUrl);
      await navigator.clipboard.writeText(result.shortUrl);
      toast.success(result.fallback ? "링크가 복사됐어요" : `짧은 링크 복사!\n${result.shortUrl}`, { duration: 3000 });
    } catch {
      await navigator.clipboard.writeText(pageUrl).catch(() => {});
      toast.success("링크가 복사됐어요");
    }
  };

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";

  if (postLoading) {
    return (
      <div className={cn("min-h-screen pb-32 animate-pulse", examMode ? "bg-[#0f1138]" : "bg-[#f6f9fc]")}>
        <div className="h-14 bg-white border-b border-[#e3e8ee]" />
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          <div className={cn("rounded-xl border p-5 h-64", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", examMode ? "bg-[#0f1138]" : "bg-[#f6f9fc]")}>
        <div className="text-center">
          <p className={cn("font-medium mb-2", textColor)}>게시물을 찾을 수 없어요</p>
          <button onClick={() => router.back()} className="text-[#533afd] text-sm hover:underline">돌아가기</button>
        </div>
      </div>
    );
  }

  const voted = post.userVoted ?? false;
  const bookmarked = post.userBookmarked ?? false;

  return (
    <div className={cn("min-h-screen pb-32", examMode ? "bg-[#0f1138]" : "bg-[#f6f9fc]")}>
      <header className={cn("sticky top-0 z-40 border-b flex items-center px-4 h-14", examMode ? "bg-[#1c1e54]/90 backdrop-blur-xl border-[#2a2d6b]" : "bg-white/90 backdrop-blur-xl border-[#e3e8ee]")}>
        <button onClick={() => router.back()} className={cn("p-1 -ml-1 rounded-lg mr-3", examMode ? "text-white/70" : "text-[#64748d]")}>
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={cn("flex-1 text-base font-light truncate", textColor)}>{getCategoryLabel(post.category)}</h1>

        {/* Share button */}
        <button
          onClick={handleShare}
          disabled={shareMutation.isPending}
          className={cn("p-1.5 mr-1", examMode ? "text-white/60" : "text-[#64748d]")}
          title="공유하기"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth={1.8}/>
            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth={1.8}/>
            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth={1.8}/>
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
          </svg>
        </button>

        <button onClick={() => bookmarkMutation.mutate()} disabled={bookmarkMutation.isPending}
          className={cn("p-1.5", bookmarked ? "text-[#533afd]" : examMode ? "text-white/60" : "text-[#64748d]")}>
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth={1.8} fill={bookmarked ? "currentColor" : "none"} />
          </svg>
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Post */}
        <article className={cn("rounded-xl border p-5", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getCategoryColor(post.category))}>{getCategoryLabel(post.category)}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border", getImportanceColor(post.importance))}>
              {IMPORTANCE_ICONS[post.importance]} {getImportanceLabel(post.importance)}
            </span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d]")}>{post.subject}</span>
            {post.verified && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#533afd] text-white flex items-center gap-1">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><circle cx="6" cy="6" r="5" fill="currentColor" opacity={0.3} /><path d="M3.5 6l1.5 1.5 3.5-3.5" stroke="white" strokeWidth={1.2} strokeLinecap="round" /></svg>
                검증됨
              </span>
            )}
          </div>

          <h1 className={cn("text-xl font-light mb-3 leading-snug", textColor)} style={{ letterSpacing: "-0.4px" }}>{post.title}</h1>

          <div className="flex items-center gap-2.5 mb-4">
            <Avatar nickname={post.anonymous ? "익명" : post.authorNickname} level={post.authorLevel} size="sm" />
            <div>
              <p className={cn("text-sm font-medium", examMode ? "text-white" : "text-[#273951]")}>{post.anonymous ? "익명" : post.authorNickname}</p>
              <p className={cn("text-xs", mutedText)}>
                <span className={getLevelColor(post.authorLevel)}>{getLevelName(post.authorLevel)}</span>{" · "}
                {timeAgo(new Date(post.createdAt))}{" · "}조회 {post.viewCount}
              </p>
            </div>
          </div>

          {(post.examDate || post.dueDate) && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {post.examDate && (
                <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  시험 {Math.max(0, Math.ceil((new Date(post.examDate).getTime() - Date.now()) / 86400000))}일 전
                </div>
              )}
              {post.dueDate && (
                <div className="flex items-center gap-1.5 text-sm text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                  제출 {Math.max(0, Math.ceil((new Date(post.dueDate).getTime() - Date.now()) / 86400000))}일 전
                </div>
              )}
            </div>
          )}

          <div className={cn("text-[15px] leading-relaxed whitespace-pre-wrap", examMode ? "text-white/80" : "text-[#273951]")}>{post.content}</div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {post.tags.map((tag: string) => (
                <span key={tag} className={cn("text-xs px-2.5 py-1 rounded-full", examMode ? "bg-[#2a2d6b] text-[#b9b9f9]" : "bg-[#b9b9f9]/30 text-[#4434d4]")}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Files */}
          {(post.files as any[]).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className={cn("text-xs font-medium uppercase tracking-wider", mutedText)}>첨부 파일</p>
              {(post.files as any[]).map((file: any, i: number) => (
                <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                  className={cn("w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    examMode ? "bg-[#2a2d6b] border-[#363996] hover:bg-[#363996]" : "bg-[#f6f9fc] border-[#e3e8ee] hover:border-[#533afd]")}>
                  <div className="w-8 h-8 rounded bg-[#533afd]/10 flex items-center justify-center">
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[#533afd]">
                      <path d="M9 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V7l-5-5z" stroke="currentColor" strokeWidth={1.2} />
                      <path d="M9 2v5h5" stroke="currentColor" strokeWidth={1.2} />
                    </svg>
                  </div>
                  <p className={cn("text-sm truncate flex-1", textColor)}>{file.name}</p>
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0 text-[#64748d]">
                    <path d="M8 3v7M5 7l3 3 3-3M2 13h12" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
                  </svg>
                </a>
              ))}
            </div>
          )}

          {/* Emoji reactions */}
          <div className={cn("mt-4 pt-4 border-t", examMode ? "border-[#2a2d6b]" : "border-[#e3e8ee]/60")}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {reactions.map(({ emoji, count, reacted }: { emoji: string; count: number; reacted: boolean }) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction.mutate(emoji)}
                  disabled={toggleReaction.isPending}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all active:scale-95",
                    reacted
                      ? "bg-[#533afd]/15 border border-[#533afd]/40 text-[#533afd]"
                      : examMode
                      ? "bg-[#2a2d6b] border border-[#363996] text-white/60 hover:bg-[#363996]"
                      : "bg-[#f6f9fc] border border-[#e3e8ee] text-[#273951] hover:border-[#b9b9f9]"
                  )}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="text-xs font-medium">{count}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => voteMutation.mutate()} disabled={voteMutation.isPending}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                voted ? "bg-[#533afd] text-white"
                  : examMode ? "bg-[#2a2d6b] text-white/60 hover:bg-[#363996]"
                  : "bg-[#f6f9fc] text-[#273951] hover:bg-[#eeeaff] hover:text-[#533afd] border border-[#e3e8ee]")}>
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M8 2l1.5 4.5H14l-3.8 2.8 1.5 4.5L8 11.1l-3.7 2.7 1.5-4.5L2 6.5h4.5L8 2z" stroke="currentColor" strokeWidth={1.2} fill={voted ? "currentColor" : "none"} />
              </svg>
              도움됐어요 {post.voteCount}
            </button>
            <button onClick={handleReport} className={cn("ml-auto text-xs px-3 py-1.5 rounded-full", examMode ? "text-white/30 hover:text-white/60" : "text-[#64748d] hover:text-red-500")}>
              신고
            </button>
          </div>
        </article>

        {/* Comments */}
        <div className="space-y-3">
          <h2 className={cn("font-medium", textColor)}>댓글 {comments.length}개</h2>
          {comments.map((c: any) => (
            <div key={c.id} className={cn("rounded-xl border p-4", c.isAnswer && "border-[#533afd]/30", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
              {c.isAnswer && (
                <div className="flex items-center gap-1 text-xs text-[#533afd] mb-2">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><circle cx="6" cy="6" r="5" fill="#533afd" /><path d="M3.5 6l1.5 1.5 3.5-3.5" stroke="white" strokeWidth={1.2} strokeLinecap="round" /></svg>
                  추가 정보
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Avatar nickname={c.anonymous ? "익명" : c.author?.nickname ?? "?"} level={c.author?.level ?? 1} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-sm font-medium", examMode ? "text-white" : "text-[#273951]")}>{c.anonymous ? "익명" : c.author?.nickname}</span>
                    <span className={cn("text-xs", mutedText)}>{timeAgo(new Date(c.createdAt))}</span>
                  </div>
                  <p className={cn("text-sm leading-relaxed", examMode ? "text-white/70" : "text-[#273951]")}>{c.content}</p>
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-6">
              <p className={cn("text-sm", mutedText)}>첫 댓글을 남겨보세요</p>
            </div>
          )}
        </div>

        {/* Comment input (fixed) */}
        <div className={cn("fixed bottom-16 md:bottom-0 left-0 right-0 border-t px-4 py-3", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
          <div className="max-w-2xl mx-auto flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <button onClick={() => setAnonymous(!anonymous)}
                  className={cn("text-xs px-2.5 py-1 rounded-full transition-all",
                    anonymous ? "bg-[#533afd] text-white" : examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d] border border-[#e3e8ee]")}>
                  {anonymous ? "익명 ON" : "익명"}
                </button>
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요..." rows={1}
                className={cn("w-full rounded-xl px-3 py-2.5 text-sm resize-none border transition-colors focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")}
                style={{ minHeight: "40px", maxHeight: "100px" }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
              />
            </div>
            <button onClick={handleSubmitComment} disabled={!comment.trim() || addComment.isPending}
              className="w-10 h-10 rounded-full bg-[#533afd] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#4434d4] transition-colors">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M14 8H2M14 8l-5 5M14 8l-5-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
