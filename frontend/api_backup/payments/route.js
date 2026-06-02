import { prisma } from "@/lib/prisma";

// GET /api/payments
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where = {};
    if (userId) {
      const parsedUserId = parseInt(userId);
      const parentLinks = await prisma.parentLink.findMany({
        where: { parentId: parsedUserId },
        select: { childId: true }
      });
      if (parentLinks.length > 0) {
        const userIds = [parsedUserId, ...parentLinks.map(l => l.childId)];
        where.userId = { in: userIds };
      } else {
        where.userId = parsedUserId;
      }
    }
    if (status) where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Summary stats
    const total = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } });
    const pending = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } });
    const overdue = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "OVERDUE" } });

    return Response.json({
      payments,
      summary: {
        totalCollected: total._sum.amount || 0,
        pendingAmount: pending._sum.amount || 0,
        overdueAmount: overdue._sum.amount || 0,
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/payments
export async function POST(req) {
  try {
    const { userId, amount, type, status, method, reference, description, eventId, dueDate } = await req.json();

    if (!userId || !amount) return Response.json({ message: "userId and amount required" }, { status: 400 });

    const payment = await prisma.payment.create({
      data: {
        userId: parseInt(userId),
        amount: parseFloat(amount),
        type: type || "MEMBERSHIP",
        status: status || "PENDING",
        method: method || null,
        reference: reference || null,
        description: description || null,
        eventId: eventId ? parseInt(eventId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        paidAt: status === "PAID" ? new Date() : null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return Response.json({ payment }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
