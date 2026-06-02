import { prisma } from "@/lib/prisma";

// GET /api/campaigns?teamId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const where = {};
    if (teamId) where.teamId = parseInt(teamId);

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        team: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        donations: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ campaigns });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/campaigns
export async function POST(req) {
  try {
    const { title, description, goalAmount, teamId, createdById, endDate } = await req.json();
    if (!title || !goalAmount || !teamId || !createdById) {
      return Response.json({ message: "title, goalAmount, teamId, createdById required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description: description || null,
        goalAmount: parseFloat(goalAmount),
        teamId: parseInt(teamId),
        createdById: parseInt(createdById),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: { team: { select: { id: true, name: true } } },
    });

    return Response.json({ campaign }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
