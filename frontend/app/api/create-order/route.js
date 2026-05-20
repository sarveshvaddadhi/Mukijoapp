import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, paymentIds, userId } = body;

    if (!amount || !userId || !paymentIds) {
      return Response.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Amount should be in paise for Razorpay
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_user_${userId}_${Date.now()}`,
      notes: {
        paymentIds: paymentIds.join(","), // Store payment IDs to verify later
      },
    };

    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    if (secret === "placeholder_secret_key" || secret === "placeholder_secret") {
      return Response.json({
        order: { id: "mock_order_" + Date.now(), amount: options.amount, currency: "INR" }
      }, { status: 200 });
    }

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return Response.json({ message: "Failed to create order" }, { status: 500 });
    }

    return Response.json({ order }, { status: 200 });

  } catch (err) {
    console.error("Razorpay Create Order Error:", err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
