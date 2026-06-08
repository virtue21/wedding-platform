import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')
const svgBuffer = readFileSync(resolve(publicDir, 'icon.svg'))

const sizes = [
  { name: 'favicon-16x16.png',       size: 16 },
  { name: 'favicon-32x32.png',       size: 32 },
  { name: 'apple-touch-icon.png',    size: 180 },
  { name: 'android-chrome-192.png',  size: 192 },
  { name: 'android-chrome-512.png',  size: 512 },
]

for (const { name, size } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, name))
  console.log(`✓ ${name} (${size}x${size})`)
}

// Build favicon.ico as a 32x32 PNG renamed (browsers accept PNG-in-ICO)
// For a proper multi-size ICO, we create a simple ICO from the 32x32 PNG
const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer()
const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer()

// Write a proper ICO file (contains 16x16 + 32x32)
function buildIco(images) {
  // ICO header: reserved(2) + type(2) + count(2)
  const count = images.length
  const headerSize = 6
  const dirEntrySize = 16
  const dirSize = count * dirEntrySize
  let offset = headerSize + dirSize

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)     // reserved
  header.writeUInt16LE(1, 2)     // type: 1 = ICO
  header.writeUInt16LE(count, 4) // count

  const dirEntries = []
  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize)
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0)  // width
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1)  // height
    entry.writeUInt8(0, 2)        // color count
    entry.writeUInt8(0, 3)        // reserved
    entry.writeUInt16LE(1, 4)     // color planes
    entry.writeUInt16LE(32, 6)    // bits per pixel
    entry.writeUInt32LE(img.data.length, 8)  // size of image data
    entry.writeUInt32LE(offset, 12)           // offset of image data
    offset += img.data.length
    dirEntries.push(entry)
  }

  return Buffer.concat([header, ...dirEntries, ...images.map(i => i.data)])
}

const ico = buildIco([
  { size: 16, data: png16 },
  { size: 32, data: png32 },
])
writeFileSync(resolve(publicDir, 'favicon.ico'), ico)
console.log('✓ favicon.ico (16x16 + 32x32)')
console.log('\nAll favicons generated successfully!')
