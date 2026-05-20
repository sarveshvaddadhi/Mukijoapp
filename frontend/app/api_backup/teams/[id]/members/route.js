import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/teams/[id]/members
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const members = await prisma.teamMember.findMany({
      where: { teamId: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            parentLinks: {
              include: {
                child: { select: { id: true, name: true } }
              }
            },
            childLinks: {
              include: {
                parent: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
      orderBy: { joinedAt: "desc" },
    });
    return Response.json({ members });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/teams/[id]/members — add a member to team
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { userId, email, role, jersey } = await req.json();

    if (!userId && !email) {
      return Response.json({ message: "userId or email required" }, { status: 400 });
    }

    let targetUserId = userId;
    let targetRole = role;

    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        targetUserId = user.id;
        targetRole = role || user.role || "PLAYER";
      } else {
        // Create user stub
        const tempPassword = await bcrypt.hash("member123", 10);
        const newUser = await prisma.user.create({
          data: {
            name: email.split("@")[0],
            email,
            password: tempPassword,
            role: role || "PLAYER",
            aadhaarVerified: false,
          }
        });
        targetUserId = newUser.id;
        targetRole = role || "PLAYER";
      }
    } else {
      targetUserId = parseInt(userId);
      if (isNaN(targetUserId)) {
        return Response.json({ message: "Invalid userId" }, { status: 400 });
      }
      if (!targetRole) {
        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        targetRole = user?.role || "PLAYER";
      }
    }

    const existing = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: targetUserId, teamId: parseInt(id) } },
    });
    if (existing) return Response.json({ message: "Already a member" }, { status: 400 });

    const member = await prisma.teamMember.create({
      data: {
        userId: targetUserId,
        teamId: parseInt(id),
        role: targetRole,
        jersey: jersey || null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return Response.json({ member }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/members?userId=X
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return Response.json({ message: "userId required" }, { status: 400 });

    await prisma.teamMember.delete({
      where: { userId_teamId: { userId: parseInt(userId), teamId: parseInt(id) } },
    });
    return Response.json({ message: "Member removed" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
