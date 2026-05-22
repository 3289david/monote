import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: pollId } = await params;
  const { optionId } = await req.json();

  // Check poll exists and belongs to user's school
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, schoolId: session.user.schoolId },
    include: { options: true },
  });
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

  // Check poll hasn't expired
  if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
    return NextResponse.json({ error: "투표가 종료되었어요" }, { status: 400 });
  }

  // Check option belongs to this poll
  const option = poll.options.find((o: any) => o.id === optionId);
  if (!option) return NextResponse.json({ error: "Invalid option" }, { status: 400 });

  // Check if already voted
  const existingVote = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId: session.user.id } },
  });

  if (existingVote) {
    if (existingVote.optionId === optionId) {
      // Cancel vote
      await prisma.$transaction([
        prisma.pollVote.delete({ where: { id: existingVote.id } }),
        prisma.pollOption.update({ where: { id: optionId }, data: { voteCount: { decrement: 1 } } }),
        prisma.poll.update({ where: { id: pollId }, data: { totalVotes: { decrement: 1 } } }),
      ]);
      return NextResponse.json({ voted: false });
    } else {
      // Change vote
      await prisma.$transaction([
        prisma.pollVote.update({ where: { id: existingVote.id }, data: { optionId } }),
        prisma.pollOption.update({ where: { id: existingVote.optionId }, data: { voteCount: { decrement: 1 } } }),
        prisma.pollOption.update({ where: { id: optionId }, data: { voteCount: { increment: 1 } } }),
      ]);
      return NextResponse.json({ voted: true, changed: true });
    }
  }

  // New vote
  await prisma.$transaction([
    prisma.pollVote.create({ data: { pollId, optionId, userId: session.user.id } }),
    prisma.pollOption.update({ where: { id: optionId }, data: { voteCount: { increment: 1 } } }),
    prisma.poll.update({ where: { id: pollId }, data: { totalVotes: { increment: 1 } } }),
  ]);

  return NextResponse.json({ voted: true });
}
