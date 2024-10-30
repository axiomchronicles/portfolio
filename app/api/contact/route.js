import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { personalData } from "@/utils/data/personal-data";

// Create and configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSKEY, 
  },
});

// HTML email template for the message received by the admin
const generateEmailTemplate = (name, email, userMessage) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #007BFF;">New Message Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="border-left: 4px solid #007BFF; padding-left: 10px; margin-left: 0;">
        ${userMessage}
      </blockquote>
      <p style="font-size: 12px; color: #888;">Click reply to respond to the sender.</p>
    </div>
  </div>
`;

// HTML email template for the confirmation email sent to the user
const generateConfirmationEmailTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #007BFF;">Thank You for Contacting Us</h2>
      <p>Hi ${name},</p>
      <p>We have received your message and will get back to you shortly.</p>
      <p>Thank you for reaching out to us!</p>
      <p style="font-size: 12px; color: #888;">Best regards,<br/>Nelox</p>
    </div>
  </div>
`;

// Helper function to send the main email
async function sendEmail(payload) {
  const { name, email, message: userMessage } = payload;
  
  const mailOptions = {
    from: process.env.EMAIL_ADDRESS, 
    to: personalData.email, 
    subject: `New Message From ${name}`, 
    text: userMessage, 
    html: generateEmailTemplate(name, email, userMessage), 
    replyTo: email, 
  };
  
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error while sending email:', error.message);
    return false;
  }
}

// Helper function to send a confirmation email to the user
async function sendConfirmationEmail(name, userEmail) {
  const confirmationMailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: userEmail,
    subject: "Thank you for contacting us!",
    html: generateConfirmationEmailTemplate(name),
  };
  
  try {
    await transporter.sendMail(confirmationMailOptions);
    return true;
  } catch (error) {
    console.error('Error while sending confirmation email:', error.message);
    return false;
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();

    // Send the main email to the admin
    const emailSuccess = await sendEmail(payload);

    if (emailSuccess) {
      // Send a confirmation email to the user
      await sendConfirmationEmail(payload.name, payload.email);

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully!',
      }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to send email.',
    }, { status: 500 });
  } catch (error) {
    console.error('API Error:', error.message);
    return NextResponse.json({
      success: false,
      message: 'Server error occurred.',
    }, { status: 500 });
  }
};
