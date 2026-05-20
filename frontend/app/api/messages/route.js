import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");

  if (!teamId) return Response.json({ message: "Missing teamId" }, { status: 400 });

  try {
    let channel = await prisma.channel.findFirst({ where: { teamId: parseInt(teamId), type: "GROUP" } });
    if (!channel) {
      channel = await prisma.channel.create({ data: { name: "General", teamId: parseInt(teamId), type: "GROUP" } });
    }

    const messages = await prisma.message.findMany({
      where: { channelId: channel.id },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "asc" }
    });

    return Response.json({ messages, channelId: channel.id }, { status: 200 });
  } catch (e) {
    console.error("Messages GET Error:", e);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { channelId, userId, content, type, fileUrl } = await req.json();
    if (!channelId || !userId || !content) return Response.json({ message: "Missing fields" }, { status: 400 });

    const msg = await prisma.message.create({
      data: { channelId, userId, content, type: type || "TEXT", fileUrl },
      include: { user: { select: { name: true, role: true } } }
    });

    return Response.json({ message: msg }, { status: 201 });
  } catch (e) {
    console.error("Messages POST Error:", e);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
