import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { calculateLevel } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, nickname: true, avatar: true, schoolId: true,
      grade: true, classNum: true, points: true, level: true,
      badges: true, postCount: true, helpfulCount: true, createdAt: true,
      bio: true, profileVisibility: true,
      school: { select: { name: true } },
      _count: { select: { posts: true, comments: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "사용자 없음" }, { status: 404 });

  const viewerId = session?.user?.id;
  const viewerSchoolId = (session?.user as any)?.schoolId;
  const isOwner = viewerId === user.id;

  // Privacy checks (name always shows, just block profile view)
  if (!isOwner) {
    if (user.profileVisibility === "private") {
      return NextResponse.json({ error: "비공개 프로필이에요", nickname: user.nickname }, { status: 403 });
    }
    if (user.profileVisibility === "school_only" && viewerSchoolId !== user.schoolId) {
      return NextResponse.json({ error: "같은 학교 학생만 볼 수 있어요", nickname: user.nickname }, { status: 403 });
    }
  }

  // Fetch recent posts for profile
  const recentPosts = await prisma.post.findMany({
    where: { authorId: user.id, anonymous: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, voteCount: true, commentCount: true, createdAt: true, category: true },
  });

  return NextResponse.json({
    user: {
      ...user,
      level: calculateLevel(user.points),
      schoolName: user.school.name,
    },
    recentPosts,
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
