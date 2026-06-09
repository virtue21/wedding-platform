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

function formatDayNumber(iso: string): string {
  return new Date(iso + 'T12:00:00').getDate().toString()
}

function formatMonthYear(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
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
  const dayNumber     = formatDayNumber(weddingDate)
  const monthYear     = formatMonthYear(weddingDate)
  const googleMapsUrl = mapUrl(venueLat, venueLng, venueAddress)

  // Header image OR elegant gradient fallback
  const headerBlock = coverImageUrl
    ? `<img src="${coverImageUrl}"
            alt="${brideName} &amp; ${groomName}"
            width="600"
            style="display:block;width:100%;max-width:600px;height:260px;object-fit:cover;" />`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
         <tr>
           <td style="background:linear-gradient(135deg,#7C3B56 0%,#C94070 45%,#E8849A 80%,#F5B8C8 100%);
                      height:260px;text-align:center;vertical-align:middle;">
             <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;
                        font-size:10px;font-weight:600;color:rgba(255,255,255,0.65);
                        letter-spacing:0.22em;text-transform:uppercase;">
               You Are Invited
             </p>
             <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
                        font-size:36px;font-weight:400;color:#FFFFFF;
                        letter-spacing:-0.01em;line-height:1.15;
                        text-shadow:0 2px 12px rgba(0,0,0,0.18);">
               ${brideName} &amp; ${groomName}
             </p>
           </td>
         </tr>
       </table>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brideName} &amp; ${groomName} — Wedding Invitation</title>
</head>
<body style="margin:0;padding:0;background:#EDE8E3;font-family:Arial,Helvetica,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#EDE8E3;padding:40px 16px 48px;">
    <tr>
      <td align="center">

        <!-- ── CARD ── -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#FFFFFF;
                      border-radius:16px;overflow:hidden;
                      box-shadow:0 8px 40px rgba(0,0,0,0.10);">
          <tr>
            <td style="padding:0;">

              <!-- COVER IMAGE / GRADIENT -->
              ${headerBlock}

              <!-- ── NAMES BLOCK ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background:#FFFFFF;">
                <tr>
                  <td style="padding:44px 48px 0;text-align:center;">

                    <!-- Together with their families -->
                    <p style="margin:0 0 18px;
                               font-family:Arial,Helvetica,sans-serif;
                               font-size:10px;font-weight:600;
                               color:#B8A99A;letter-spacing:0.2em;
                               text-transform:uppercase;">
                      Together with their families
                    </p>

                    <!-- Names — centrepiece -->
                    <h1 style="margin:0;
                                font-family:Georgia,'Times New Roman',serif;
                                font-size:44px;font-weight:400;
                                color:#1C1917;text-align:center;
                                letter-spacing:-0.01em;line-height:1.1;">
                      ${brideName}
                    </h1>
                    <p style="margin:8px 0;font-family:Georgia,'Times New Roman',serif;
                               font-size:22px;color:#C94070;text-align:center;
                               letter-spacing:0.08em;">
                      &amp;
                    </p>
                    <h1 style="margin:0 0 32px;
                                font-family:Georgia,'Times New Roman',serif;
                                font-size:44px;font-weight:400;
                                color:#1C1917;text-align:center;
                                letter-spacing:-0.01em;line-height:1.1;">
                      ${groomName}
                    </h1>

                    <!-- Floral divider -->
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0"
                           style="margin:0 auto 32px;">
                      <tr>
                        <td style="width:60px;height:1px;background:#E7E0D8;"></td>
                        <td style="padding:0 10px;font-size:14px;color:#C94070;line-height:1;">&#10047;</td>
                        <td style="width:60px;height:1px;background:#E7E0D8;"></td>
                      </tr>
                    </table>

                    <!-- Personal greeting -->
                    <p style="margin:0 0 6px;
                               font-family:Georgia,'Times New Roman',serif;
                               font-size:19px;font-style:italic;
                               color:#44312B;">
                      Dear ${guestName},
                    </p>
                    <p style="margin:0 0 36px;
                               font-family:Arial,Helvetica,sans-serif;
                               font-size:15px;color:#78716C;
                               line-height:1.75;text-align:center;">
                      We joyfully request the honour of your presence<br />
                      to witness and celebrate our wedding day.
                    </p>

                  </td>
                </tr>
              </table>

              <!-- ── DATE + VENUE CARDS ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 48px 36px;">

                    <!-- Date card -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           style="background:#FDF8F4;border-radius:12px;
                                  border:1px solid #EDE8E0;margin-bottom:12px;">
                      <tr>
                        <!-- Day number accent -->
                        <td style="width:72px;background:linear-gradient(160deg,#C94070,#E8849A);
                                   border-radius:11px 0 0 11px;text-align:center;
                                   vertical-align:middle;padding:20px 0;">
                          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
                                     font-size:32px;font-weight:400;color:#FFFFFF;
                                     line-height:1;">
                            ${dayNumber}
                          </p>
                        </td>
                        <td style="padding:18px 24px;vertical-align:middle;">
                          <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;
                                     font-size:9px;font-weight:700;
                                     color:#B8A99A;letter-spacing:0.18em;text-transform:uppercase;">
                            Date
                          </p>
                          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
                                     font-size:17px;color:#1C1917;font-weight:400;line-height:1.3;">
                            ${formattedDate}
                          </p>
                          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;
                                     font-size:12px;color:#A8A29E;">
                            ${monthYear}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Venue card -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           style="background:#FDF8F4;border-radius:12px;
                                  border:1px solid #EDE8E0;">
                      <tr>
                        <!-- Pin accent -->
                        <td style="width:72px;background:#1C1917;
                                   border-radius:11px 0 0 11px;text-align:center;
                                   vertical-align:middle;padding:20px 0;">
                          <p style="margin:0;font-size:22px;line-height:1;">&#128205;</p>
                        </td>
                        <td style="padding:18px 24px;vertical-align:middle;">
                          <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;
                                     font-size:9px;font-weight:700;
                                     color:#B8A99A;letter-spacing:0.18em;text-transform:uppercase;">
                            Venue
                          </p>
                          <p style="margin:0 0 ${venueAddress ? '4px' : '0'};
                                     font-family:Georgia,'Times New Roman',serif;
                                     font-size:17px;color:#1C1917;font-weight:400;line-height:1.3;">
                            ${venueName}
                          </p>
                          ${venueAddress ? `
                          <p style="margin:0 0 ${googleMapsUrl ? '8px' : '0'};
                                     font-family:Arial,Helvetica,sans-serif;
                                     font-size:12px;color:#78716C;line-height:1.4;">
                            ${venueAddress}
                          </p>` : ''}
                          ${googleMapsUrl ? `
                          <a href="${googleMapsUrl}"
                             style="font-family:Arial,Helvetica,sans-serif;
                                    font-size:11px;font-weight:700;
                                    color:#C94070;text-decoration:none;
                                    letter-spacing:0.04em;text-transform:uppercase;">
                            View on Map &rarr;
                          </a>` : ''}
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- ── NOTE ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 48px 40px;text-align:center;">
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
                               font-size:15px;font-style:italic;
                               color:#78716C;line-height:1.7;">
                      &ldquo;We look forward to celebrating this beautiful moment with you.&rdquo;
                    </p>
                  </td>
                </tr>
              </table>

              <!-- ── CTA BUTTONS ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 48px 52px;text-align:center;">
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:10px;">
                          <a href="${calendarUrl}"
                             style="display:inline-block;
                                    padding:14px 26px;
                                    background:#C94070;
                                    color:#FFFFFF;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:13px;font-weight:700;
                                    text-decoration:none;
                                    border-radius:8px;
                                    letter-spacing:0.04em;
                                    text-transform:uppercase;">
                            &#128197;&nbsp; Save to Calendar
                          </a>
                        </td>
                        ${googleMapsUrl ? `
                        <td>
                          <a href="${googleMapsUrl}"
                             style="display:inline-block;
                                    padding:14px 26px;
                                    background:#FFFFFF;
                                    color:#1C1917;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:13px;font-weight:700;
                                    text-decoration:none;
                                    border-radius:8px;
                                    border:1.5px solid #E7E0D8;
                                    letter-spacing:0.04em;
                                    text-transform:uppercase;">
                            &#128205;&nbsp; Get Directions
                          </a>
                        </td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ── FOOTER ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background:#1C1917;">
                <tr>
                  <td style="padding:28px 48px;text-align:center;">
                    <p style="margin:0 0 6px;
                               font-family:Georgia,'Times New Roman',serif;
                               font-size:16px;color:#FFFFFF;
                               letter-spacing:0.04em;">
                      💍 NemiPlanner
                    </p>
                    <p style="margin:0 0 4px;
                               font-family:Arial,Helvetica,sans-serif;
                               font-size:11px;color:#78716C;line-height:1.6;">
                      Wedding planning, beautifully managed
                    </p>
                    <a href="https://nemiplanner.xyz"
                       style="font-family:Arial,Helvetica,sans-serif;
                              font-size:11px;color:#A8A29E;text-decoration:none;">
                      nemiplanner.xyz
                    </a>
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
