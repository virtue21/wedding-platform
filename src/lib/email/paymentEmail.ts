export interface PaymentEmailData {
  brideName: string
  groomName: string
  planName: string
  amountKobo: number
  reference: string
  appUrl: string
}

function formatAmount(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export function buildPaymentEmail(data: PaymentEmailData): string {
  const { brideName, groomName, planName, amountKobo, reference, appUrl } = data

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:24px;">💍</span>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1c1917;letter-spacing:-0.3px;">NemiPlanner</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;border:1px solid #fce7f3;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;">Payment confirmed</p>
              <h1 style="margin:0 0 24px;font-size:28px;font-weight:600;color:#1c1917;line-height:1.2;">
                You&rsquo;re all set, ${brideName}!
              </h1>

              <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;">
                Your <strong>${planName}</strong> plan is now active. Everything is unlocked and ready for you to start planning your big day.
              </p>

              <!-- Amount box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Amount paid</p>
                    <p style="margin:0;font-size:26px;font-weight:700;color:#e11d48;">${formatAmount(amountKobo)}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#a8a29e;">Ref: ${reference}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#e11d48;border-radius:12px;">
                    <a href="${appUrl}/admin/guests" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                      Go to your dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#a8a29e;line-height:1.6;">
                Questions? Reply to this email or reach us at <a href="mailto:hello@nemiplanner.xyz" style="color:#e11d48;text-decoration:none;">hello@nemiplanner.xyz</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#d1c5bd;">
                NemiPlanner &mdash; ${brideName} &amp; ${groomName}&rsquo;s wedding planner
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
