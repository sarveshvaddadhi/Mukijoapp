import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentIds } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentIds) {
      return Response.json({ message: "Missing required fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    
    // For testing/development when real Razorpay is not configured
    if (secret === "placeholder_secret_key" || secret === "placeholder_secret") {
      console.log("[MOCK] Verifying Razorpay payment automatically.");
    } else {
      // Verify Signature
      const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        return Response.json({ message: "Invalid Payment Signature", verified: false }, { status: 400 });
      }
    }

    // If signature is valid, update the payment records in DB
    const ids = paymentIds.map(id => parseInt(id));

    await prisma.payment.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "PAID",
        method: "RAZORPAY",
        reference: razorpay_payment_id,
        paidAt: new Date()
      }
    });

    return Response.json({ message: "Payment verified successfully", verified: true }, { status: 200 });

  } catch (err) {
    console.error("Verify Payment Error:", err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
