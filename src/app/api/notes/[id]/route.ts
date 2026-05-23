import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().max(10000).optional(),
  color: z.string().optional(),
  pinned: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id } = await params;
  const note = await (prisma as any).note.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id) return NextResponse.json({ error: "없음" }, { status: 404 });

  const body = await req.json();
  const data = updateSchema.parse(body);

  const updated = await (prisma as any).note.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  });

  return NextResponse.json({ note: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id } = await params;
  const note = await (prisma as any).note.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id) return NextResponse.json({ error: "없음" }, { status: 404 });

  await (prisma as any).note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
