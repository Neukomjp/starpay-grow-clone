import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
    try {
        const { to, subject: defaultSubject, type, data, storeId } = await request.json()

        let subject = defaultSubject
        let htmlContent = ''

        // Try to fetch store config if storeId is provided
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let emailConfig: any = null
        if (storeId) {
            try {
                // We import storeService dynamically to avoid circular deps if any, 
                // though here simple import is fine.
                const { storeService } = await import('@/lib/services/stores')
                const store = await storeService.getStoreById(storeId)
                if (store && store.email_config) {
                    emailConfig = store.email_config
                }
            } catch (e) {
                console.warn('Failed to fetch store config for email:', e)
            }
        }

        const replaceVariables = (template: string, variables: Record<string, string | number | undefined>) => {
            return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                const value = variables[key]
                return value !== undefined ? String(value) : `{{${key}}}`
            })
        }

        if (type === 'booking_confirmation') {
            const config = emailConfig?.booking_confirmation

            if (config?.subject) {
                subject = replaceVariables(config.subject, { ...data, storeName: data.storeName || '' })
            }

            if (config?.body) {
                // Convert newlines to <br> for HTML email if it's plain text template
                const body = replaceVariables(config.body, { ...data, storeName: data.storeName || '' })
                htmlContent = body.replace(/\n/g, '<br/>')
            } else {
                // Default Template
                htmlContent = `
                    <h1>Thank you for your booking!</h1>
                    <p>Dear ${data.customerName},</p>
                    <p>Your booking has been confirmed.</p>
                    <ul>
                        <li><strong>Service:</strong> ${data.serviceName}</li>
                        <li><strong>Staff:</strong> ${data.staffName}</li>
                        <li><strong>Date:</strong> ${data.date}</li>
                        <li><strong>Time:</strong> ${data.time}</li>
                        <li><strong>Total Price:</strong> ¥${data.totalPrice}</li>
                        <li><strong>Payment Method:</strong> ${data.paymentMethod}</li>
                    </ul>
                    <p>We look forward to seeing you!</p>
                    <p>Salon Booking System</p>
                `
            }
        } else if (type === 'booking_status_update') {
            htmlContent = `
                <h1>Booking Update</h1>
                <p>Dear ${data.customerName},</p>
                <p>${data.message}</p>
                <ul>
                    <li><strong>Status:</strong> ${data.status.toUpperCase()}</li>
                    <li><strong>Service:</strong> ${data.serviceName}</li>
                    <li><strong>Staff:</strong> ${data.staffName}</li>
                    <li><strong>Date:</strong> ${data.date}</li>
                    <li><strong>Time:</strong> ${data.time}</li>
                </ul>
                <p>Salon Booking System</p>
            `
        } else {
            htmlContent = `<p>${data.message}</p>`
        }

        const result = await sendEmail({
            to,
            subject,
            html: htmlContent
        })

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
