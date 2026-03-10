import nodemailer from 'nodemailer';

// Initialize Nodemailer Transport with SMTP details from environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface EmailParams {
    to: string | string[];
    subject: string;
    html: string;
    fromEmail?: string;
    fromName?: string;
}

export async function sendEmail({ to, subject, html, fromEmail, fromName }: EmailParams) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are not fully set. Email sending skipped.');
        return { success: false, error: 'SMTP configuration missing' };
    }

    try {
        const sender = fromEmail
            ? `"${fromName || 'Salon Booking System'}" <${fromEmail}>`
            : `"${process.env.SMTP_FROM_NAME || 'Salon Booking System'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;

        const info = await transporter.sendMail({
            from: sender,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            html: html,
        });

        return { success: true, data: info };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}
