import { prisma } from "@/lib/prisma";

// POST /api/parent-links — link parent to child
export async function POST(req) {
  try {
    const { parentId, childId } = await req.json();
    if (!parentId || !childId) return Response.json({ message: "parentId and childId required" }, { status: 400 });

    const link = await prisma.parentLink.create({
      data: { parentId: parseInt(parentId), childId: parseInt(childId) },
      include: {
        parent: { select: { id: true, name: true, email: true } },
        child: { select: { id: true, name: true, email: true } },
      },
    });
    return Response.json({ link }, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") return Response.json({ message: "Link already exists" }, { status: 400 });
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// GET /api/parent-links?userId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ message: "userId required" }, { status: 400 });

    const asParent = await prisma.parentLink.findMany({
      where: { parentId: parseInt(userId) },
      include: { child: { select: { id: true, name: true, email: true } } },
    });
    const asChild = await prisma.parentLink.findMany({
      where: { childId: parseInt(userId) },
      include: { parent: { select: { id: true, name: true, email: true } } },
    });

    return Response.json({ children: asParent, parents: asChild });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/parent-links?parentId=X&childId=Y
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");
    const childId = searchParams.get("childId");

    if (!parentId || !childId) {
      return Response.json({ message: "parentId and childId required" }, { status: 400 });
    }

    await prisma.parentLink.delete({
      where: {
        parentId_childId: {
          parentId: parseInt(parentId),
          childId: parseInt(childId),
        },
      },
    });

    return Response.json({ message: "Link removed successfully" }, { status: 200 });
  } catch (err) {
    console.error("Delete parent-link error:", err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
