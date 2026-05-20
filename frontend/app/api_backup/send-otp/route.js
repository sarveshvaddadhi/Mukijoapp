export async function POST(req) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return Response.json({ message: "Phone number required" }, { status: 400 });
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    // For testing/development when real MSG91 is not configured, we return success.
    if (!authKey || authKey === "placeholder_auth_key") {
      console.log(`[MOCK] Sending OTP to ${phone}. Use 123456 to verify.`);
      return Response.json({ message: "Mock OTP Sent" }, { status: 200 });
    }

    // MSG91 Send OTP via fetch
    // Remove "+" from phone number if present
    const mobile = phone.replace("+", "");
    
    const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobile}&authkey=${authKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();

    if (data.type === "success" || data.type === "success") {
        return Response.json({ message: "OTP Sent successfully", status: "pending" }, { status: 200 });
    } else {
        return Response.json({ message: "Failed to send OTP", error: data.message }, { status: 400 });
    }

  } catch (err) {
    console.error("MSG91 Send OTP Error:", err);
    return Response.json({ message: "Failed to send OTP", error: err.message }, { status: 500 });
  }
}
