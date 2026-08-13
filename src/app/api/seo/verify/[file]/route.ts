import { NextResponse } from 'next/server'
import { getSiteSeo, googleVerificationFileName } from '@/lib/siteSeo'

function normalizeFile(value: string) {
  return decodeURIComponent(value).replace(/^\/+/, '').trim()
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  const requested = normalizeFile(file)
  if (!/^google[\w-]+\.html$/i.test(requested)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const seo = await getSiteSeo()
  const configured = googleVerificationFileName(seo)
  const token = seo.googleSearchConsoleHtmlToken || seo.googleSearchConsoleId

  if (!token || (configured && configured.toLowerCase() !== requested.toLowerCase())) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return new NextResponse(`google-site-verification: ${token}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
