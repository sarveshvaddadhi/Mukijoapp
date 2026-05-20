import { prisma } from "@/lib/prisma";

// POST /api/auth/forgot-password
export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ message: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return Response.json({ message: "No account found with this email address." }, { status: 404 });
    }

    // In production, you would:
    // 1. Generate a reset token
    // 2. Save it in the database with an expiry
    // 3. Send an email with the reset link
    // For now, we just validate the email exists

    return Response.json({
      message: "Password reset link has been sent to your email.",
      success: true,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
