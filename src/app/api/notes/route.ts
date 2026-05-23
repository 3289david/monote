import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().max(10000).default(""),
  color: z.string().default("#ffffff"),
  pinned: z.boolean().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const notes = await (prisma as any).note.findMany({
    where: { userId: session.user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const data = schema.parse(body);

  const note = await (prisma as any).note.create({
    data: { ...data, userId: session.user.id },
  });

  return NextResponse.json({ note }, { status: 201 });
}
