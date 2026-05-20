import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { aadhaarNo, phone } = await req.json();

    if (!aadhaarNo) {
      return Response.json({ message: "Aadhaar number is required" }, { status: 400 });
    }

    // Clean Aadhaar number (remove spaces if any)
    const cleanedAadhaar = aadhaarNo.replace(/\s/g, "");

    // Validate Aadhaar number (must be 12 digits)
    if (!/^\d{12}$/.test(cleanedAadhaar)) {
      return Response.json({ message: "Aadhaar number must be exactly 12 digits" }, { status: 400 });
    }

    // Check if Aadhaar is already registered
    const existing = await prisma.user.findFirst({
      where: { aadhaarNo: cleanedAadhaar },
    });

    if (existing) {
      return Response.json({ message: "An account with this Aadhaar number already exists." }, { status: 400 });
    }

    // Determine the phone number to report as receiving the OTP
    const lastDigits = phone ? phone.replace(/\s/g, "").slice(-4) : "XXXX";
    const displayPhone = `XXXXXX${lastDigits}`;

    console.log(`[MOCK AADHAAR OTP] OTP sent to Aadhaar ${cleanedAadhaar} registered mobile (${displayPhone}). Use OTP: 123456 to verify.`);

    return Response.json({
      message: `A 6-digit OTP has been sent to the Aadhaar-linked mobile number ending in ${lastDigits}.`,
      success: true,
    }, { status: 200 });

  } catch (err) {
    console.error("Send Aadhaar OTP Error:", err);
    return Response.json({ message: "Server error during Aadhaar verification." }, { status: 500 });
  }
}
