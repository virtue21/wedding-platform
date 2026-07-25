import crypto from 'crypto'

/**
 * Minimal Google Drive client using the service account in
 * GOOGLE_SERVICE_ACCOUNT_KEY (full JSON). No SDK dependency —
 * we sign the JWT ourselves and call the Drive REST API.
 */

type ServiceAccountKey = { client_email: string; private_key: string }

let cachedToken: { token: string; expiresAt: number } | null = null

function getKey(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set')
  return JSON.parse(raw)
}

function b64url(data: object | Buffer): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data))
  return buf.toString('base64url')
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }
  const key = getKey()
  const now = Math.floor(Date.now() / 1000)
  const input = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`
  const signature = crypto.createSign('RSA-SHA256').update(input).sign(key.private_key).toString('base64url')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${input}.${signature}`,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Google token exchange failed: ${JSON.stringify(data)}`)
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

/** Create a Drive folder; returns its id and web link. */
export async function createFolder(name: string): Promise<{ id: string; url: string }> {
  const token = await getAccessToken()
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Drive folder create failed: ${JSON.stringify(data)}`)
  return { id: data.id, url: data.webViewLink ?? `https://drive.google.com/drive/folders/${data.id}` }
}

/** Share a file/folder with an email as writer; Google emails them the link. */
export async function shareWithEmail(fileId: string, email: string): Promise<void> {
  const token = await getAccessToken()
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=true`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'writer', type: 'user', emailAddress: email }),
    }
  )
  if (!res.ok) throw new Error(`Drive share failed: ${JSON.stringify(await res.json())}`)
}

/** Download an image from a URL and upload it into a Drive folder. */
export async function uploadFromUrl(sourceUrl: string, fileName: string, folderId: string): Promise<string> {
  const token = await getAccessToken()
  const imgRes = await fetch(sourceUrl)
  if (!imgRes.ok) throw new Error(`Could not fetch source image (${imgRes.status})`)
  const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg'
  const bytes = Buffer.from(await imgRes.arrayBuffer())

  const boundary = `nemi${crypto.randomBytes(8).toString('hex')}`
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] })
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    ),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ])

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`Drive upload failed: ${JSON.stringify(data)}`)
  return data.id
}
