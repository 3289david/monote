import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  nickname: z.string().min(2).max(15).regex(/^[가-힣a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(150).optional().nullable(),
  avatar: z.string().optional().nullable(),
  profileVisibility: z.enum(["public", "school_only", "private"]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, nickname: true, email: true, level: true, points: true,
      badges: true, streakDays: true, schoolId: true,
      school: { select: { name: true } },
      grade: true, classNum: true, avatar: true,
      bio: true, profileVisibility: true,
      _count: { select: { posts: true, votes: true } },
    },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (parsed.data.nickname) {
    const existing = await prisma.user.findUnique({ where: { nickname: parsed.data.nickname } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "이미 사용 중인 닉네임이에요" }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { id: true, nickname: true, email: true },
  });

  return NextResponse.json({ user });
}
