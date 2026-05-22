import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.authorId === session.user.id)
    return NextResponse.json({ error: "자신의 게시물은 신고할 수 없어요" }, { status: 400 });

  const existing = await prisma.report.findFirst({
    where: { postId: id, reporterId: session.user.id },
  });
  if (existing) return NextResponse.json({ error: "이미 신고한 게시물이에요" }, { status: 409 });

  await prisma.$transaction([
    prisma.report.create({
      data: { postId: id, reporterId: session.user.id, reason: "user_report" },
    }),
    prisma.post.update({
      where: { id },
      data: { reportCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
