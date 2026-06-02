import { prisma } from "@/lib/prisma";

// POST /api/campaigns/[id]/donate
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { userId, amount, message } = await req.json();

    if (!userId || !amount) return Response.json({ message: "userId and amount required" }, { status: 400 });

    const donation = await prisma.donation.create({
      data: {
        campaignId: parseInt(id),
        userId: parseInt(userId),
        amount: parseFloat(amount),
        message: message || null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Update campaign raised amount
    await prisma.campaign.update({
      where: { id: parseInt(id) },
      data: { raised: { increment: parseFloat(amount) } },
    });

    return Response.json({ donation }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
