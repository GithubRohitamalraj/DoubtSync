import nodemailer from 'nodemailer';

// Create a test account using Ethereal Email
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

let transporter: nodemailer.Transporter | null = null;

export const sendOTPEmail = async (to: string, otp: string) => {
  if (!transporter) {
    transporter = await createTestAccount();
  }

  const info = await transporter.sendMail({
    from: '"Mentor Connect" <noreply@mentorconnect.com>',
    to,
    subject: "Your Verification Code",
    text: `Your verification code is: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email</h2>
        <p>Thank you for signing up! Please use the following code to verify your email address:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</span>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  });

  // Return the preview URL for testing
  return nodemailer.getTestMessageUrl(info);
}