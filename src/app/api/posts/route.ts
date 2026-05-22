import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { calculateLevel } from "@/lib/utils";

const createSchema = z.object({
  grade: z.number().int().min(1).max(3),
  subject: z.string().min(1),
  category: z.enum(["exam_range", "performance", "materials", "teacher_info", "question", "general"]),
  importance: z.enum(["critical", "high", "medium", "low"]),
  title: z.string().min(2).max(200),
  content: z.string().min(5).max(10000),
  anonymous: z.boolean().default(false),
  tags: z.array(z.string().max(20)).max(10).default([]),
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(["image", "pdf", "document"]),
    size: z.number(),
  })).max(5).default([]),
  examDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade");
  const subject = searchParams.get("subject");
  const category = searchParams.get("category");
  const sortBy = searchParams.get("sortBy") ?? "latest";
  const examMode = searchParams.get("examMode") === "true";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = {
    schoolId: (session.user as any).schoolId,
    reportCount: { lt: 5 },
  };

  if (grade) where.grade = parseInt(grade);
  if (subject) where.subject = subject;
  if (category) where.category = category;
  if (examMode) where.importance = { in: ["critical", "high"] };

  const orderBy: any[] = [{ isPinned: "desc" }];
  if (sortBy === "popular") orderBy.push({ voteCount: "desc" });
  else if (sortBy === "hot") orderBy.push({ viewCount: "desc" });
  else orderBy.push({ createdAt: "desc" });

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, nickname: true, level: true, avatar: true } },
        _count: { select: { votes: true, bookmarks: true, comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  // Get user's votes/bookmarks for these posts
  const postIds = posts.map((p) => p.id);
  const [userVotes, userBookmarks] = await Promise.all([
    prisma.vote.findMany({
      where: { userId: session.user.id, postId: { in: postIds } },
      select: { postId: true },
    }),
    prisma.bookmark.findMany({
      where: { userId: session.user.id, postId: { in: postIds } },
      select: { postId: true },
    }),
  ]);

  const votedSet = new Set(userVotes.map((v) => v.postId));
  const bookmarkedSet = new Set(userBookmarks.map((b) => b.postId));

  const result = posts.map((p) => ({
    id: p.id,
    schoolId: p.schoolId,
    grade: p.grade,
    subject: p.subject,
    category: p.category,
    importance: p.importance,
    title: p.title,
    content: p.content,
    authorId: p.authorId,
    authorNickname: p.anonymous ? "익명" : p.author.nickname,
    authorLevel: p.author.level,
    authorAvatar: p.anonymous ? null : p.author.avatar,
    anonymous: p.anonymous,
    tags: p.tags,
    files: p.files,
    voteCount: p.voteCount,
    viewCount: p.viewCount,
    commentCount: p.commentCount,
    bookmarkCount: p.bookmarkCount,
    verified: p.verified,
    isPinned: p.isPinned,
    examDate: p.examDate,
    dueDate: p.dueDate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    isVoted: votedSet.has(p.id),
    isBookmarked: bookmarkedSet.has(p.id),
  }));

  return NextResponse.json({
    posts: result,
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const post = await prisma.post.create({
      data: {
        schoolId: (session.user as any).schoolId,
        authorId: session.user.id!,
        grade: data.grade,
        subject: data.subject,
        category: data.category,
        importance: data.importance,
        title: data.title,
        content: data.content,
        anonymous: data.anonymous,
        tags: data.tags,
        files: data.files as any,
        examDate: data.examDate ? new Date(data.examDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    // Add points + update post count
    await prisma.user.update({
      where: { id: session.user.id! },
      data: {
        points: { increment: 10 },
        postCount: { increment: 1 },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? "입력값을 확인해주세요" },
        { status: 400 }
      );
    }
    console.error("Create post error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
