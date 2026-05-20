import { prisma } from "@/lib/prisma";

// GET /api/events/[id]
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        team: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        rsvps: { include: { user: { select: { id: true, name: true } } } },
        attendances: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!event) return Response.json({ message: "Event not found" }, { status: 404 });
    return Response.json({ event });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// PUT /api/events/[id]
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title: data.title,
        type: data.type,
        description: data.description,
        location: data.location,
        date: data.date ? new Date(data.date) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        recurring: data.recurring,
        recurrence: data.recurrence,
      },
    });
    return Response.json({ event });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/events/[id]
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.event.delete({ where: { id: parseInt(id) } });
    return Response.json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
