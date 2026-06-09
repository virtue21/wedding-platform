import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
// 🔧 Change this to your verified domain once set up in Resend
// For testing: use 'onboarding@resend.dev' (only delivers to your own Resend account email)
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'NemiPlanner <onboarding@resend.dev>'

// ── Email HTML builders ────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NemiPlanner</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf8f4;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fdf8f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#1c1917;letter-spacing:-0.5px;">
                NemiPlanner
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;border:1px solid #fce7ef;padding:48px 40px;box-shadow:0 2px 16px rgba(212,84,122,0.07);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#c4b5b5;">
                © ${new Date().getFullYear()} NemiPlanner
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function confirmSignupHtml(brideName: string, groomName: string, url: string) {
  const greeting = brideName && groomName
    ? `Hi ${brideName} and ${groomName},`
    : brideName
    ? `Hi ${brideName},`
    : 'Welcome!'

  return baseTemplate(`
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <div style="display:inline-block;width:56px;height:56px;background-color:#fff1f4;border-radius:50%;text-align:center;line-height:56px;font-size:26px;">
            💍
          </div>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:8px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:17px;color:#1c1917;font-weight:600;">
            ${greeting}
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:12px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#1c1917;line-height:1.3;">
            Welcome to NemiPlanner!
          </h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:36px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#78716c;line-height:1.6;max-width:360px;">
            Confirm your email to start planning your wedding.
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:36px;">
          <a href="${url}" style="display:inline-block;background-color:#d4547a;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:14px;letter-spacing:0.2px;">
            Confirm Email
          </a>
        </td>
      </tr>
      <tr>
        <td style="border-top:1px solid #fce7ef;padding-top:28px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
            Or copy and paste this link into your browser:
          </p>
          <p style="margin:8px 0 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#d4547a;word-break:break-all;text-align:center;">
            ${url}
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:20px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#d4a0b0;line-height:1.6;">
            This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `)
}

function resetPasswordHtml(brideName: string, groomName: string, url: string) {
  const greeting = brideName && groomName
    ? `Hi ${brideName} and ${groomName},`
    : brideName
    ? `Hi ${brideName},`
    : 'Hi there,'

  return baseTemplate(`
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <div style="display:inline-block;width:56px;height:56px;background-color:#fff1f4;border-radius:50%;text-align:center;line-height:56px;font-size:26px;">
            🔐
          </div>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:8px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:17px;color:#1c1917;font-weight:600;">
            ${greeting}
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:12px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#1c1917;line-height:1.3;">
            Reset your password
          </h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:36px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#78716c;line-height:1.6;max-width:360px;">
            We received a request to reset your NemiPlanner password. Click the button below to choose a new one.
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:36px;">
          <a href="${url}" style="display:inline-block;background-color:#d4547a;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:14px;letter-spacing:0.2px;">
            Reset Password
          </a>
        </td>
      </tr>
      <tr>
        <td style="border-top:1px solid #fce7ef;padding-top:28px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
            Or copy and paste this link into your browser:
          </p>
          <p style="margin:8px 0 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#d4547a;word-break:break-all;text-align:center;">
            ${url}
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:20px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#d4a0b0;line-height:1.6;">
            This link expires in 1 hour. If you didn't request a reset, your account is safe — ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `)
}

// ── Handler ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const { user, email_data } = payload

    if (!user || !email_data) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
    }

    const { token_hash, email_action_type, redirect_to } = email_data

    // Build the confirmation URL
    const confirmationUrl = `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`

    // Pull names from user_metadata (set during signUp)
    const brideName: string = user.user_metadata?.bride_name ?? ''
    const groomName: string = user.user_metadata?.groom_name ?? ''

    let subject = ''
    let html = ''

    if (email_action_type === 'signup' || email_action_type === 'email_change') {
      subject = 'Confirm your NemiPlanner account'
      html = confirmSignupHtml(brideName, groomName, confirmationUrl)
    } else if (email_action_type === 'recovery') {
      subject = 'Reset your NemiPlanner password'
      html = resetPasswordHtml(brideName, groomName, confirmationUrl)
    } else {
      // Unhandled type — let Supabase handle it
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: user.email,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: err }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err) {
    console.error('Hook error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
