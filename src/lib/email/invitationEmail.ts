export interface InvitationEmailData {
  guestName:     string
  brideName:     string
  groomName:     string
  weddingDate:   string   // ISO date string, e.g. "2025-07-12"
  venueName:     string
  venueAddress:  string | null
  venueLat:      number | null
  venueLng:      number | null
  coverImageUrl: string | null
  weddingId:     string
  calendarUrl:   string
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-NG', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })
}

function mapUrl(lat: number | null, lng: number | null, address: string | null): string | null {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`
  if (address)    return `https://maps.google.com/?q=${encodeURIComponent(address)}`
  return null
}

export function buildInvitationEmail(data: InvitationEmailData): string {
  const {
    guestName, brideName, groomName,
    weddingDate, venueName, venueAddress,
    venueLat, venueLng, coverImageUrl,
    calendarUrl,
  } = data

  const formattedDate = formatDate(weddingDate)
  const googleMapsUrl = mapUrl(venueLat, venueLng, venueAddress)

  // Header: cover image OR pink gradient fallback
  const headerBlock = coverImageUrl
    ? `<img src="${coverImageUrl}"
            alt="${brideName} &amp; ${groomName}"
            width="600"
            style="display:block;width:100%;max-width:600px;height:220px;object-fit:cover;border-radius:0;" />`
    : `<div style="background:linear-gradient(135deg,#C94070 0%,#E8849A 50%,#F5B8C8 100%);
                   height:200px;width:100%;display:flex;align-items:center;justify-content:center;">
         <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
                   font-size:22px;font-weight:400;color:rgba(255,255,255,0.85);
                   letter-spacing:0.06em;text-transform:uppercase;">
           You&rsquo;re Invited
         </p>
       </div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brideName} &amp; ${groomName} invite you to their wedding</title>
</head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:Arial,Helvetica,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#FFFFFF;
                      border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:0;">

              <!-- ── HEADER IMAGE / GRADIENT ── -->
              ${headerBlock}

              <!-- ── INVITATION BODY ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:48px 48px 0;">

                    <!-- Together with their families -->
                    <p style="margin:0 0 20px;
                               font-family:Arial,Helvetica,sans-serif;
                               font-size:11px;font-weight:400;
                               color:#A8A29E;text-align:center;
                               letter-spacing:0.14em;text-transform:uppercase;">
                      Together with their families
                    </p>

                    <!-- Couple names — the centrepiece -->
                    <h1 style="margin:0 0 6px;
                                font-family:Georgia,'Times New Roman',serif;
                                font-size:40px;font-weight:400;
                                color:#1C1917;text-align:center;
                                letter-spacing:-0.01em;line-height:1.1;">
                      ${brideName}
                    </h1>
                    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;
                               font-size:18px;color:#C94070;text-align:center;
                               letter-spacing:0.1em;">
                      &amp;
                    </p>
                    <h1 style="margin:0 0 32px;
                                font-family:Georgia,'Times New Roman',serif;
                                font-size:40px;font-weight:400;
                                color:#1C1917;text-align:center;
                                letter-spacing:-0.01em;line-height:1.1;">
                      ${groomName}
                    </h1>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 32px;">
                          <table role="presentation" align="center" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:40px;height:1px;background:#E7E5E4;"></td>
                              <td style="width:6px;height:6px;background:#C94070;
                                         border-radius:50%;margin:0 10px;"></td>
                              <td style="width:40px;height:1px;background:#E7E5E4;"></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Personal greeting -->
                    <p style="margin:0 0 8px;
                               font-family:Georgia,'Times New Roman',serif;
                               font-size:18px;font-weight:400;
                               color:#3D3533;text-align:center;
                               font-style:italic;">
                      Dear ${guestName},
                    </p>
                    <p style="margin:0 0 36px;
                               font-family:Arial,Helvetica,sans-serif;
                               font-size:15px;color:#78716C;
                               text-align:center;line-height:1.7;">
                      You are warmly invited to celebrate the union of<br />
                      <strong style="color:#1C1917;">${brideName}</strong>
                      and
                      <strong style="color:#1C1917;">${groomName}</strong>.
                    </p>

                    <!-- Date block -->
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0"
                           style="background:#FDF8F4;border-radius:10px;
                                  border:1px solid #EDE8E4;margin:0 auto 36px;">
                      <tr>
                        <td style="padding:24px 40px;text-align:center;">
                          <p style="margin:0 0 4px;
                                     font-family:Arial,Helvetica,sans-serif;
                                     font-size:10px;font-weight:600;
                                     color:#A8A29E;letter-spacing:0.14em;
                                     text-transform:uppercase;">
                            Date
                          </p>
                          <p style="margin:0;
                                     font-family:Georgia,'Times New Roman',serif;
                                     font-size:20px;color:#1C1917;font-weight:400;">
                            ${formattedDate}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Venue block -->
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0"
                           style="background:#FDF8F4;border-radius:10px;
                                  border:1px solid #EDE8E4;margin:0 auto 40px;">
                      <tr>
                        <td style="padding:24px 40px;text-align:center;">
                          <p style="margin:0 0 4px;
                                     font-family:Arial,Helvetica,sans-serif;
                                     font-size:10px;font-weight:600;
                                     color:#A8A29E;letter-spacing:0.14em;
                                     text-transform:uppercase;">
                            Venue
                          </p>
                          <p style="margin:0 0 ${googleMapsUrl ? '12px' : '0'};
                                     font-family:Georgia,'Times New Roman',serif;
                                     font-size:20px;color:#1C1917;font-weight:400;">
                            ${venueName}
                          </p>
                          ${venueAddress ? `
                          <p style="margin:0 0 ${googleMapsUrl ? '12px' : '0'};
                                     font-family:Arial,Helvetica,sans-serif;
                                     font-size:13px;color:#78716C;">
                            ${venueAddress}
                          </p>` : ''}
                          ${googleMapsUrl ? `
                          <a href="${googleMapsUrl}"
                             style="font-family:Arial,Helvetica,sans-serif;
                                    font-size:12px;color:#C94070;
                                    text-decoration:none;font-weight:600;">
                            View on Map &rarr;
                          </a>` : ''}
                        </td>
                      </tr>
                    </table>

                    <!-- CTA buttons -->
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0"
                           style="margin:0 auto 48px;">
                      <tr>
                        <td style="padding-right:12px;">
                          <a href="${calendarUrl}"
                             style="display:inline-block;
                                    padding:14px 28px;
                                    background:#C94070;
                                    color:#FFFFFF;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:14px;font-weight:600;
                                    text-decoration:none;
                                    border-radius:10px;
                                    letter-spacing:0.01em;">
                            Save to Calendar
                          </a>
                        </td>
                        ${googleMapsUrl ? `
                        <td>
                          <a href="${googleMapsUrl}"
                             style="display:inline-block;
                                    padding:14px 28px;
                                    background:#FDF8F4;
                                    color:#1C1917;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:14px;font-weight:600;
                                    text-decoration:none;
                                    border-radius:10px;
                                    border:1px solid #EDE8E4;
                                    letter-spacing:0.01em;">
                            Get Directions
                          </a>
                        </td>` : ''}
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- ── FOOTER ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background:#1C1917;border-radius:0 0 12px 12px;">
                <tr>
                  <td style="padding:28px 48px;text-align:center;">
                    <p style="margin:0 0 4px;
                               font-family:Georgia,'Times New Roman',serif;
                               font-size:15px;color:#FFFFFF;letter-spacing:0.02em;">
                      NemiPlanner
                    </p>
                    <p style="margin:0;
                               font-family:Arial,Helvetica,sans-serif;
                               font-size:11px;color:#78716C;">
                      Wedding planning, beautifully managed &nbsp;&bull;&nbsp;
                      <a href="https://nemiplanner.xyz"
                         style="color:#A8A29E;text-decoration:none;">
                        nemiplanner.xyz
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`
}
