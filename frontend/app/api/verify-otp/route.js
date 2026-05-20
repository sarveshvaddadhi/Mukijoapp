export async function POST(req) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return Response.json({ message: "Phone and OTP code required" }, { status: 400 });
    }

    const authKey = process.env.MSG91_AUTH_KEY;

    // For testing/development
    if (!authKey || authKey === "placeholder_auth_key") {
      if (code === "123456") {
        return Response.json({ message: "Mock OTP verified", verified: true }, { status: 200 });
      } else {
        return Response.json({ message: "Invalid mock OTP", verified: false }, { status: 400 });
      }
    }

    const mobile = phone.replace("+", "");
    
    const url = `https://control.msg91.com/api/v5/otp/verify?otp=${code}&mobile=${mobile}&authkey=${authKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (data.type === "success") {
      return Response.json({ message: "OTP verified", verified: true }, { status: 200 });
    } else {
      return Response.json({ message: "Invalid OTP", verified: false }, { status: 400 });
    }

  } catch (err) {
    console.error("MSG91 Verify OTP Error:", err);
    return Response.json({ message: "Failed to verify OTP", error: err.message }, { status: 500 });
  }
}
