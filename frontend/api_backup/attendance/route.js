import { prisma } from "@/lib/prisma";

// GET /api/attendance?eventId=X or ?userId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const userId = searchParams.get("userId");
    const teamId = searchParams.get("teamId");

    const where = {};
    if (eventId) where.eventId = parseInt(eventId);
    if (userId) where.userId = parseInt(userId);
    if (teamId) where.event = { teamId: parseInt(teamId) };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        event: { select: { id: true, title: true, date: true, type: true } },
      },
      orderBy: { markedAt: "desc" },
    });

    return Response.json({ records });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/attendance — mark attendance (single or bulk)
export async function POST(req) {
  try {
    const body = await req.json();

    // Bulk: { eventId, records: [{userId, status}] }
    if (body.records && Array.isArray(body.records)) {
      const results = [];
      for (const rec of body.records) {
        const att = await prisma.attendance.upsert({
          where: { eventId_userId: { eventId: parseInt(body.eventId), userId: parseInt(rec.userId) } },
          update: { status: rec.status, markedAt: new Date() },
          create: { eventId: parseInt(body.eventId), userId: parseInt(rec.userId), status: rec.status },
        });
        results.push(att);
      }
      return Response.json({ records: results }, { status: 201 });
    }

    // Single: { eventId, userId, status }
    const { eventId, userId, status } = body;
    if (!eventId || !userId) return Response.json({ message: "eventId and userId required" }, { status: 400 });

    const attendance = await prisma.attendance.upsert({
      where: { eventId_userId: { eventId: parseInt(eventId), userId: parseInt(userId) } },
      update: { status: status || "PRESENT", markedAt: new Date() },
      create: { eventId: parseInt(eventId), userId: parseInt(userId), status: status || "PRESENT" },
    });

    return Response.json({ attendance }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
