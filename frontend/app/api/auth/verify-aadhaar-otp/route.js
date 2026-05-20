export async function POST(req) {
  try {
    const { aadhaarNo, code, name } = await req.json();

    if (!aadhaarNo || !code) {
      return Response.json({ message: "Aadhaar number and OTP code are required" }, { status: 400 });
    }

    const cleanedAadhaar = aadhaarNo.replace(/\s/g, "");

    // Mock validation of the OTP
    if (code === "123456") {
      // Simulate fetching profile details from UIDAI database
      const verifiedName = name ? name.trim().toUpperCase() : "SARVESH SHARMA";
      
      return Response.json({
        success: true,
        message: "Aadhaar verified successfully",
        details: {
          name: verifiedName,
          gender: "MALE",
          dob: "15-05-1995",
          address: "H-Block, Sector 62, Noida, Uttar Pradesh - 201301",
          aadhaarNo: `XXXX XXXX ${cleanedAadhaar.slice(-4)}`
        }
      }, { status: 200 });
    } else {
      return Response.json({
        success: false,
        message: "Invalid OTP. Please enter 123456 to verify."
      }, { status: 400 });
    }

  } catch (err) {
    console.error("Verify Aadhaar OTP Error:", err);
    return Response.json({ message: "Server error during Aadhaar verification." }, { status: 500 });
  }
}
