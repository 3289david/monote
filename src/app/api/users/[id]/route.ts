import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { calculateLevel } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, nickname: true, avatar: true, schoolId: true,
      grade: true, classNum: true, points: true, level: true,
      badges: true, postCount: true, helpfulCount: true, createdAt: true,
      school: { select: { name: true } },
      _count: { select: { posts: true, comments: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "사용자 없음" }, { status: 404 });

  return NextResponse.json({
    user: {
      ...user,
      level: calculateLevel(user.points),
      schoolName: user.school.name,
    },
  });
}

const updateSchema = z.object({
  nickname: z.string().min(2).max(15).optional(),
  grade: z.number().int().min(1).max(3).optional(),
  classNum: z.number().int().min(1).max(20).optional(),
  avatar: z.string().url().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id } = await params;
  if (id !== session.user.id) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await req.json();
  const data = updateSchema.parse(body);

  if (data.nickname) {
    const existing = await prisma.user.findUnique({ where: { nickname: data.nickname } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "이미 사용 중인 닉네임이에요" }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ user: updated });
}
