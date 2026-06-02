import { prisma } from "@/lib/prisma";

// GET /api/teams/[id]
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true, phone: true } } } },
        events: { orderBy: { date: "asc" }, take: 10 },
        _count: { select: { members: true, events: true } },
      },
    });
    if (!team) return Response.json({ message: "Team not found" }, { status: 404 });
    return Response.json({ team });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// PUT /api/teams/[id]
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const team = await prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        division: data.division,
        status: data.status,
        description: data.description,
      },
    });
    return Response.json({ team });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/teams/[id]
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.team.delete({ where: { id: parseInt(id) } });
    return Response.json({ message: "Team deleted" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
