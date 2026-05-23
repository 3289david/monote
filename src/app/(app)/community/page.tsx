"use client";
import { useState } from "react";
import Link from "next/link";
import { cn, timeAgo, getCategoryLabel, getCategoryColor } from "@/lib/utils";
import { useTrending, usePolls, useCreatePoll, useVotePoll } from "@/hooks/useCommunity";
import { useSession } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import GradientHero from "@/components/ui/GradientHero";
import toast from "react-hot-toast";

type TrendingPeriod = "today" | "week" | "month";
type CommunityTab = "trending" | "polls" | "anon";

function PollCard({ poll, isLoggedIn }: { poll: any; isLoggedIn: boolean }) {
  const voteMutation = useVotePoll(poll.id);
  const voted = !!poll.myVoteOptionId;
  const expired = poll.expired;
  const canVote = isLoggedIn && !voted && !expired;

  const handleVote = (optionId: string) => {
    if (!isLoggedIn) { toast.error("투표하려면 로그인이 필요해요"); return; }
    if (!canVote) return;
    voteMutation.mutate(optionId);
    if (navigator.vibrate) navigator.vibrate(40);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e3e8ee] p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="font-medium text-[#0d253d] text-sm leading-snug flex-1 pr-2">{poll.question}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {expired && (
            <span className="text-[10px] bg-[#f6f9fc] text-[#64748d] px-2 py-0.5 rounded-full">종료</span>
          )}
          {!expired && poll.endsAt && (
            <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
              {Math.ceil((new Date(poll.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}일 남음
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {poll.options.map((option: any) => {
          const isMyVote = poll.myVoteOptionId === option.id;
          const showResults = voted || expired;
          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={!canVote || voteMutation.isPending}
              className={cn(
                "relative w-full text-left rounded-xl overflow-hidden transition-all",
                canVote ? "hover:border-[#533afd] active:scale-[0.99]" : "cursor-default",
                isMyVote ? "border-[#533afd]" : "border-[#e3e8ee]",
                "border"
              )}
            >
              {/* Progress bar */}
              {showResults && (
                <div
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-out",
                    isMyVote ? "bg-[#533afd]/15" : "bg-[#f6f9fc]"
                  )}
                  style={{ width: `${option.percentage}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2.5">
                <span className={cn("text-sm", isMyVote ? "text-[#533afd] font-medium" : "text-[#273951]")}>
                  {isMyVote && (
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 inline-block mr-1.5">
                      <circle cx="8" cy="8" r="7" fill="#533afd"/>
                      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {option.text}
                </span>
                {showResults && (
                  <span className={cn("text-xs font-medium ml-2", isMyVote ? "text-[#533afd]" : "text-[#64748d]")}>
                    {option.percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-xs text-[#64748d]">
        <span>{poll.totalVotes}명 참여</span>
        <span>·</span>
        <span>{poll.authorNickname}</span>
        <span>·</span>
        <span>{timeAgo(new Date(poll.createdAt))}</span>
      </div>
    </div>
  );
}

function CreatePollForm({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const createPoll = useCreatePoll();

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!question.trim()) { toast.error("질문을 입력해주세요"); return; }
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) { toast.error("선택지를 2개 이상 입력해주세요"); return; }

    await createPoll.mutateAsync({
      question: question.trim(),
      options: validOptions,
      isAnonymous,
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
    });
    onClose();
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e3e8ee] p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-[#0d253d]">새 투표 만들기</h3>
        <button onClick={onClose} className="p-1 rounded-full text-[#64748d] hover:bg-[#f6f9fc]">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="어떤 것이 궁금한가요?"
        maxLength={200}
        rows={2}
        className="w-full border border-[#e3e8ee] rounded-xl px-3 py-2.5 text-sm text-[#0d253d] placeholder-[#b0b7c3] resize-none focus:outline-none focus:border-[#533afd] mb-3"
      />

      <p className="text-xs text-[#64748d] mb-2">선택지 ({options.length}/6)</p>
      <div className="space-y-2 mb-3">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              placeholder={`선택지 ${i + 1}`}
              maxLength={100}
              className="flex-1 border border-[#e3e8ee] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#533afd]"
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)} className="p-1.5 rounded-full text-[#64748d] hover:text-rose-500 hover:bg-rose-50">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button onClick={addOption} className="flex items-center gap-1.5 text-xs text-[#533afd] px-3 py-2 rounded-xl border border-dashed border-[#b9b9f9] hover:bg-[#eeeaff] transition-colors">
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
            선택지 추가
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-3 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={cn(
              "w-10 h-5.5 rounded-full relative transition-colors cursor-pointer",
              isAnonymous ? "bg-[#533afd]" : "bg-[#e3e8ee]"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform",
              isAnonymous ? "translate-x-5" : "translate-x-0.5"
            )} />
          </div>
          <span className="text-[#273951]">익명</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[#64748d]">마감:</span>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={e => setEndsAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="text-xs border border-[#e3e8ee] rounded-lg px-2 py-1 text-[#273951] focus:outline-none focus:border-[#533afd]"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={createPoll.isPending}
        className="w-full py-2.5 rounded-full bg-[#533afd] text-white text-sm font-medium hover:bg-[#4434d4] transition-colors disabled:opacity-50"
      >
        {createPoll.isPending ? "등록 중..." : "투표 등록하기"}
      </button>
    </div>
  );
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<CommunityTab>("trending");
  const [period, setPeriod] = useState<TrendingPeriod>("week");
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const trendingQuery = useTrending(period);
  const pollsQuery = usePolls();

  const trending = trendingQuery.data;
  const polls = pollsQuery.data?.polls ?? [];

  // Filter anonymous posts from regular board
  const anonPosts = trending?.posts?.filter((p: any) => p.anonymous) ?? [];

  const TABS = [
    { key: "trending", label: "트렌딩" },
    { key: "polls", label: "투표" },
    { key: "anon", label: "익명 게시판" },
  ] as const;

  const PERIODS = [
    { key: "today", label: "오늘" },
    { key: "week", label: "이번 주" },
    { key: "month", label: "이번 달" },
  ] as const;

  return (
    <div className="pb-4">
      {/* Gradient Hero */}
      <GradientHero
        title="커뮤니티"
        subtitle="트렌딩 게시물, 투표, 익명 게시판"
        illustration={
          <svg viewBox="0 0 56 56" fill="none" style={{ width: "56px", height: "56px" }}>
            <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.6"/>
            <circle cx="38" cy="30" r="9" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
            <path d="M28 14v8M24 18h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
            <path d="M32 26v6M29 29h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7"/>
          </svg>
        }
      />

      {/* Login prompt banner */}
      {!session && (
        <div className="bg-[#eeeaff] border border-[#b9b9f9] rounded-2xl p-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-[#533afd] shrink-0">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth={1.5}/>
              <path d="M10 6v5M10 13v1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
            <p className="text-xs text-[#4434d4]">로그인하면 투표·게시물 작성이 가능해요</p>
          </div>
          <Link href="/login" className="text-xs font-medium text-white bg-[#533afd] px-3 py-1.5 rounded-full shrink-0 hover:bg-[#4434d4] transition-colors">로그인</Link>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex bg-[#f6f9fc] rounded-2xl p-1 mb-4 gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
              tab === t.key ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Trending tab */}
      {tab === "trending" && (
        <div>
          {/* Period selector */}
          <div className="flex gap-2 mb-4">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  period === p.key ? "bg-[#533afd] text-white" : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#eeeaff]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Hot tags */}
          {trending?.hotTags && trending.hotTags.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[#64748d] mb-2">인기 태그</p>
              <div className="flex flex-wrap gap-2">
                {trending.hotTags.slice(0, 10).map(({ tag, count }: { tag: string; count: number }) => (
                  <Link
                    key={tag}
                    href={`/board?tag=${encodeURIComponent(tag)}`}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b9b9f9]/20 text-[#4434d4] text-xs hover:bg-[#eeeaff] transition-colors"
                  >
                    <span>#{tag}</span>
                    <span className="bg-[#533afd]/20 text-[#533afd] rounded-full px-1.5 text-[10px] font-medium">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top contributors */}
          {trending?.topContributors && trending.topContributors.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e3e8ee] p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-amber-500">
                  <path d="M10 2l2 6.2H18l-5 3.7 1.9 5.9L10 13.9l-4.9 3.9 1.9-5.9-5-3.7h6z" stroke="currentColor" strokeWidth={1.5} fill="currentColor"/>
                </svg>
                <h3 className="text-sm font-medium text-[#0d253d]">이번 주 기여자</h3>
              </div>
              <div className="space-y-2">
                {trending.topContributors.map((user: any, i: number) => (
                  <div key={user.id} className="flex items-center gap-2.5">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-white" : i === 2 ? "bg-amber-700/60 text-white" : "bg-[#f6f9fc] text-[#64748d]"
                    )}>{i + 1}</span>
                    <Avatar nickname={user.nickname} level={user.level} size="xs" imageUrl={user.avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#273951] truncate">{user.nickname}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-[#533afd]">{user.points.toLocaleString()}P</p>
                      {user.streakDays > 0 && (
                        <p className="text-[10px] text-orange-500">{user.streakDays}일 연속</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending posts */}
          {trendingQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e3e8ee] p-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 bg-[#f6f9fc] rounded-full w-16"/>
                    <div className="h-3 bg-[#f6f9fc] rounded-full w-12"/>
                  </div>
                  <div className="h-4 bg-[#f6f9fc] rounded-full w-3/4 mb-2"/>
                  <div className="h-3 bg-[#f6f9fc] rounded-full w-full"/>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(trending?.posts ?? []).map((post: any, i: number) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <article className="bg-white rounded-2xl border border-[#e3e8ee] hover:border-[#b9b9f9] hover:shadow-md transition-all p-4 group">
                    <div className="flex items-start gap-3">
                      {/* Rank badge */}
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
                        i === 0 ? "bg-amber-400/20 text-amber-600" :
                        i === 1 ? "bg-slate-200 text-slate-500" :
                        i === 2 ? "bg-orange-100 text-orange-500" :
                        "bg-[#f6f9fc] text-[#64748d]"
                      )}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", getCategoryColor(post.category))}>
                            {getCategoryLabel(post.category)}
                          </span>
                          <span className="text-[10px] text-[#64748d]">{post.subject}</span>
                        </div>
                        <h3 className="text-sm font-normal text-[#0d253d] leading-snug mb-1.5 group-hover:text-[#533afd] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-[#64748d]">
                          <span className="flex items-center gap-1">
                            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><path d="M8 2l1.5 4.5H14l-3.8 2.8 1.5 4.5L8 11.1l-3.7 2.7 1.5-4.5L2 6.5h4.5L8 2z" fill="currentColor" stroke="currentColor" strokeWidth={0.5}/></svg>
                            <span className="font-medium text-[#533afd]">{post.voteCount}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><path d="M14 10a2 2 0 01-2 2H6l-3 3V5a2 2 0 012-2h7a2 2 0 012 2v5z" stroke="currentColor" strokeWidth={1.2}/></svg>
                            {post.commentCount}
                          </span>
                          <span>{timeAgo(new Date(post.createdAt))}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
              {(!trending?.posts || trending.posts.length === 0) && (
                <div className="text-center py-12">
                  <p className="text-[#64748d] text-sm">아직 인기 게시물이 없어요</p>
                  <Link href="/post/new" className="text-[#533afd] text-sm mt-1 inline-block">첫 번째 게시물 작성하기</Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Polls tab */}
      {tab === "polls" && (
        <div>
          {/* Create poll button */}
          {!session ? (
            <Link href="/login" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#b9b9f9] text-[#533afd] text-sm hover:bg-[#eeeaff] transition-colors mb-4">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
              투표 만들려면 로그인하세요
            </Link>
          ) : !showCreatePoll ? (
            <button
              onClick={() => setShowCreatePoll(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#b9b9f9] text-[#533afd] text-sm hover:bg-[#eeeaff] transition-colors mb-4"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
              투표 만들기
            </button>
          ) : (
            <CreatePollForm onClose={() => setShowCreatePoll(false)} />
          )}

          {/* Poll list */}
          {pollsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e3e8ee] p-4 animate-pulse">
                  <div className="h-4 bg-[#f6f9fc] rounded-full w-3/4 mb-4"/>
                  <div className="space-y-2">
                    <div className="h-10 bg-[#f6f9fc] rounded-xl"/>
                    <div className="h-10 bg-[#f6f9fc] rounded-xl"/>
                  </div>
                </div>
              ))}
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12">
              <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mx-auto mb-3 text-[#b0b7c3]">
                <rect x="8" y="16" width="6" height="24" rx="2" stroke="currentColor" strokeWidth={2}/>
                <rect x="21" y="8" width="6" height="32" rx="2" stroke="currentColor" strokeWidth={2}/>
                <rect x="34" y="20" width="6" height="20" rx="2" stroke="currentColor" strokeWidth={2}/>
              </svg>
              <p className="text-[#64748d] text-sm">아직 투표가 없어요</p>
              <p className="text-[#b0b7c3] text-xs mt-1">첫 번째 투표를 만들어보세요!</p>
            </div>
          ) : (
            <div>
              {polls.map((poll: any) => <PollCard key={poll.id} poll={poll} isLoggedIn={!!session} />)}
            </div>
          )}
        </div>
      )}

      {/* Anonymous board tab */}
      {tab === "anon" && (
        <div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-4 flex items-start gap-2.5">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth={1.5}/>
              <path d="M10 6v5M10 13v1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-xs font-medium text-amber-700">익명 게시판</p>
              <p className="text-xs text-amber-600/80 mt-0.5">익명으로 작성된 글만 표시돼요. 신중하게 작성해주세요.</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#64748d]">{anonPosts.length}개의 익명 게시물</p>
            {session ? (
              <Link href="/post/new" className="flex items-center gap-1 text-xs text-[#533afd] bg-[#eeeaff] px-3 py-1.5 rounded-full hover:bg-[#b9b9f9]/30 transition-colors">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
                익명 글쓰기
              </Link>
            ) : (
              <Link href="/login" className="flex items-center gap-1 text-xs text-[#533afd] bg-[#eeeaff] px-3 py-1.5 rounded-full hover:bg-[#b9b9f9]/30 transition-colors">
                로그인 후 작성
              </Link>
            )}
          </div>

          {anonPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#64748d] text-sm">아직 익명 게시물이 없어요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anonPosts.map((post: any) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <article className="bg-white rounded-2xl border border-[#e3e8ee] hover:border-[#b9b9f9] hover:shadow-md transition-all p-4 group">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="text-[10px] bg-[#f6f9fc] text-[#64748d] px-2 py-0.5 rounded-full">익명</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", getCategoryColor(post.category))}>
                        {getCategoryLabel(post.category)}
                      </span>
                      <span className="text-[10px] text-[#64748d] ml-auto">{timeAgo(new Date(post.createdAt))}</span>
                    </div>
                    <h3 className="text-sm text-[#0d253d] leading-snug mb-1.5 group-hover:text-[#533afd] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-[#64748d] line-clamp-1">{post.content}</p>
                    <div className="flex items-center gap-3 text-xs text-[#64748d] mt-2.5">
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><path d="M8 2l1.5 4.5H14l-3.8 2.8 1.5 4.5L8 11.1l-3.7 2.7 1.5-4.5L2 6.5h4.5L8 2z" fill="currentColor" stroke="currentColor" strokeWidth={0.5}/></svg>
                        {post.voteCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><path d="M14 10a2 2 0 01-2 2H6l-3 3V5a2 2 0 012-2h7a2 2 0 012 2v5z" stroke="currentColor" strokeWidth={1.2}/></svg>
                        {post.commentCount}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
