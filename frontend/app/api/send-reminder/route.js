import twilio from "twilio";

export async function POST(req) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return Response.json({ message: "Phone and message required" }, { status: 400 });
    }

    if (process.env.TWILIO_ACCOUNT_SID === "placeholder_account_sid" || !process.env.TWILIO_ACCOUNT_SID) {
      console.log(`[MOCK TWILIO] Sending SMS to ${phone}: "${message}"`);
      return Response.json({ message: "Mock Reminder Sent" }, { status: 200 });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Note: To send generic SMS via Twilio, you need a Twilio Phone Number (from).
    // For trial accounts, you can only send to verified numbers.
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || "+1234567890",
      to: phone
    });

    return Response.json({ message: "Reminder sent successfully", sid: msg.sid }, { status: 200 });

  } catch (err) {
    console.error("Twilio Send Reminder Error:", err);
    return Response.json({ message: "Failed to send reminder", error: err.message }, { status: 500 });
  }
}
