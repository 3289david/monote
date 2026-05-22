import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id: postId } = await params;

  const existing = await prisma.vote.findUnique({
    where: { postId_userId: { postId, userId: session.user.id! } },
  });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "게시물 없음" }, { status: 404 });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: postId }, data: { voteCount: { decrement: 1 } } });
    return NextResponse.json({ voted: false });
  } else {
    await prisma.vote.create({ data: { postId, userId: session.user.id! } });
    await prisma.post.update({ where: { id: postId }, data: { voteCount: { increment: 1 } } });
    if (post.authorId !== session.user.id) {
      await prisma.user.update({
        where: { id: post.authorId },
        data: { points: { increment: 5 }, helpfulCount: { increment: 1 } },
      });
      // Create notification
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "like",
          title: "추천받음",
          body: `${(session.user as any).nickname}님이 회원님의 게시물을 추천했어요`,
          link: `/post/${postId}`,
        },
      });
    }
    return NextResponse.json({ voted: true });
  }
}
