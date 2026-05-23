"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { cn, timeAgo, calculateLevel, getLevelColor, getLevelName } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

function IconBack() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
      <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  exam_range: "시험범위", performance: "수행평가", materials: "자료",
  teacher_info: "선생님", question: "질문", general: "일반",
};

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  // Redirect to own profile
  if (session?.user?.id === id) {
    router.replace("/profile");
    return null;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}`);
      const json = await res.json();
      if (res.status === 403) return { blocked: true, nickname: json.nickname, reason: json.error };
      if (!res.ok) throw new Error("사용자를 찾을 수 없어요");
      return json;
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-12 border-b border-gray-100" />
      <div className="h-48 bg-gray-100" />
      <div className="px-4 py-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  );

  // Privacy blocked
  if (data?.blocked) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 h-12">
          <button onClick={() => router.back()} className="text-gray-500 p-1 -ml-1">
            <IconBack />
          </button>
          <span className="text-sm font-medium text-gray-700 ml-2">{data.nickname}</span>
        </header>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 text-gray-300">
              <circle cx="20" cy="14" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 38v-2a14 14 0 0128 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M28 22l8 8M36 22l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-gray-800 font-medium">{data.nickname}</p>
          <p className="text-gray-400 text-sm text-center px-8">{data.reason}</p>
        </div>
      </div>
    );
  }

  const user = data?.user;
  const recentPosts = data?.recentPosts ?? [];

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">사용자를 찾을 수 없어요</p>
    </div>
  );

  const level = calculateLevel(user.points ?? 0);

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 h-12">
        <button onClick={() => router.back()} className="text-gray-500 p-1 -ml-1">
          <IconBack />
        </button>
        <span className="text-sm font-medium text-gray-700 ml-2">{user.nickname}</span>
      </header>

      {/* Gradient hero */}
      <div className="relative overflow-hidden" style={{ minHeight: "160px" }}>
        <div className="absolute inset-0" style={{
          background: "linear-gradient(140deg, #f5e9d4 0%, #f96bee 32%, #b9b9f9 54%, #533afd 74%, #1c1e54 100%)"
        }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="350" cy="30" rx="130" ry="90" fill="white" fillOpacity="0.06"/>
          <circle cx="380" cy="150" r="55" fill="#ea2261" fillOpacity="0.18"/>
        </svg>
        <div className="relative z-10 px-5 py-6">
          <div className="flex items-center gap-4">
            <Avatar nickname={user.nickname} level={level} size="xl" imageUrl={user.avatar ?? undefined} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white text-xl font-light" style={{ letterSpacing: "-0.4px" }}>{user.nickname}</h2>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white")}>
                  {getLevelName(level)}
                </span>
              </div>
              <p className="text-white/60 text-sm">{user.schoolName} · {user.grade}학년 {user.classNum}반</p>
              {user.bio && <p className="text-white/80 text-sm mt-1">{user.bio}</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "게시물", value: user._count?.posts ?? 0 },
              { label: "레벨", value: `Lv.${level}` },
              { label: "포인트", value: `${(user.points ?? 0).toLocaleString()}P` },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/10 rounded-xl py-2.5">
                <p className="text-white font-medium text-sm">{stat.value}</p>
                <p className="text-white/50 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      {(user.badges?.length ?? 0) > 0 && (
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">뱃지</p>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((badge: string) => (
              <span key={badge} className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-xs font-medium">
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div className="px-4 py-4">
          <p className="text-sm font-medium text-gray-700 mb-3">최근 게시물</p>
          <div className="space-y-2">
            {recentPosts.map((post: any) => (
              <Link key={post.id} href={`/post/${post.id}`}
                className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#eeeaff] text-[#533afd] flex-shrink-0 mt-0.5">
                  {CATEGORY_LABELS[post.category] ?? post.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                        <path d="M5 8V2M5 2L2 5M5 2l3 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {post.voteCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                        <path d="M1 2h8a1 1 0 011 1v5a1 1 0 01-1 1H4L1 11V3a1 1 0 010-1z" stroke="currentColor" strokeWidth={1}/>
                      </svg>
                      {post.commentCount}
                    </span>
                    <span>{timeAgo(new Date(post.createdAt))}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">공개된 게시물이 없어요</p>
        </div>
      )}
    </div>
  );
}
