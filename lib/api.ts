import type { } from 'next'

// Local copy of the PropertyData interface shape used by the details page.
// Importing types from a client component can cause a client/server boundary issue,
// so we replicate the minimal shape here for mapping. Keep in sync with the page.
export interface PropertyData {
  id: string
  name: string
  address: string
  sleeps: number
  bathrooms: number
  bedrooms: number
  suburb: string
  price: string
  propertyType: string
  size: string
  yearBuilt: string
  parking: string
  description: string
  be_aware?: Array<{
    title: string
    description: string
  }> | string
  features: string[]
  amenities: string[]
  images: string[]
  attributes?: Array<{
    id: number
    name: string
    slug: string
    featured: number
  }>
  location: {
    latitude: number
    longitude: number
    mapUrl: string
  }
  contact: {
    agent: string
    phone: string
    email: string
    officeHours: string
  }
  property_url?: string
  three_dimensional_tour_url?: string
}

type LooseObject = Record<string, unknown>

// Client should call our own API route; no public defaults to upstream secrets
const DEFAULT_BASE_URL = '/api'
const DEFAULT_PROPERTY_ENDPOINT = '/properties'
const DEFAULT_EXPAND = 'images'

function getEnv(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

function buildApiUrl(propertyId: string): string {
  const baseUrl = getEnv('NEXT_PUBLIC_API_BASE_URL') || DEFAULT_BASE_URL
  const endpoint = getEnv('NEXT_PUBLIC_PROPERTY_ENDPOINT') || DEFAULT_PROPERTY_ENDPOINT
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const trimmedEndpoint = normalizedEndpoint.endsWith('/') ? normalizedEndpoint.slice(0, -1) : normalizedEndpoint
  const path = `${normalizedBase}${trimmedEndpoint}/${encodeURIComponent(propertyId)}`
  const expand = getEnv('NEXT_PUBLIC_PROPERTY_EXPAND') || DEFAULT_EXPAND

  // If absolute base URL, use URL to append params; if relative, return string with query
  if (/^https?:\/\//i.test(normalizedBase)) {
    const url = new URL(path)
    if (expand) url.searchParams.set('expand', expand)
    return url.toString()
  }
  return expand ? `${path}?expand=${encodeURIComponent(expand)}` : path
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/json' }
  // No Authorization header from client; server route injects it
  return headers
}

function toStringSafe(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function toNumberSafe(value: unknown, fallback = 0): number {
  const n = Number((value as number) ?? NaN)
  return Number.isFinite(n) ? n : fallback
}

function extractImages(raw: LooseObject): string[] {
  const anyRaw = raw as any
  const urls: string[] = []

  // Featured image first if available
  const featured = anyRaw?.featured_image?.image_url || anyRaw?.featured_image?.url
  if (typeof featured === 'string' && featured) urls.push(featured)

  const imgs = anyRaw?.images || anyRaw?.Images || anyRaw?.photos || anyRaw?.Photos || anyRaw?.gallery || anyRaw?.Gallery || anyRaw?.imageUrls || anyRaw?.image_urls
  if (Array.isArray(imgs)) {
    for (const item of imgs) {
      if (typeof item === 'string' && item) urls.push(item)
      else if (item && typeof item === 'object') {
        const u = item.image_url || item.url || item.URL || item.src || item.href || item.imageUrl || item.ImageUrl || item.photoUrl
        if (typeof u === 'string' && u) urls.push(u)
      }
    }
  }
  const image = anyRaw?.image || anyRaw?.Image || anyRaw?.coverImage
  if (typeof image === 'string' && image) urls.push(image)
  if (image && typeof image === 'object' && (image.url || image.src)) urls.push(image.url || image.src)
  return Array.from(new Set(urls))
}

function getFieldCI(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return undefined
  const lower = key.toLowerCase()
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      if (String(k).toLowerCase() === lower) return (obj as any)[k]
    }
  }
  return undefined
}

function getFirstField(obj: any, keys: string[]): any {
  for (const key of keys) {
    const val = getFieldCI(obj, key)
    if (val !== undefined && val !== null && val !== '') return val
  }
  return undefined
}

function mapToPropertyData(raw: LooseObject): PropertyData {
  const anyRaw = raw as any
  const location = anyRaw?.location || {}
  const suburbObjName = typeof anyRaw?.suburb === 'object' ? anyRaw?.suburb?.name : undefined
  const priceText = getFirstField(raw, ['price', 'rate']) || anyRaw?.price_category?.pricetext || anyRaw?.price_category?.fromtext || ''

  const idVal = getFirstField(raw, ['id', 'code', 'property_id', 'propertyId', 'PropertyID', 'PropertyCode', 'property_code'])
  const nameVal = getFirstField(raw, ['name', 'title', 'PropertyName', 'property_name'])
  const addressVal = getFirstField(raw, ['address', 'Address', 'address1', 'addressLine1', 'fullAddress'])
  const suburbVal = suburbObjName || getFirstField(raw, ['suburb', 'area', 'Area', 'neighborhood', 'city'])

  const addressText = toStringSafe(addressVal ?? location?.address ?? '')
  const lat = toNumberSafe(getFirstField(raw, ['latitude', 'lat']) ?? location?.lat ?? location?.latitude, 0)
  const lng = toNumberSafe(getFirstField(raw, ['longitude', 'lng']) ?? location?.lng ?? location?.longitude, 0)
  const mapUrlExisting = toStringSafe(getFirstField(raw, ['mapUrl']) ?? location?.mapUrl ?? '')
  const mapUrlFinal = mapUrlExisting || (lat && lng
    ? `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : (addressText ? `https://www.google.com/maps?q=${encodeURIComponent(addressText)}&z=15&output=embed` : ''))

  return {
    id: toStringSafe(idVal ?? '') || 'UNKNOWN',
    name: toStringSafe(nameVal ?? 'Property'),
    address: addressText,
    sleeps: toNumberSafe(getFirstField(raw, ['sleeps', 'guests']), 0),
    bathrooms: toNumberSafe(getFirstField(raw, ['bathrooms', 'baths']), 0),
    bedrooms: toNumberSafe(getFirstField(raw, ['bedrooms', 'beds']), 0),
    suburb: toStringSafe(suburbVal ?? ''),
    price: toStringSafe(priceText),
    propertyType: toStringSafe(getFirstField(raw, ['propertyType', 'type']) ?? ''),
    size: toStringSafe(getFirstField(raw, ['size', 'areaSize']) ?? ''),
    yearBuilt: toStringSafe(getFirstField(raw, ['yearBuilt', 'year']) ?? ''),
    parking: toStringSafe(getFirstField(raw, ['parking']) ?? ''),
    description: toStringSafe(getFirstField(raw, ['description', 'details']) ?? ''),
    be_aware: (() => {
      const beAwareField = getFirstField(raw, ['be_aware', 'beAware', 'important_note', 'importantNote'])
      if (Array.isArray(beAwareField)) {
        return beAwareField.map(item => ({
          title: toStringSafe(item.title || item.name || ''),
          description: toStringSafe(item.description || item.text || '')
        }))
      }
      return toStringSafe(beAwareField ?? '')
    })(),
    features: Array.isArray((raw as any)?.features) ? (raw as any).features : [],
    amenities: Array.isArray((raw as any)?.amenities) ? (raw as any).amenities : [],
    attributes: Array.isArray((raw as any)?.attributes) ? (raw as any).attributes : undefined,
    images: extractImages(raw),
    location: {
      latitude: lat,
      longitude: lng,
      mapUrl: mapUrlFinal
    },
    contact: {
      agent: toStringSafe(getFirstField((raw as any)?.contact || raw, ['agent'])),
      phone: toStringSafe(getFirstField((raw as any)?.contact || raw, ['phone'])),
      email: toStringSafe(getFirstField((raw as any)?.contact || raw, ['email'])),
      officeHours: toStringSafe(getFirstField((raw as any)?.contact || raw, ['officeHours']))
    },
    property_url: toStringSafe(getFirstField(raw, ['property_url', 'propertyUrl', 'website_url', 'websiteUrl', 'url', 'link'])),
    three_dimensional_tour_url: toStringSafe(getFirstField(raw, ['three_dimensional_tour_url', 'threeDVirtualTourUrl', 'threeDVirtualTourUrl']))
  }
}

export async function fetchPropertyById(propertyId: string): Promise<PropertyData | null> {
  const url = buildApiUrl(propertyId)
  const headers = buildHeaders()
  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) return null
  const data = (await res.json()) as LooseObject
  const candidate = (data as any)?.data || (data as any)?.property || data
  return mapToPropertyData(candidate as LooseObject)
}

// Expose the fully-resolved request URL for debugging/logging purposes
export function getPropertyRequestUrl(propertyId: string): string {
  return buildApiUrl(propertyId)
}


