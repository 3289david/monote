import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const rooms = await prisma.chatRoom.findMany({
    where: { schoolId: (session.user as any).schoolId },
    orderBy: [{ isDefault: "desc" }, { lastMessageAt: "desc" }],
    include: {
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({ rooms });
}

const schema = z.object({
  name: z.string().min(2).max(30),
  type: z.enum(["grade", "subject", "open"]),
  grade: z.number().optional(),
  subject: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const data = schema.parse(body);

  const schoolId = (session.user as any).schoolId;

  // Idempotency: prevent exact-duplicate room names per school within 5 seconds
  const recent = await prisma.chatRoom.findFirst({
    where: {
      schoolId,
      name: data.name,
      type: data.type,
      createdById: session.user.id!,
      createdAt: { gte: new Date(Date.now() - 5000) },
    },
  });
  if (recent) return NextResponse.json({ room: recent }, { status: 200 });

  const room = await prisma.chatRoom.create({
    data: {
      schoolId,
      createdById: session.user.id!,
      name: data.name,
      type: data.type,
      grade: data.grade,
      subject: data.subject,
      memberCount: 1,
    },
  });

  // Auto-join creator
  await prisma.chatMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id! } },
    create: { roomId: room.id, userId: session.user.id! },
    update: {},
  });

  return NextResponse.json({ room }, { status: 201 });
}
