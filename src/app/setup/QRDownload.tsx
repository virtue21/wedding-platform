'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export default function QRDownload({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 2 })
    }
  }, [url])

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'wedding-qr.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-lg border border-stone-200" />
      <button
        onClick={download}
        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Download QR Code
      </button>
      <p className="text-xs text-stone-400 text-center">
        Share this on WhatsApp or print it for your guests
      </p>
    </div>
  )
}
