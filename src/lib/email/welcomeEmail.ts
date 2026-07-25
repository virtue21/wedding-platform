export interface WelcomeEmailData {
  brideName: string
  groomName: string
  appUrl: string
}

const STEPS = [
  {
    icon: '💍',
    title: 'Set up your wedding',
    body: 'Add your date, venue, and a cover photo — this becomes your beautiful invite page.',
  },
  {
    icon: '🎁',
    title: 'Build your gift registry',
    body: 'Add gifts with prices and shop links, plus your account details for cash gifts.',
  },
  {
    icon: '💳',
    title: 'Choose a plan',
    body: 'Pick the plan that fits your wedding size to unlock RSVPs and more.',
  },
  {
    icon: '🔗',
    title: 'Share with your guests',
    body: 'Send your unique link or QR code — guests RSVP right away, no app or login needed.',
  },
]

export function buildWelcomeEmail(data: WelcomeEmailData): string {
  const { brideName, groomName, appUrl } = data

  const stepsHtml = STEPS.map(
    (s, i) => `
    <tr>
      <td style="padding:0 0 20px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="44" valign="top" style="font-size:22px;padding-right:14px;">${s.icon}</td>
            <td valign="top">
              <p style="margin:0;font-size:14px;font-weight:600;color:#1c1917;">${i + 1}. ${s.title}</p>
              <p style="margin:3px 0 0;font-size:13px;color:#78716c;line-height:1.55;">${s.body}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to NemiPlanner</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:24px;">💍</span>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1c1917;letter-spacing:-0.3px;">NemiPlanner</p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:20px;border:1px solid #fce7f3;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;">Welcome aboard</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:600;color:#1c1917;line-height:1.25;">
                Congratulations, ${brideName} &amp; ${groomName}! 🎉
              </h1>

              <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;">
                Your account is verified and your wedding planner is ready. Here&rsquo;s how to get your wedding online in a few minutes:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                ${stepsHtml}
              </table>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#e11d48;border-radius:12px;">
                    <a href="${appUrl}/setup" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                      Start setting up →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#a8a29e;line-height:1.6;">
                Questions? Just reply to this email or reach us at <a href="mailto:hello@nemiplanner.xyz" style="color:#e11d48;text-decoration:none;">hello@nemiplanner.xyz</a>
              </p>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#d1c5bd;">
                NemiPlanner &mdash; weddings, beautifully managed
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
