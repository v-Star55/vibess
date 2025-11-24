import { transporter } from "../config/mailer";


//  /////////////////////////////// Email Verification 

export const sendVerificationEmail = async (to:string, name:string, otp:number) => {



  
const mailOptions = {
  from: `Vibess <${process.env.GMAIL_USER}>`,
  to,
  subject: "Your Vibess OTP Code 🔐",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #6C63FF;">Hey ${name},</h2>

      <p>Welcome to <strong>Vibess</strong>! To complete your verification, please use the OTP code below:</p>

      <h1 style="background: #f7f7f7; display: inline-block; padding: 12px 25px; 
                 border-radius: 8px; letter-spacing: 6px; color: #222; 
                 font-size: 28px; font-weight: bold; margin: 20px 0;">
        ${otp}
      </h1>

      <p>This OTP is valid for <strong>10 minutes</strong>. Please don’t share it with anyone.</p>

      <p>If you didn’t request this verification, you can safely ignore this email.</p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="font-size: 14px; color: #777;">
        With 💜,<br>
        <strong>The Vibess Team</strong> ✨
      </p>
    </div>
  `,
};
  await transporter.sendMail(mailOptions);
};
