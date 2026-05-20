import { prisma } from "@/lib/prisma";

// GET /api/channels?teamId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const where = {};
    if (teamId) where.teamId = parseInt(teamId);

    const channels = await prisma.channel.findMany({
      where,
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ channels });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/channels
export async function POST(req) {
  try {
    const { name, type, teamId } = await req.json();
    if (!name) return Response.json({ message: "name required" }, { status: 400 });

    const channel = await prisma.channel.create({
      data: {
        name,
        type: type || "GROUP",
        teamId: teamId ? parseInt(teamId) : null,
      },
    });

    return Response.json({ channel }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
