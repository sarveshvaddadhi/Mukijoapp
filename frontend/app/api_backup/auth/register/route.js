import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { name, email, phone, password, role, aadhaarNo, aadhaarVerified } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ message: "Name, email, and password are required" }, { status: 400 });
    }

    if (!aadhaarNo || !aadhaarVerified) {
      return Response.json({ message: "Aadhaar verification is required to create an account." }, { status: 400 });
    }

    const cleanedAadhaar = aadhaarNo.replace(/\s/g, "");

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.aadhaarVerified) {
        return Response.json({ message: "An account with this email already exists." }, { status: 400 });
      }

      // Check if Aadhaar already exists on another user
      const existingAadhaar = await prisma.user.findFirst({
        where: {
          aadhaarNo: cleanedAadhaar,
          NOT: { email }
        }
      });
      if (existingAadhaar) {
        return Response.json({ message: "An account with this Aadhaar number already exists." }, { status: 400 });
      }

      // Update existing stub user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.update({
        where: { email },
        data: {
          name,
          phone: phone ? phone.replace(/\s/g, "") : null,
          password: hashedPassword,
          role: role || existing.role || "PLAYER",
          aadhaarNo: cleanedAadhaar,
          aadhaarVerified: true,
        },
      });

      const { password: _, ...safeUser } = user;
      return Response.json({ user: safeUser }, { status: 200 });
    }

    // Check if Aadhaar already exists
    const existingAadhaar = await prisma.user.findFirst({ where: { aadhaarNo: cleanedAadhaar } });
    if (existingAadhaar) {
      return Response.json({ message: "An account with this Aadhaar number already exists." }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone ? phone.replace(/\s/g, "") : null,
        password: hashedPassword,
        role: role || "PLAYER",
        aadhaarNo: cleanedAadhaar,
        aadhaarVerified: true,
      },
    });

    const { password: _, ...safeUser } = user;
    return Response.json({ user: safeUser }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}