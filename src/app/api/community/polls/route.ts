import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createPollSchema = z.object({
  question: z.string().min(5).max(200),
  options: z.array(z.string().min(1).max(100)).min(2).max(6),
  isAnonymous: z.boolean().optional().default(false),
  endsAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  const schoolFilter = session?.user?.schoolId ? { schoolId: session.user.schoolId } : {};

  const polls = await prisma.poll.findMany({
    where: schoolFilter,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      options: true,
      author: { select: { nickname: true, level: true, avatar: true } },
      ...(session?.user?.id ? { votes: { where: { userId: session.user.id }, select: { optionId: true } } } : {}),
    },
  });

  const formatted = polls.map((poll: any) => ({
    id: poll.id,
    question: poll.question,
    options: poll.options.map((opt: any) => ({
      id: opt.id,
      text: opt.text,
      voteCount: opt.voteCount,
      percentage: poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0,
    })),
    totalVotes: poll.totalVotes,
    isAnonymous: poll.isAnonymous,
    endsAt: poll.endsAt,
    createdAt: poll.createdAt,
    authorNickname: poll.isAnonymous ? "익명" : poll.author.nickname,
    authorLevel: poll.author.level,
    myVoteOptionId: poll.votes?.[0]?.optionId ?? null,
    expired: poll.endsAt ? new Date(poll.endsAt) < new Date() : false,
  }));

  return NextResponse.json({ polls: formatted });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createPollSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { question, options, isAnonymous, endsAt } = parsed.data;

  const poll = await prisma.poll.create({
    data: {
      question,
      schoolId: session.user.schoolId,
      authorId: session.user.id,
      isAnonymous,
      endsAt: endsAt ? new Date(endsAt) : null,
      options: { create: options.map((text) => ({ text })) },
    },
    include: { options: true },
  });

  return NextResponse.json({ poll }, { status: 201 });
}
