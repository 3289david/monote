import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id: postId } = await params;
  const existing = await prisma.bookmark.findUnique({
    where: { postId_userId: { postId, userId: session.user.id! } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: postId }, data: { bookmarkCount: { decrement: 1 } } });
    return NextResponse.json({ bookmarked: false });
  } else {
    await prisma.bookmark.create({ data: { postId, userId: session.user.id! } });
    await prisma.post.update({ where: { id: postId }, data: { bookmarkCount: { increment: 1 } } });
    return NextResponse.json({ bookmarked: true });
  }
}
