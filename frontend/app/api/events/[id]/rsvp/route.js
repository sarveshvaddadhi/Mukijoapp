import { prisma } from "@/lib/prisma";

// POST /api/events/[id]/rsvp
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { userId, status } = await req.json();

    if (!userId || !status) return Response.json({ message: "userId and status required" }, { status: 400 });

    const rsvp = await prisma.eventRSVP.upsert({
      where: { eventId_userId: { eventId: parseInt(id), userId: parseInt(userId) } },
      update: { status, respondedAt: new Date() },
      create: { eventId: parseInt(id), userId: parseInt(userId), status },
      include: { user: { select: { id: true, name: true } } },
    });

    return Response.json({ rsvp });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
