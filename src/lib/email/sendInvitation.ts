import { Resend } from 'resend'
import { buildInvitationEmail, type InvitationEmailData } from './invitationEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitationEmail(data: InvitationEmailData & { guestEmail: string }) {
  const { guestEmail, brideName, groomName, ...rest } = data

  const html    = buildInvitationEmail({ brideName, groomName, ...rest })
  const subject = `${brideName} & ${groomName} invite you to their wedding`

  const { error } = await resend.emails.send({
    from:    'NemiPlanner <hello@nemiplanner.xyz>',
    to:      guestEmail,
    subject,
    html,
  })

  if (error) {
    // Log but don't throw — RSVP should succeed even if email fails
    console.error('[Resend] Failed to send invitation email:', error)
  }
}
