import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ALLOWED_EMOJIS = ["👍", "🔥", "😱", "🤔", "💯", "😂"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const postId = url.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  // Use raw query since Reaction isn't in Prisma client yet (before migration)
  try {
    const reactions = await (prisma as any).reaction.groupBy({
      by: ["emoji"],
      where: { postId },
      _count: { emoji: true },
    });

    const myReactions = await (prisma as any).reaction.findMany({
      where: { postId, userId: session.user.id },
      select: { emoji: true },
    });
    const mySet = new Set(myReactions.map((r: any) => r.emoji));

    const result = ALLOWED_EMOJIS.map((emoji) => {
      const found = reactions.find((r: any) => r.emoji === emoji);
      return { emoji, count: found?._count.emoji ?? 0, reacted: mySet.has(emoji) };
    });

    return NextResponse.json({ reactions: result });
  } catch {
    // Table may not exist yet before migration
    return NextResponse.json({ reactions: ALLOWED_EMOJIS.map(emoji => ({ emoji, count: 0, reacted: false })) });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, emoji } = await req.json();
  if (!postId || !ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  try {
    const existing = await (prisma as any).reaction.findUnique({
      where: { postId_userId_emoji: { postId, userId: session.user.id, emoji } },
    });

    if (existing) {
      await (prisma as any).reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ reacted: false });
    } else {
      await (prisma as any).reaction.create({
        data: { postId, userId: session.user.id, emoji },
      });
      return NextResponse.json({ reacted: true });
    }
  } catch {
    return NextResponse.json({ error: "DB not migrated yet" }, { status: 500 });
  }
}
