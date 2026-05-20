import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, phone, password } = await req.json();

    if ((!email && !phone) || !password) {
      return Response.json({ message: "Email/phone and password are required" }, { status: 400 });
    }

    // Find user by email or phone
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phone) {
      user = await prisma.user.findFirst({ where: { phone: phone.replace(/\s/g, "") } });
    }

    if (!user) {
      return Response.json({ message: "No account found. Check your credentials." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return Response.json({ message: "Invalid password." }, { status: 401 });
    }

    // Return user without password
    const { password: _, ...safeUser } = user;
    return Response.json({ user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}