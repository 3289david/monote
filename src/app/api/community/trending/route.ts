import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "week"; // "week" | "today" | "month"

  const now = new Date();
  let since = new Date();
  if (type === "today") since.setHours(0, 0, 0, 0);
  else if (type === "week") since.setDate(now.getDate() - 7);
  else since.setMonth(now.getMonth() - 1);

  const [trending, hotTags, topContributors] = await Promise.all([
    // Trending posts by vote count
    prisma.post.findMany({
      where: {
        schoolId: session.user.schoolId,
        createdAt: { gte: since },
        voteCount: { gt: 0 },
      },
      orderBy: [{ voteCount: "desc" }, { viewCount: "desc" }],
      take: 10,
      include: {
        author: { select: { nickname: true, level: true, avatar: true } },
      },
    }),

    // Hot tags
    prisma.post.findMany({
      where: { schoolId: session.user.schoolId, createdAt: { gte: since } },
      select: { tags: true },
      orderBy: { voteCount: "desc" },
      take: 100,
    }),

    // Top contributors
    prisma.user.findMany({
      where: { schoolId: session.user.schoolId, isBanned: false },
      orderBy: { points: "desc" },
      take: 5,
      select: { id: true, nickname: true, level: true, avatar: true, points: true, streakDays: true },
    }),
  ]);

  // Count tag frequencies
  const tagFreq: Record<string, number> = {};
  for (const p of hotTags) {
    for (const tag of p.tags) {
      tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
    }
  }
  const hotTagList = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  // Format posts
  const userId = session.user.id;
  const votedIds = await prisma.vote.findMany({
    where: { userId, postId: { in: trending.map(p => p.id) } },
    select: { postId: true },
  });
  const votedSet = new Set(votedIds.map(v => v.postId));

  const bookmarkedIds = await prisma.bookmark.findMany({
    where: { userId, postId: { in: trending.map(p => p.id) } },
    select: { postId: true },
  });
  const bookmarkedSet = new Set(bookmarkedIds.map(b => b.postId));

  const posts = trending.map((p: any) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    category: p.category,
    importance: p.importance,
    subject: p.subject,
    grade: p.grade,
    tags: p.tags,
    files: p.files as any[],
    anonymous: p.anonymous,
    authorId: p.authorId,
    authorNickname: p.anonymous ? "익명" : p.author.nickname,
    authorLevel: p.author.level,
    authorImage: p.author.avatar,
    voteCount: p.voteCount,
    viewCount: p.viewCount,
    commentCount: p.commentCount,
    bookmarkCount: p.bookmarkCount,
    isPinned: p.isPinned,
    verified: p.verified,
    examDate: p.examDate,
    dueDate: p.dueDate,
    createdAt: p.createdAt,
    userVoted: votedSet.has(p.id),
    userBookmarked: bookmarkedSet.has(p.id),
  }));

  return NextResponse.json({ posts, hotTags: hotTagList, topContributors });
}
