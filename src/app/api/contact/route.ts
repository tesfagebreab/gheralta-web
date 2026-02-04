import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { siteName, formData } = body;

    // Determine the recipient based on the domain
    let recipientEmail = "info@gheraltatours.com"; // Default
    
    if (siteName.includes("GheraltaAdventures")) {
      recipientEmail = "bookings@gheraltaadventures.com";
    } else if (siteName.includes("AbuneYemata")) {
      recipientEmail = "hello@abuneyemata.com";
    }

    // HERE: You would integrate a service like Resend, SendGrid, or Nodemailer
    // Example logic for the email body:
    const emailContent = `
      New Inquiry from ${siteName}
      ---------------------------
      Name: ${formData.fullName}
      Email: ${formData.email}
      Travelers: ${formData.travelers}
      Arrival: ${formData.arrivalDate}
      Departure: ${formData.departureDate}
      Message: ${formData.message}
    `;

    console.log(`Sending email to ${recipientEmail}...`);
    
    // For now, we return success. 
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}