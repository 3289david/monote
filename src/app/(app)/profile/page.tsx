"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { cn, getLevelColor, getLevelName, calculateLevel, getNextLevelPoints } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import PostCard from "@/components/posts/PostCard";
import toast from "react-hot-toast";
import GradientHero from "@/components/ui/GradientHero";

const BADGE_DETAILS: Record<string, { name: string; desc: string; color: string }> = {
  exam_master: { name: "범위 마스터", desc: "시험 범위 정보 10개 이상 공유", color: "bg-violet-100 text-violet-700 border-violet-200" },
  performance_helper: { name: "수행 도우미", desc: "수행평가 정보 5개 이상 공유", color: "bg-rose-100 text-rose-700 border-rose-200" },
  giver: { name: "족보왕", desc: "자료 공유 20개 이상", color: "bg-amber-100 text-amber-700 border-amber-200" },
  popular: { name: "인기쟁이", desc: "추천 100개 이상 받기", color: "bg-blue-100 text-blue-700 border-blue-200" },
  early_bird: { name: "부지런한 새", desc: "오전 7시 전 첫 게시물", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  streak: { name: "연속 활동", desc: "7일 연속 활동", color: "bg-orange-100 text-orange-700 border-orange-200" },
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"posts" | "bookmarks" | "settings">("posts");
  const [editNickname, setEditNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(session?.user?.nickname ?? "");
  const [editBio, setEditBio] = useState(false);
  const [newBio, setNewBio] = useState((session?.user as any)?.bio ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const user = session?.user;

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => fetch("/api/users/me/posts").then((r) => r.json()),
    enabled: activeTab === "posts",
  });

  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ["my-bookmarks"],
    queryFn: () => fetch("/api/users/me/bookmarks").then((r) => r.json()),
    enabled: activeTab === "bookmarks",
  });

  const patchMe = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const updateNickname = useMutation({
    mutationFn: (nickname: string) => patchMe({ nickname }),
    onSuccess: async (data) => {
      if (data.error) { toast.error(data.error); return; }
      await update({ nickname: data.user.nickname });
      setEditNickname(false);
      toast.success("닉네임이 변경되었어요!");
    },
    onError: () => toast.error("변경에 실패했어요"),
  });

  const updateBio = useMutation({
    mutationFn: (bio: string) => patchMe({ bio }),
    onSuccess: async (data) => {
      if (data.error) { toast.error(data.error); return; }
      await update();
      setEditBio(false);
      toast.success("소개가 변경되었어요!");
    },
    onError: () => toast.error("변경에 실패했어요"),
  });

  const updatePrivacy = useMutation({
    mutationFn: (profileVisibility: string) => patchMe({ profileVisibility }),
    onSuccess: async (data) => {
      if (data.error) { toast.error(data.error); return; }
      await update();
      toast.success("공개 설정이 변경되었어요!");
    },
    onError: () => toast.error("변경에 실패했어요"),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 업로드할 수 있어요"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB 이하 이미지만 가능해요"); return; }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      await patchMe({ avatar: data.url });
      await update({ image: data.url });
      toast.success("프로필 사진이 변경되었어요!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updatePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      fetch("/api/users/me/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      setCurrentPw(""); setNewPw(""); setConfirmNewPw("");
      toast.success("비밀번호가 변경되었어요!");
    },
    onError: () => toast.error("변경에 실패했어요"),
  });

  if (!user) return null;

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";
  const cardBg = examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]";

  const level = calculateLevel(user.points ?? 0);
  const nextLevelPts = getNextLevelPoints(level);
  const progress = Math.min(((user.points ?? 0) / nextLevelPts) * 100, 100);

  const myPosts = postsData?.posts ?? [];
  const myBookmarks = bookmarksData?.posts ?? [];

  return (
    <div className="space-y-4">
      {/* Profile hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f5e9d4 0%, #f96bee 28%, #b9b9f9 52%, #533afd 76%, #1c1e54 100%)" }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="360" cy="30" rx="100" ry="70" fill="white" fillOpacity="0.07"/>
          <circle cx="380" cy="150" r="50" fill="#ea2261" fillOpacity="0.15"/>
          <circle cx="10" cy="10" r="35" fill="#f96bee" fillOpacity="0.1"/>
        </svg>
        <div className="relative z-10">
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group">
            <Avatar nickname={user.nickname} level={user.level ?? 1} size="xl" imageUrl={user.image ?? undefined} />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="14"/>
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-white">
                  <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 17h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
          </label>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-white text-xl font-medium">{user.nickname}</h2>
              <span className={cn("text-xs font-medium", getLevelColor(user.level ?? 1))}>{getLevelName(user.level ?? 1)}</span>
            </div>
            <p className="text-white/60 text-sm">{user.schoolName} · {user.grade}학년 {user.classNum}반</p>
            <p className="text-white/80 text-sm mt-0.5">{(user.points ?? 0).toLocaleString()}P</p>
          </div>
        </div>

        {/* Level progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-white/60">Lv.{level} → Lv.{level + 1}</span>
            <span className="text-white/60">{user.points ?? 0} / {nextLevelPts}P</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "게시물", value: postsData?.totalCount ?? "-" },
            { label: "추천받음", value: postsData?.totalVotes ?? "-" },
            { label: "연속 공부", value: `${user.streakDays ?? 0}일` },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-white/10 rounded-xl py-2.5">
              <p className="text-white font-medium">{stat.value}</p>
              <p className="text-white/50 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
        </div>{/* end z-10 */}
      </div>

      {/* Badges */}
      {(user.badges?.length ?? 0) > 0 && (
        <div className={cn("rounded-xl border p-4", cardBg)}>
          <p className={cn("text-sm font-medium mb-3", textColor)}>획득한 뱃지</p>
          <div className="flex flex-wrap gap-2">
            {(user.badges ?? []).map((badge: string) => {
              const info = BADGE_DETAILS[badge];
              if (!info) return null;
              return (
                <div key={badge} title={info.desc}
                  className={cn("px-3 py-1.5 rounded-full border text-xs font-medium", info.color)}>
                  {info.name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={cn("flex rounded-xl p-1 gap-1", examMode ? "bg-[#1c1e54]" : "bg-[#f6f9fc]")}>
        {(["posts", "bookmarks", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === t ? "bg-[#533afd] text-white" : examMode ? "text-white/50 hover:text-white" : "text-[#64748d] hover:text-[#273951]")}>
            {t === "posts" ? "내 글" : t === "bookmarks" ? "저장됨" : "설정"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "posts" && (
        <div className="space-y-3">
          {postsLoading && [1, 2].map((i) => <div key={i} className={cn("rounded-xl border h-24 animate-pulse", cardBg)} />)}
          {!postsLoading && myPosts.length === 0 && (
            <div className="text-center py-8">
              <p className={cn("text-sm", mutedText)}>아직 작성한 글이 없어요</p>
            </div>
          )}
          {myPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} compact />)}
        </div>
      )}

      {activeTab === "bookmarks" && (
        <div className="space-y-3">
          {bookmarksLoading && [1, 2].map((i) => <div key={i} className={cn("rounded-xl border h-24 animate-pulse", cardBg)} />)}
          {!bookmarksLoading && myBookmarks.length === 0 && (
            <div className="text-center py-8">
              <p className={cn("text-sm", mutedText)}>저장된 글이 없어요</p>
            </div>
          )}
          {myBookmarks.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} compact />)}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* Bio */}
          <div className={cn("rounded-xl border p-4", cardBg)}>
            <p className={cn("text-sm font-medium mb-3", textColor)}>자기소개</p>
            {editBio ? (
              <div className="space-y-2">
                <textarea value={newBio} onChange={(e) => setNewBio(e.target.value)} maxLength={150} rows={3}
                  placeholder="나를 소개해보세요 (최대 150자)"
                  className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd] resize-none",
                    examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")} />
                <div className="flex gap-2">
                  <button onClick={() => updateBio.mutate(newBio)} disabled={updateBio.isPending}
                    className="px-3 py-2 bg-[#533afd] text-white rounded-xl text-sm disabled:opacity-50">저장</button>
                  <button onClick={() => setEditBio(false)} className={cn("px-3 py-2 rounded-xl text-sm", examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d]")}>취소</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <span className={cn("text-sm flex-1", (user as any).bio ? textColor : mutedText)}>
                  {(user as any).bio || "소개가 없어요"}
                </span>
                <button onClick={() => { setNewBio((user as any).bio ?? ""); setEditBio(true); }}
                  className="text-sm text-[#533afd] hover:underline flex-shrink-0">변경</button>
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className={cn("rounded-xl border p-4", cardBg)}>
            <p className={cn("text-sm font-medium mb-3", textColor)}>프로필 공개 설정</p>
            <div className="space-y-2">
              {[
                { value: "public", label: "전체 공개", desc: "누구나 내 프로필을 볼 수 있어요" },
                { value: "school_only", label: "학교 내 공개", desc: "같은 학교 학생만 볼 수 있어요" },
                { value: "private", label: "완전 비공개", desc: "아무도 내 프로필을 볼 수 없어요" },
              ].map((opt) => (
                <button key={opt.value}
                  onClick={() => updatePrivacy.mutate(opt.value)}
                  disabled={updatePrivacy.isPending}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                    (user as any).profileVisibility === opt.value
                      ? "bg-[#eeeaff] border-[#533afd]/30"
                      : examMode ? "border-[#2a2d6b] hover:border-[#363996]" : "border-[#e3e8ee] hover:border-[#b9b9f9]"
                  )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    (user as any).profileVisibility === opt.value ? "border-[#533afd]" : "border-[#a8c3de]"
                  )}>
                    {(user as any).profileVisibility === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-[#533afd]" />
                    )}
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", textColor)}>{opt.label}</p>
                    <p className={cn("text-xs", mutedText)}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className={cn("text-xs mt-3", mutedText)}>
              * 비공개 설정과 관계없이 게시물의 이름은 항상 표시돼요
            </p>
          </div>

          {/* Nickname */}
          <div className={cn("rounded-xl border p-4", cardBg)}>
            <p className={cn("text-sm font-medium mb-3", textColor)}>닉네임 변경</p>
            {editNickname ? (
              <div className="flex gap-2">
                <input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} maxLength={15}
                  className={cn("flex-1 rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                    examMode ? "bg-[#2a2d6b] border-[#363996] text-white" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]")} />
                <button onClick={() => updateNickname.mutate(newNickname)} disabled={updateNickname.isPending}
                  className="px-3 py-2 bg-[#533afd] text-white rounded-xl text-sm disabled:opacity-50">저장</button>
                <button onClick={() => setEditNickname(false)} className={cn("px-3 py-2 rounded-xl text-sm", examMode ? "bg-[#2a2d6b] text-white/60" : "bg-[#f6f9fc] text-[#64748d]")}>취소</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={cn("text-sm", textColor)}>{user.nickname}</span>
                <button onClick={() => { setNewNickname(user.nickname); setEditNickname(true); }}
                  className="text-sm text-[#533afd] hover:underline">변경</button>
              </div>
            )}
          </div>

          {/* Password */}
          <div className={cn("rounded-xl border p-4 space-y-3", cardBg)}>
            <p className={cn("text-sm font-medium", textColor)}>비밀번호 변경</p>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="현재 비밀번호"
              className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")} />
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="새 비밀번호 (영문+숫자 8자 이상)"
              className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")} />
            <input type="password" value={confirmNewPw} onChange={(e) => setConfirmNewPw(e.target.value)} placeholder="새 비밀번호 확인"
              className={cn("w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-[#533afd]",
                examMode ? "bg-[#2a2d6b] border-[#363996] text-white placeholder:text-white/30" : "bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")} />
            <button
              onClick={() => {
                if (newPw !== confirmNewPw) { toast.error("새 비밀번호가 일치하지 않아요"); return; }
                if (newPw.length < 8) { toast.error("비밀번호는 8자 이상이어야 해요"); return; }
                updatePassword.mutate({ currentPassword: currentPw, newPassword: newPw });
              }}
              disabled={updatePassword.isPending || !currentPw || !newPw}
              className="w-full py-2.5 rounded-xl bg-[#533afd] text-white text-sm hover:bg-[#4434d4] transition-colors disabled:opacity-50">
              {updatePassword.isPending ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>

          {/* School info */}
          <div className={cn("rounded-xl border p-4", cardBg)}>
            <p className={cn("text-sm font-medium mb-2", textColor)}>학교 정보</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className={cn("text-sm", mutedText)}>학교</span>
                <span className={cn("text-sm", textColor)}>{user.schoolName}</span>
              </div>
              <div className="flex justify-between">
                <span className={cn("text-sm", mutedText)}>학년/반</span>
                <span className={cn("text-sm", textColor)}>{user.grade}학년 {user.classNum}반</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-3 rounded-xl border border-rose-200 text-rose-600 text-sm hover:bg-rose-50 transition-colors">
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
