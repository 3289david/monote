"use client";
import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePosts } from "@/hooks/usePosts";
import { useTrending } from "@/hooks/useCommunity";
import PostCard from "@/components/posts/PostCard";
import { useUIStore } from "@/store/ui-store";
import { cn, timeAgo } from "@/lib/utils";
import Link from "next/link";
import type { PostCategory } from "@/types";

const CATEGORY_FILTERS: { value: PostCategory | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "exam_range", label: "시험 범위" },
  { value: "performance", label: "수행평가" },
  { value: "materials", label: "자료실" },
  { value: "teacher_info", label: "선생님 정보" },
  { value: "question", label: "질문" },
];

export default function FeedPage() {
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const selectedGrade = useUIStore((s) => s.selectedGrade);
  const [activeCategory, setActiveCategory] = useState<PostCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "hot">("latest");

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const [pullIndicator, setPullIndicator] = useState(0); // 0-1 progress

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = usePosts({
    grade: selectedGrade || undefined,
    category: activeCategory === "all" ? undefined : activeCategory,
    sortBy,
    examMode,
  });

  const { data: trendingData } = useTrending("today");

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const pinnedPosts = posts.filter((p: any) => p.isPinned);
  const regularPosts = posts.filter((p: any) => !p.isPinned);
  const hotToday = trendingData?.posts?.slice(0, 3) ?? [];

  const user = session?.user;

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop ?? 0;
    if (scrollTop > 0) return; // Only trigger at top
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      pullDistance.current = dy;
      setPullIndicator(Math.min(dy / 80, 1));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance.current > 80 && !isRefreshing) {
      setIsRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(20);
      await refetch();
      setIsRefreshing(false);
    }
    pullDistance.current = 0;
    setPullIndicator(0);
  }, [isRefreshing, refetch]);

  return (
    <div
      className="space-y-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullIndicator > 0 || isRefreshing) && (
        <div className="flex justify-center -mt-2 mb-0 transition-all">
          <div className={cn(
            "w-8 h-8 rounded-full bg-white border border-[#e3e8ee] shadow flex items-center justify-center transition-transform",
            isRefreshing && "animate-spin"
          )} style={{ opacity: pullIndicator }}>
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[#533afd]">
              <path d="M8 3A5 5 0 103 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
              <path d="M3 5V8H6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* Exam mode banner */}
      {examMode && (
        <div className="rounded-xl bg-gradient-to-r from-[#1c1e54] to-[#2e2b8c] p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-400">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span className="font-medium text-amber-400">시험 직전 모드 활성화</span>
          </div>
          <p className="text-sm text-white/70">중요도가 높은 정보만 표시됩니다.</p>
        </div>
      )}

      {/* Welcome */}
      {user && (
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-[#533afd] to-[#1c1e54]">
          <p className="text-white/60 text-sm">{user.grade}학년 {user.classNum}반 · {user.schoolName}</p>
          <h2 className="text-lg font-light mt-0.5" style={{ letterSpacing: "-0.3px" }}>
            안녕하세요, <strong className="font-medium">{user.nickname}</strong>님!
          </h2>
          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <Link href="/post/new" className="flex-shrink-0 text-sm px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors">+ 정보 공유</Link>
            <Link href="/dday" className="flex-shrink-0 text-sm px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">D-Day 확인</Link>
            <Link href="/timer" className="flex-shrink-0 text-sm px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">공부 시작</Link>
            <Link href="/community" className="flex-shrink-0 text-sm px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">커뮤니티</Link>
          </div>
        </div>
      )}

      {/* 오늘의 핫 게시물 (community preview) */}
      {hotToday.length > 0 && !examMode && (
        <div className="bg-white rounded-xl border border-[#e3e8ee] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-orange-500">
                <path d="M8 1C5 4 3 6.5 3 9a5 5 0 0010 0c0-1.5-.5-3-1.5-4.5C10.5 6 9.5 6.5 8 9c0-2.5-.5-5-1-7h1z" fill="currentColor"/>
              </svg>
              <span className="text-sm font-medium text-[#0d253d]">오늘의 핫</span>
            </div>
            <Link href="/community" className="text-xs text-[#533afd]">더 보기</Link>
          </div>
          <div className="space-y-2.5">
            {hotToday.map((post: any, i: number) => (
              <Link key={post.id} href={`/post/${post.id}`} className="flex items-center gap-2.5 group">
                <span className={cn(
                  "w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                  i === 0 ? "bg-amber-400/20 text-amber-600" : "bg-[#f6f9fc] text-[#64748d]"
                )}>{i + 1}</span>
                <p className="text-sm text-[#273951] truncate group-hover:text-[#533afd] transition-colors flex-1">{post.title}</p>
                <span className="text-xs text-[#533afd] font-medium shrink-0">{post.voteCount}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick subjects */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {["수학", "국어", "영어", "과학", "사회", "역사", "물리", "화학"].map((subj) => (
          <Link key={subj} href={`/board?subject=${encodeURIComponent(subj)}`}
            className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors",
              examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/70" : "bg-white border-[#e3e8ee] text-[#273951] hover:border-[#533afd] hover:text-[#533afd]"
            )}>
            {subj}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORY_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setActiveCategory(f.value)}
              className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                activeCategory === f.value ? "bg-[#533afd] text-white" : examMode ? "bg-[#1c1e54] text-white/60" : "bg-white text-[#273951] border border-[#e3e8ee] hover:border-[#533afd]"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className={cn("text-sm", examMode ? "text-white/50" : "text-[#64748d]")}>
            {isLoading ? "불러오는 중..." : `${posts.length}개 게시물`}
          </span>
          <div className="flex gap-1">
            {(["latest", "popular", "hot"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)}
                className={cn("text-xs px-2.5 py-1 rounded-full transition-colors",
                  sortBy === s ? "bg-[#533afd]/10 text-[#533afd] font-medium" : examMode ? "text-white/40" : "text-[#64748d]"
                )}>
                {s === "latest" ? "최신" : s === "popular" ? "인기" : "핫"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("rounded-xl border p-4 animate-pulse", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
              <div className={cn("h-4 rounded mb-2 w-1/3", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}/>
              <div className={cn("h-5 rounded mb-2 w-2/3", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}/>
              <div className={cn("h-4 rounded w-full", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}/>
            </div>
          ))}
        </div>
      )}

      {/* Pinned */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-2">
          <p className={cn("text-xs font-medium uppercase tracking-wider px-1", examMode ? "text-white/40" : "text-[#64748d]")}>고정된 게시물</p>
          {pinnedPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
        </div>
      )}

      {/* Posts */}
      {!isLoading && (
        <div className="space-y-3">
          {regularPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
          className={cn("w-full py-3 rounded-xl text-sm border transition-colors",
            examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/60" : "bg-white border-[#e3e8ee] text-[#64748d] hover:border-[#533afd]"
          )}>
          {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
        </button>
      )}

      {/* Empty */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#eeeaff] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#533afd]">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth={1.5}/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
          </div>
          <p className={cn("font-medium mb-1", examMode ? "text-white" : "text-[#273951]")}>아직 게시물이 없어요</p>
          <p className={cn("text-sm", examMode ? "text-white/50" : "text-[#64748d]")}>첫 번째로 정보를 공유해보세요!</p>
          <Link href="/post/new" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4]">
            글 작성하기
          </Link>
        </div>
      )}
    </div>
  );
}
