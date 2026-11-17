import type { Spec } from '@json-render/core'
import { resolveElementProps } from '@json-render/core'

/** Turns an image source into a `data:` URI. Replace it to add auth, a proxy or a host allowlist. */
export type ImageLoader = (src: string) => Promise<string>

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const IMAGE_TIMEOUT_MS = 10_000

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

/** Fetches an https image with a timeout, a status check, a type check and a size cap. */
export const fetchImage: ImageLoader = async (src) => {
  const response = await fetch(src, { signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const type = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
  if (!/^image\/(png|jpe?g|gif|svg\+xml)$/.test(type)) throw new Error(`Unsupported content type "${type}"`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('Image is larger than 10 MB')
  return `data:${type};base64,${toBase64(bytes)}`
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
  spec: Spec,
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
  await Promise.all(
    [...sources].map(async (src) => {
      if (classifySource(src) === 'blocked') {
        warn({ src, blocked: true, message: 'Only https URLs and data: images are allowed.' })
        return
      }
      try {
        const data = classifySource(src) === 'data' ? src : await load(src)
        if (classifySource(data) !== 'data') throw new Error('The loader must return a data: image')
        loaded.set(src, data)
      } catch (error) {
        warn({ src, blocked: false, message: error instanceof Error ? error.message : 'Could not load the image.' })
      }
    }),
  )
  return loaded
}
