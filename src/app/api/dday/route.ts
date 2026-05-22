import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(50),
  date: z.string().datetime(),
  category: z.enum(["exam", "performance", "event"]).default("exam"),
  subject: z.string().optional(),
  color: z.string().default("#533afd"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const items = await prisma.dDay.findMany({
    where: { userId: session.user.id! },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const data = schema.parse(body);

  const item = await prisma.dDay.create({
    data: { userId: session.user.id!, ...data, date: new Date(data.date) },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID 필요" }, { status: 400 });

  await prisma.dDay.deleteMany({ where: { id, userId: session.user.id! } });
  return NextResponse.json({ success: true });
}
