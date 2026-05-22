import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "join") {
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json({ error: "정원이 가득 찼어요" }, { status: 400 });
    }
    await prisma.studyGroupMember.upsert({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
      create: { groupId: id, userId: session.user.id, role: "member" },
      update: {},
    });
    await prisma.studyGroup.update({
      where: { id },
      data: { memberCount: { increment: 1 } },
    });
  } else if (action === "leave") {
    await prisma.studyGroupMember.deleteMany({
      where: { groupId: id, userId: session.user.id, role: { not: "leader" } },
    });
    await prisma.studyGroup.update({
      where: { id },
      data: { memberCount: { decrement: 1 } },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });
  if (member?.role !== "leader")
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  await prisma.studyGroup.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
