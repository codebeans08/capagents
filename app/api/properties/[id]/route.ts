import { NextResponse } from 'next/server'

const DEFAULT_BASE_URL = ''
const DEFAULT_ENDPOINT = ''
const DEFAULT_EXPAND = ''

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id
    const baseUrl = process.env.CAPSOLS_API_BASE_URL
    const endpoint = process.env.CAPSOLS_PROPERTY_ENDPOINT
    const expand = process.env.CAPSOLS_PROPERTY_EXPAND
    const token = process.env.CAPSOLS_API_TOKEN

    if (!token || !baseUrl || !endpoint) {
      return NextResponse.json({ error: 'Server API is not fully configured' }, { status: 500 })
    }

    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const trimmedEndpoint = normalizedEndpoint.endsWith('/')
      ? normalizedEndpoint.slice(0, -1)
      : normalizedEndpoint

    const url = new URL(`${normalizedBase}${trimmedEndpoint}/${encodeURIComponent(propertyId)}`)
    if (expand) url.searchParams.set('expand', expand)

    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Avoid caching for freshest data
      cache: 'no-store',
    })

    const body = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json'
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 })
  }
}


