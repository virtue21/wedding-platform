import { Resend } from 'resend'
import { buildWelcomeEmail, type WelcomeEmailData } from './welcomeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(to: string, data: WelcomeEmailData) {
  const html = buildWelcomeEmail(data)

  const { error } = await resend.emails.send({
    from: 'NemiPlanner <hello@nemiplanner.xyz>',
    to,
    subject: `Welcome, ${data.brideName} & ${data.groomName} — let's plan your wedding 💍`,
    html,
  })

  if (error) {
    console.error('[Resend] Failed to send welcome email:', error)
  }
}
