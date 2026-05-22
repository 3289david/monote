import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  subject: z.string().min(1),
  grade: z.number().int().min(1).max(3),
  maxMembers: z.number().int().min(2).max(30).default(10),
  isPrivate: z.boolean().default(false),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const myGroups = url.searchParams.get("mine") === "true";

  const where = myGroups
    ? { members: { some: { userId: session.user.id } } }
    : { schoolId: session.user.schoolId, grade: session.user.grade ?? undefined };

  const groups = await prisma.studyGroup.findMany({
    where,
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = groups.map((g) => ({
    ...g,
    memberCount: g._count.members,
    isMember: g.members.length > 0,
    myRole: g.members[0]?.role ?? null,
  }));

  return NextResponse.json({ groups: result });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const group = await prisma.studyGroup.create({
    data: {
      ...parsed.data,
      schoolId: session.user.schoolId!,
      memberCount: 1,
      members: {
        create: { userId: session.user.id, role: "leader" },
      },
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}
