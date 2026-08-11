import { Resend } from 'resend'
import { buildRefundEmail, type RefundEmailData } from './refundEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendRefundEmail(to: string, data: RefundEmailData) {
  const html = buildRefundEmail(data)

  const { error } = await resend.emails.send({
    from: 'NemiPlanner <hello@nemiplanner.xyz>',
    to,
    subject: `Refund processed — ${data.planName} plan deactivated`,
    html,
  })

  if (error) {
    console.error('[Resend] Failed to send refund email:', error)
  }
}
