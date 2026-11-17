import type { Spec } from '@json-render/core'
import { resolveElementProps } from '@json-render/core'

/** Turns an image source into a `data:` URI. Replace it to add auth, a proxy or a host allowlist. */
export type ImageLoader = (src: string) => Promise<string>

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const IMAGE_TIMEOUT_MS = 10_000
/** More distinct images than this in one spec are refused, so a spec cannot start unlimited fetches. */
export const MAX_IMAGES = 50

const DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|svg\+xml);base64,[a-z0-9+/=\s]+$/i

export type SourceKind = 'data' | 'https' | 'blocked'

/** Only data URIs and https URLs are ever read. Paths, file:, http: and everything else are blocked. */
export function classifySource(src: string): SourceKind {
  if (DATA_IMAGE.test(src)) return 'data'
  if (/^https:\/\//i.test(src)) return 'https'
  return 'blocked'
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

async function readCapped(response: Response): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length'))
  if (declared > MAX_IMAGE_BYTES) throw new Error('Image is larger than 10 MB')
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array(await response.arrayBuffer())
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel()
      throw new Error('Image is larger than 10 MB')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let at = 0
  for (const chunk of chunks) {
    bytes.set(chunk, at)
    at += chunk.length
  }
  return bytes
}

/**
 * Fetches an https image with a timeout, a status check, a type check and a size cap that is
 * enforced while the body streams. A redirect to anything but https is refused. It does not block
 * private network addresses: pass a `loadImage` with a host allowlist when specs are untrusted.
 */
export const fetchImage: ImageLoader = async (src) => {
  const response = await fetch(src, { signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) })
  if (response.url && !/^https:\/\//i.test(response.url)) throw new Error('Redirected away from https')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const type = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
  if (!/^image\/(png|jpe?g|gif|svg\+xml)$/.test(type)) throw new Error(`Unsupported content type "${type}"`)
  return `data:${type};base64,${toBase64(await readCapped(response))}`
}

export interface ImageWarning {
  src: string
  blocked: boolean
  message: string
}

/**
 * Loads every `Image` source in a spec before rendering, because the writer reads sources
 * itself and would otherwise fetch URLs and read local paths without these limits.
 * Returns the usable ones by their original source.
 */
export async function preloadImages(
  spec: Partial<Spec>,
  state: Record<string, unknown>,
  load: ImageLoader,
  warn: (w: ImageWarning) => void,
): Promise<Map<string, string>> {
  const sources = new Set<string>()
  for (const element of Object.values(spec.elements ?? {})) {
    if (element.type !== 'Image') continue
    try {
      const props = resolveElementProps(element.props, { stateModel: state })
      if (typeof props.src === 'string') sources.add(props.src)
    } catch {
      // The walker reports unusable props; nothing to load here.
    }
  }

  const loaded = new Map<string, string>()
  const wanted = [...sources]
  for (const src of wanted.slice(MAX_IMAGES)) {
    warn({ src, blocked: true, message: `A spec may use at most ${MAX_IMAGES} different images.` })
  }
  await Promise.all(
    wanted.slice(0, MAX_IMAGES).map(async (src) => {
      if (classifySource(src) === 'blocked') {
        warn({ src, blocked: true, message: 'Only https URLs and data: images are allowed.' })
        return
      }
      try {
        const data = classifySource(src) === 'data' ? src : await load(src)
        if (classifySource(data) !== 'data') throw new Error('The loader must return a data: image')
        if (data.length > MAX_IMAGE_BYTES * 1.4) throw new Error('Image is larger than 10 MB')
        loaded.set(src, data)
      } catch (error) {
        warn({ src, blocked: false, message: error instanceof Error ? error.message : 'Could not load the image.' })
      }
    }),
  )
  return loaded
}

export interface ImageSize {
  width: number
  height: number
}

const bytesOf = (dataUri: string): Uint8Array => {
  const binary = atob(dataUri.slice(dataUri.indexOf(',') + 1).replace(/\s/g, ''))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

const be16 = (b: Uint8Array, at: number): number => ((b[at] ?? 0) << 8) | (b[at + 1] ?? 0)
const le16 = (b: Uint8Array, at: number): number => (b[at] ?? 0) | ((b[at + 1] ?? 0) << 8)
const be32 = (b: Uint8Array, at: number): number => be16(b, at) * 65536 + be16(b, at + 2)

function jpegSize(b: Uint8Array): ImageSize | undefined {
  let at = 2
  while (at + 9 < b.length) {
    if (b[at] !== 0xff) return undefined
    const marker = b[at + 1] ?? 0
    // Start-of-frame markers carry the size; 0xC4, 0xC8 and 0xCC share the range but do not.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: be16(b, at + 5), width: be16(b, at + 7) }
    }
    at += 2 + be16(b, at + 2)
  }
  return undefined
}

/** The pixel size of a PNG, JPEG or GIF data URI, so a slide can keep the aspect ratio. SVG gives undefined. */
export function sniffImageSize(dataUri: string): ImageSize | undefined {
  let bytes: Uint8Array
  try {
    bytes = bytesOf(dataUri)
  } catch {
    return undefined
  }
  const size =
    bytes[0] === 0x89 && bytes[1] === 0x50
      ? { width: be32(bytes, 16), height: be32(bytes, 20) }
      : bytes[0] === 0x47 && bytes[1] === 0x49
        ? { width: le16(bytes, 6), height: le16(bytes, 8) }
        : bytes[0] === 0xff && bytes[1] === 0xd8
          ? jpegSize(bytes)
          : undefined
  return size && size.width > 0 && size.height > 0 ? size : undefined
}
