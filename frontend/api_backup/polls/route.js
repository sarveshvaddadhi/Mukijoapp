import { prisma } from "@/lib/prisma";

// GET /api/polls?teamId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const where = {};
    if (teamId) where.teamId = parseInt(teamId);

    const polls = await prisma.poll.findMany({
      where,
      include: {
        options: { include: { _count: { select: { votes: true } } } },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ polls });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/polls
export async function POST(req) {
  try {
    const { question, teamId, options } = await req.json();
    if (!question || !teamId || !options?.length) {
      return Response.json({ message: "question, teamId, and options required" }, { status: 400 });
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        teamId: parseInt(teamId),
        options: { create: options.map((text) => ({ text })) },
      },
      include: { options: true },
    });

    return Response.json({ poll }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
