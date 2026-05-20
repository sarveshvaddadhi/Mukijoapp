import { prisma } from "@/lib/prisma";

// GET /api/announcements?teamId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const where = {};
    if (teamId) where.teamId = parseInt(teamId);

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ announcements });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/announcements
export async function POST(req) {
  try {
    const { teamId, userId, title, content, priority } = await req.json();
    if (!teamId || !userId || !title || !content) {
      return Response.json({ message: "teamId, userId, title, content required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        teamId: parseInt(teamId),
        userId: parseInt(userId),
        title,
        content,
        priority: priority || "NORMAL",
      },
      include: {
        user: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });

    return Response.json({ announcement }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
