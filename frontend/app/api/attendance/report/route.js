import { prisma } from "@/lib/prisma";

// GET /api/attendance/report?teamId=X or ?userId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const userId = searchParams.get("userId");

    if (userId) {
      const total = await prisma.attendance.count({ where: { userId: parseInt(userId) } });
      const present = await prisma.attendance.count({ where: { userId: parseInt(userId), status: "PRESENT" } });
      const late = await prisma.attendance.count({ where: { userId: parseInt(userId), status: "LATE" } });
      const absent = await prisma.attendance.count({ where: { userId: parseInt(userId), status: "ABSENT" } });
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      return Response.json({ userId: parseInt(userId), total, present, late, absent, percentage });
    }

    if (teamId) {
      const members = await prisma.teamMember.findMany({
        where: { teamId: parseInt(teamId) },
        include: { user: { select: { id: true, name: true } } },
      });

      const report = [];
      for (const m of members) {
        const total = await prisma.attendance.count({
          where: { userId: m.userId, event: { teamId: parseInt(teamId) } },
        });
        const present = await prisma.attendance.count({
          where: { userId: m.userId, event: { teamId: parseInt(teamId) }, status: "PRESENT" },
        });
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        report.push({ userId: m.userId, name: m.user.name, role: m.role, total, present, percentage });
      }

      return Response.json({ report });
    }

    return Response.json({ message: "teamId or userId required" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
