import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, level: true, avatar: true, badges: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "게시물을 찾을 수 없어요" }, { status: 404 });

  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  let isVoted = false;
  let isBookmarked = false;

  if (session?.user?.id) {
    const [vote, bookmark] = await Promise.all([
      prisma.vote.findUnique({ where: { postId_userId: { postId: id, userId: session.user.id! } } }),
      prisma.bookmark.findUnique({ where: { postId_userId: { postId: id, userId: session.user.id! } } }),
    ]);
    isVoted = !!vote;
    isBookmarked = !!bookmark;
  }

  return NextResponse.json({
    post: {
      ...post,
      authorNickname: post.anonymous ? "익명" : post.author.nickname,
      authorLevel: post.author.level,
      authorAvatar: post.anonymous ? null : post.author.avatar,
      isVoted,
      isBookmarked,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "게시물 없음" }, { status: 404 });

  const isAdmin = (session.user as any).isAdmin;
  if (post.authorId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id } });
  await prisma.user.update({
    where: { id: post.authorId },
    data: { postCount: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
