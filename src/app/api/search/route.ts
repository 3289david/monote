import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ posts: [] });

  const where: any = {
    reportCount: { lt: 5 },
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ],
  };
  // Filter by school when logged in
  if (session?.user) where.schoolId = (session.user as any).schoolId;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { nickname: true, level: true } },
    },
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content.slice(0, 200),
      category: p.category,
      subject: p.subject,
      grade: p.grade,
      importance: p.importance,
      voteCount: p.voteCount,
      viewCount: p.viewCount,
      commentCount: p.commentCount,
      bookmarkCount: p.bookmarkCount,
      anonymous: p.anonymous,
      authorNickname: p.anonymous ? "익명" : p.author.nickname,
      authorLevel: p.author.level,
      authorId: p.authorId,
      tags: p.tags,
      files: p.files,
      verified: p.verified,
      isPinned: p.isPinned,
      examDate: p.examDate,
      dueDate: p.dueDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      schoolId: p.schoolId,
    })),
  });
}
