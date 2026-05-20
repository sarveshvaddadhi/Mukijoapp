import { prisma } from "@/lib/prisma";

// GET /api/teams — list teams (optionally filter by userId)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let teams;
    if (userId) {
      teams = await prisma.team.findMany({
        where: { members: { some: { userId: parseInt(userId) } } },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          _count: { select: { members: true, events: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      teams = await prisma.team.findMany({
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          _count: { select: { members: true, events: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return Response.json({ teams });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/teams — create a new team
export async function POST(req) {
  try {
    const { name, division, description, userId } = await req.json();

    if (!name) return Response.json({ message: "Team name is required" }, { status: 400 });

    const team = await prisma.team.create({
      data: {
        name,
        division: division || null,
        description: description || null,
        members: userId ? {
          create: { userId: parseInt(userId), role: "COACH" }
        } : undefined,
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    return Response.json({ team }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
