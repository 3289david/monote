import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        include: {
          author: { select: { nickname: true, level: true, avatar: true } },
        },
      },
    },
  });

  const posts = bookmarks.map((b: any) => ({
    id: b.post.id,
    title: b.post.title,
    content: b.post.content,
    category: b.post.category,
    importance: b.post.importance,
    subject: b.post.subject,
    grade: b.post.grade,
    tags: b.post.tags,
    files: b.post.files as any[],
    anonymous: b.post.anonymous,
    authorId: b.post.authorId,
    authorNickname: b.post.author.nickname,
    authorLevel: b.post.author.level,
    authorImage: b.post.author.avatar,
    voteCount: b.post.voteCount,
    viewCount: b.post.viewCount,
    commentCount: b.post.commentCount,
    bookmarkCount: b.post.bookmarkCount,
    isPinned: b.post.isPinned,
    verified: b.post.verified,
    examDate: b.post.examDate,
    dueDate: b.post.dueDate,
    createdAt: b.post.createdAt,
    userVoted: false,
    userBookmarked: true,
  }));

  return NextResponse.json({ posts });
}
