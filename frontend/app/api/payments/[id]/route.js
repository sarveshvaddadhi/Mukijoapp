import { prisma } from "@/lib/prisma";

// GET /api/payments/[id]
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!payment) return Response.json({ message: "Payment not found" }, { status: 404 });
    return Response.json({ payment });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// PUT /api/payments/[id] — update payment status
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const payment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        status: data.status,
        method: data.method,
        reference: data.reference,
        paidAt: data.status === "PAID" ? new Date() : undefined,
      },
    });
    return Response.json({ payment });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
