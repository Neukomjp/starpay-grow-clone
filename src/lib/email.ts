import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
// If no key is provided, it will throw an error or fail silently depending on usage
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Valid placeholder to prevent crash if env missing

interface EmailParams {
    to: string | string[];
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email sending skipped.');
        return { success: false, error: 'API Key missing' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Salon Booking System <onboarding@resend.dev>', // Default sender for testing
            to: Array.isArray(to) ? to : [to],
            // resend free tier only allows sending to verified email, or to yourself (the account owner)
            // ensuring this doesn't break app flow
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}
