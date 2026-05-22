import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  subject: z.string().min(1),
  duration: z.number().int().min(1).max(300),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const sessions = await prisma.studySession.findMany({
    where: { userId: session.user.id!, date: { gte: since } },
    orderBy: { date: "desc" },
  });

  // Aggregate by subject
  const bySubject = sessions.reduce((acc, s) => {
    acc[s.subject] = (acc[s.subject] ?? 0) + s.duration;
    return acc;
  }, {} as Record<string, number>);

  // Aggregate by day
  const byDay = sessions.reduce((acc, s) => {
    const day = s.date.toISOString().slice(0, 10);
    acc[day] = (acc[day] ?? 0) + s.duration;
    return acc;
  }, {} as Record<string, number>);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

  return NextResponse.json({ sessions, bySubject, byDay, totalMinutes });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const data = schema.parse(body);

  const record = await prisma.studySession.create({
    data: { userId: session.user.id!, ...data },
  });

  // Award streak points
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = await prisma.studySession.count({
    where: { userId: session.user.id!, date: { gte: today } },
  });

  if (todaySessions === 1) {
    // First session today
    await prisma.user.update({
      where: { id: session.user.id! },
      data: { points: { increment: 5 }, streakDays: { increment: 1 } },
    });
  }

  return NextResponse.json({ record }, { status: 201 });
}
