import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { eventId, userId, status } = await req.json();

    if (!eventId || !userId || !status) {
      return Response.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Upsert the RSVP status
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      update: {
        status,
        respondedAt: new Date(),
      },
      create: {
        eventId,
        userId,
        status,
      },
    });

    return Response.json({ message: "RSVP updated successfully", rsvp }, { status: 200 });
  } catch (err) {
    console.error("RSVP Error:", err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
