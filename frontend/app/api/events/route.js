import { prisma } from "@/lib/prisma";

// GET /api/events
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const userId = searchParams.get("userId");

    const where = {};
    if (teamId) where.teamId = parseInt(teamId);
    if (userId) where.team = { members: { some: { userId: parseInt(userId) } } };

    const events = await prisma.event.findMany({
      where,
      include: {
        team: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { rsvps: true, attendances: true } },
        rsvps: { select: { userId: true, status: true } },
      },
      orderBy: { date: "asc" },
    });

    return Response.json({ events });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/events
export async function POST(req) {
  try {
    const { title, type, description, location, date, endTime, recurring, recurrence, teamId, createdById } = await req.json();

    if (!title || !date || !teamId || !createdById) {
      return Response.json({ message: "title, date, teamId, createdById required" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        type: type || "TRAINING",
        description: description || null,
        location: location || null,
        date: new Date(date),
        endTime: endTime ? new Date(endTime) : null,
        recurring: recurring || false,
        recurrence: recurrence || null,
        teamId: parseInt(teamId),
        createdById: parseInt(createdById),
      },
      include: { team: { select: { id: true, name: true } } },
    });

    return Response.json({ event }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
