import { Resend } from 'resend'
import { buildPaymentEmail, type PaymentEmailData } from './paymentEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPaymentConfirmationEmail(to: string, data: PaymentEmailData) {
  const html = buildPaymentEmail(data)

  const { error } = await resend.emails.send({
    from: 'NemiPlanner <hello@nemiplanner.xyz>',
    to,
    subject: `Payment confirmed — ${data.planName} plan activated`,
    html,
  })

  if (error) {
    console.error('[Resend] Failed to send payment confirmation email:', error)
  }
}
