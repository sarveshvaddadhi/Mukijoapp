import { prisma } from "@/lib/prisma";

// POST /api/polls/[id]/vote
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { userId, optionId } = await req.json();

    if (!userId || !optionId) return Response.json({ message: "userId and optionId required" }, { status: 400 });

    const vote = await prisma.pollVote.upsert({
      where: { pollId_userId: { pollId: parseInt(id), userId: parseInt(userId) } },
      update: { optionId: parseInt(optionId), votedAt: new Date() },
      create: { pollId: parseInt(id), userId: parseInt(userId), optionId: parseInt(optionId) },
    });

    return Response.json({ vote });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
