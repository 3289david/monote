"use client";
import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/posts/PostCard";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { PostCategory } from "@/types";

const CATEGORIES: { value: PostCategory | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "exam_range", label: "시험범위" },
  { value: "performance", label: "수행평가" },
  { value: "materials", label: "자료" },
  { value: "teacher_info", label: "선생님" },
  { value: "question", label: "질문" },
];

export default function FeedPage() {
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const toggleExamMode = useUIStore((s) => s.toggleExamMode);
  const selectedGrade = useUIStore((s) => s.selectedGrade);
  const [activeCategory, setActiveCategory] = useState<PostCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "hot">("latest");

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const [pullIndicator, setPullIndicator] = useState(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = usePosts({
    grade: selectedGrade || undefined,
    category: activeCategory === "all" ? undefined : activeCategory,
    sortBy,
    examMode,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const pinnedPosts = posts.filter((p: any) => p.isPinned);
  const regularPosts = posts.filter((p: any) => !p.isPinned);
  const user = session?.user;

  const handleTouchStart = useCallback((e: React.TouchEvent) => { startY.current = e.touches[0].clientY; }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if ((e.currentTarget as HTMLElement).scrollTop > 0) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) { pullDistance.current = dy; setPullIndicator(Math.min(dy / 80, 1)); }
  }, []);
  const handleTouchEnd = useCallback(async () => {
    if (pullDistance.current > 80 && !isRefreshing) {
      setIsRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(20);
      await refetch();
      setIsRefreshing(false);
    }
    pullDistance.current = 0; setPullIndicator(0);
  }, [isRefreshing, refetch]);

  return (
    <div className="space-y-2" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull-to-refresh */}
      {(pullIndicator > 0 || isRefreshing) && (
        <div className="flex justify-center py-1">
          <div className={cn("w-6 h-6 rounded-full border-2 border-[#533afd] border-t-transparent", isRefreshing && "animate-spin")}
            style={{ opacity: pullIndicator || (isRefreshing ? 1 : 0) }} />
        </div>
      )}

      {/* Exam mode bar */}
      {examMode && (
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-950 text-white rounded-lg text-sm">
          <span>⭐ 시험 직전 모드 — 중요도 높은 글만 표시</span>
          <button onClick={toggleExamMode} className="text-white/60 hover:text-white text-xs">끄기</button>
        </div>
      )}

      {/* Guest banner */}
      {!user && (
        <div className="flex items-center justify-between px-3 py-2 bg-[#eeeaff] rounded-lg text-sm">
          <span className="text-[#4434d4]">로그인하면 내 학교 게시물만 볼 수 있어요</span>
          <div className="flex gap-1.5">
            <Link href="/login" className="text-xs px-2.5 py-1 bg-[#533afd] text-white rounded-full">로그인</Link>
            <Link href="/register" className="text-xs px-2.5 py-1 bg-white text-[#533afd] rounded-full border border-[#b9b9f9]">가입</Link>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {CATEGORIES.map((f) => (
            <button key={f.value} onClick={() => setActiveCategory(f.value)}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                activeCategory === f.value
                  ? "bg-[#533afd] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#533afd]"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {isLoading ? "불러오는 중..." : `${posts.length}개`}
          </span>
          <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-full">
            {(["latest", "popular", "hot"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)}
                className={cn("text-xs px-2.5 py-1 rounded-full transition-colors",
                  sortBy === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                )}>
                {s === "latest" ? "최신" : s === "popular" ? "인기" : "핫"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg px-4 py-3 animate-pulse">
              <div className="h-2.5 bg-gray-100 rounded w-1/4 mb-2"/>
              <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-1.5"/>
              <div className="h-2.5 bg-gray-100 rounded w-full"/>
            </div>
          ))}
        </div>
      )}

      {/* Pinned */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider px-1">📌 고정</p>
          {pinnedPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
        </div>
      )}

      {/* Posts */}
      {!isLoading && (
        <div className="space-y-2">
          {regularPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
          className="w-full py-2.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:border-[#533afd] hover:text-[#533afd] transition-colors">
          {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
        </button>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm mb-3">아직 게시물이 없어요</p>
          {user ? (
            <Link href="/post/new" className="inline-flex items-center gap-1 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm">
              + 첫 글 작성하기
            </Link>
          ) : (
            <Link href="/register" className="inline-flex items-center gap-1 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm">
              무료 가입하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
