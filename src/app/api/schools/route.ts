import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const schools = await prisma.school.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { memberCount: "desc" },
    take: 20,
  });

  return NextResponse.json({ schools });
}

const createSchema = z.object({
  name: z.string().min(2).max(50),
  type: z.enum(["high", "middle"]),
  region: z.string().min(1).max(20),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const existing = await prisma.school.findUnique({ where: { name: data.name } });
    if (existing) return NextResponse.json({ school: existing });

    const school = await prisma.school.create({ data });
    return NextResponse.json({ school }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error("Create school error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했어요" }, { status: 500 });
  }
}
