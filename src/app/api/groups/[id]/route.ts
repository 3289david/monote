import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, nickname: true, avatar: true, level: true } } } },
      _count: { select: { members: true } },
    },
  });

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const myMembership = group.members.find((m) => m.userId === session.user.id);

  return NextResponse.json({
    group: {
      ...group,
      isMember: !!myMembership,
      myRole: myMembership?.role ?? null,
    },
  });
}

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

    // Upsert membership
    await prisma.studyGroupMember.upsert({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
      create: { groupId: id, userId: session.user.id, role: "member" },
      update: {},
    });
    await prisma.studyGroup.update({
      where: { id },
      data: { memberCount: { increment: 1 } },
    });

    // Ensure group chat room exists & join it
    let chatRoom = group.chatRoomId
      ? await prisma.chatRoom.findUnique({ where: { id: group.chatRoomId } })
      : null;

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          schoolId: group.schoolId,
          createdById: session.user.id,
          name: `[스터디] ${group.name}`,
          type: "study",
          memberCount: 1,
        },
      });
      await prisma.studyGroup.update({
        where: { id },
        data: { chatRoomId: chatRoom.id },
      });
    }

    await prisma.chatMember.upsert({
      where: { roomId_userId: { roomId: chatRoom.id, userId: session.user.id } },
      create: { roomId: chatRoom.id, userId: session.user.id },
      update: {},
    });

    return NextResponse.json({ success: true, chatRoomId: chatRoom.id });

  } else if (action === "leave") {
    await prisma.studyGroupMember.deleteMany({
      where: { groupId: id, userId: session.user.id, role: { not: "leader" } },
    });
    await prisma.studyGroup.update({
      where: { id },
      data: { memberCount: { decrement: 1 } },
    });

    // Leave chat room too
    if (group.chatRoomId) {
      await prisma.chatMember.deleteMany({
        where: { roomId: group.chatRoomId, userId: session.user.id },
      });
    }
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
