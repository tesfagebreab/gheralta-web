import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { type, siteName, data } = await req.json();

    // 1. DYNAMIC ROUTING & BRANDING
    // Maps the source site to the correct internal recipient and professional sender
    let recipient = "info@gheraltatours.com";
    let senderEmail = "notifications@gheraltatours.com"; 

    if (siteName?.includes("GheraltaAdventures")) {
      recipient = "bookings@gheraltaadventures.com";
      senderEmail = "notifications@gheraltaadventures.com";
    } else if (siteName?.includes("AbuneYemata")) {
      recipient = "hello@abuneyemata.com";
      senderEmail = "notifications@abuneyemata.com";
    }

    // 2. Build the Subject Line with Tour Title
    const tourLabel = data.tourTitle ? `: ${data.tourTitle}` : "";
    const subject = type === "BOOKING" 
      ? `🚨 PAID BOOKING${tourLabel} (${siteName})` 
      : `📩 NEW INQUIRY${tourLabel} (${siteName})`;

    // 3. Build the Email Body
    let emailBody = "";
    if (type === "BOOKING") {
      emailBody = `
        PAYMENT CONFIRMED
        -----------------
        Tour: ${data.tours}
        Customer: ${data.customerName}
        Email: ${data.customerEmail}
        Amount: $${data.amount}
        Site: ${siteName}
      `;
    } else {
      emailBody = `
        NEW INQUIRY DETAILS
        -------------------
        Tour: ${data.tourTitle || "General Inquiry"}
        Name: ${data.fullName}
        Email: ${data.email}
        Travelers: ${data.travelers}
        Dates: ${data.arrivalDate} to ${data.departureDate}
        
        Message: 
        ${data.message}

        Sent from: ${siteName}
      `;
    }

    // 4. Send the actual email
    // Clean display name (e.g., "GheraltaTours.com" -> "Gheralta Tours")
    const fromDisplayName = siteName.replace('.com', '').replace(/([A-Z])/g, ' $1').trim();

    const { error } = await resend.emails.send({
      from: `${fromDisplayName} <${senderEmail}>`, 
      to: recipient,
      replyTo: data.email || data.customerEmail,
      subject: subject,
      text: emailBody,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    return NextResponse.json({ success: true, routedTo: recipient });
  } catch (error) {
    console.error("Email Route Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}