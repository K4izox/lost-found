import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
    },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('--- EMAIL SIMULATION ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${text}`);
        console.log('------------------------');
        return;
    }

    try {
        await transporter.sendMail({
            from: `"Campus Connect" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>'),
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export const sendNotificationEmail = async (userEmail: string, userName: string, title: string, message: string, link?: string) => {
    const subject = `[Campus Connect] ${title}`;
    
    // Better HTML content for inbox deliverability
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2563eb; margin: 0;">Campus Connect</h1>
                <p style="color: #666; font-size: 14px;">President University's Lost & Found</p>
            </div>
            
            <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <h2 style="color: #111; margin-top: 0;">${title}</h2>
                <p style="color: #333; line-height: 1.5;">Hi <strong>${userName}</strong>,</p>
                <p style="color: #333; line-height: 1.5;">${message}</p>
                
                ${link ? `
                <div style="margin-top: 25px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}" 
                       style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        View Details
                    </a>
                </div>
                ` : ''}
            </div>
            
            <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
                <p>You received this because you are a registered student/staff at President University.</p>
                <p>&copy; ${new Date().getFullYear()} Campus Connect Team</p>
            </div>
        </div>
    `;

    const text = `Hi ${userName},\n\n${message}\n\n${link ? `Click here: ${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}` : ''}\n\nBest regards,\nCampus Connect Team`;
    
    await sendEmail(userEmail, subject, text, html);
};
