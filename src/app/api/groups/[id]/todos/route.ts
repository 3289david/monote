import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  dueDate: z.string().datetime().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id } = await params;

  // Must be a member
  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id! } },
  });
  if (!membership) return NextResponse.json({ error: "그룹 멤버가 아니에요" }, { status: 403 });

  const todos = await (prisma as any).groupTodo.findMany({
    where: { groupId: id },
    orderBy: [{ completed: "asc" }, { createdAt: "asc" }],
    include: {
      createdBy: { select: { id: true, nickname: true, avatar: true } },
    },
  });

  return NextResponse.json({ todos });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id! } },
  });
  if (!membership) return NextResponse.json({ error: "그룹 멤버가 아니에요" }, { status: 403 });

  const body = await req.json();

  // Toggle completion
  if (body.action === "toggle" && body.todoId) {
    const todo = await (prisma as any).groupTodo.findUnique({ where: { id: body.todoId } });
    if (!todo) return NextResponse.json({ error: "없음" }, { status: 404 });
    const updated = await (prisma as any).groupTodo.update({
      where: { id: body.todoId },
      data: {
        completed: !todo.completed,
        completedById: !todo.completed ? session.user.id : null,
        updatedAt: new Date(),
      },
      include: { createdBy: { select: { id: true, nickname: true, avatar: true } } },
    });
    return NextResponse.json({ todo: updated });
  }

  // Delete
  if (body.action === "delete" && body.todoId) {
    const todo = await (prisma as any).groupTodo.findUnique({ where: { id: body.todoId } });
    if (!todo) return NextResponse.json({ error: "없음" }, { status: 404 });
    if (todo.createdById !== session.user.id && membership.role !== "leader") {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }
    await (prisma as any).groupTodo.delete({ where: { id: body.todoId } });
    return NextResponse.json({ ok: true });
  }

  const data = createSchema.parse(body);
  const todo = await (prisma as any).groupTodo.create({
    data: {
      groupId: id,
      createdById: session.user.id!,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: { createdBy: { select: { id: true, nickname: true, avatar: true } } },
  });

  return NextResponse.json({ todo }, { status: 201 });
}
