import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { nickname: true, level: true, avatar: true } },
      _count: { select: { votes: true, comments: true } },
    },
  });

  const totalVotes = posts.reduce((sum: number, p) => sum + p.voteCount, 0);

  const formatted = posts.map((p: any) => ({
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
    authorNickname: p.author.nickname,
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
    userVoted: false,
    userBookmarked: false,
  }));

  return NextResponse.json({ posts: formatted, totalCount: posts.length, totalVotes });
}
