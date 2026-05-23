import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") ?? "posts"; // "posts" | "users"
  if (!q || q.length < 2) return NextResponse.json({ posts: [], users: [] });

  const viewerSchoolId = (session?.user as any)?.schoolId;

  if (type === "users") {
    // Search users respecting privacy
    const users = await prisma.user.findMany({
      where: {
        nickname: { contains: q, mode: "insensitive" },
        // Only show public profiles, or school_only profiles for same-school viewers
        OR: [
          { profileVisibility: "public" },
          ...(viewerSchoolId ? [{
            profileVisibility: "school_only",
            schoolId: viewerSchoolId,
          }] : []),
        ],
      },
      select: {
        id: true, nickname: true, avatar: true, grade: true,
        points: true, level: true, schoolId: true,
        school: { select: { name: true } },
      },
      take: 20,
    });

    return NextResponse.json({
      users: users.map((u) => ({ ...u, schoolName: u.school.name })),
      posts: [],
    });
  }

  const where: any = {
    reportCount: { lt: 5 },
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ],
  };

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
    users: [],
  });
}
