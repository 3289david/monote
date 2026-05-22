import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, nickname: true, level: true, avatar: true } },
    },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      content: c.content,
      authorId: c.authorId,
      authorNickname: c.anonymous ? "익명" : c.author.nickname,
      authorLevel: c.author.level,
      authorAvatar: c.anonymous ? null : c.author.avatar,
      anonymous: c.anonymous,
      likes: c.likes,
      isAnswer: c.isAnswer,
      parentId: c.parentId,
      createdAt: c.createdAt,
    })),
  });
}

const schema = z.object({
  content: z.string().min(1).max(2000),
  anonymous: z.boolean().default(false),
  parentId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id: postId } = await params;
  const body = await req.json();
  const data = schema.parse(body);

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "게시물 없음" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: session.user.id!,
      content: data.content,
      anonymous: data.anonymous,
      parentId: data.parentId,
    },
    include: { author: { select: { nickname: true, level: true } } },
  });

  await prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
  await prisma.user.update({
    where: { id: session.user.id! },
    data: { points: { increment: 3 } },
  });

  if (post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "comment",
        title: "새 댓글",
        body: `${data.anonymous ? "익명" : (session.user as any).nickname}님이 댓글을 남겼어요: "${data.content.slice(0, 40)}..."`,
        link: `/post/${postId}`,
      },
    });
  }

  return NextResponse.json({
    comment: {
      id: comment.id,
      postId,
      content: comment.content,
      authorId: comment.authorId,
      authorNickname: comment.anonymous ? "익명" : comment.author.nickname,
      authorLevel: comment.author.level,
      anonymous: comment.anonymous,
      likes: 0,
      isAnswer: false,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
    },
  }, { status: 201 });
}
