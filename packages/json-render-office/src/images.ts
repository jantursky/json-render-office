import type { Spec } from '@json-render/core'
import {
  getByPath,
  resolveElementProps,
  resolveRepeatItemStatePath,
  resolveRepeatStatePath,
  type PropResolutionContext,
} from '@json-render/core'

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

/** A source the loader refuses on purpose. Reported as `blocked-image`, not as a failed load. */
export class ImageBlockedError extends Error {}

/** Options for the built-in loader and for the image step of a render. */
export interface ImageLoadOptions {
  /** Milliseconds before the built-in loader gives up on one image. Default 10000. */
  timeoutMs?: number
  /** Aborting it stops pending loads and rejects the render. */
  signal?: AbortSignal
  /** Images fetched at the same time. Default 6. */
  concurrency?: number
  /** Byte cap per image. Default 10 MB. */
  maxBytes?: number
  /** Host names (case-insensitive) that remote images may come from. Unset allows any public host. */
  allowedHosts?: readonly string[]
}

const sizeMessage = (maxBytes: number): string => `Image is larger than ${maxBytes / (1024 * 1024)} MB`

async function readCapped(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length'))
  if (declared > maxBytes) throw new ImageBlockedError(sizeMessage(maxBytes))
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array(await response.arrayBuffer())
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > maxBytes) {
      await reader.cancel()
      throw new ImageBlockedError(sizeMessage(maxBytes))
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

const MAX_REDIRECTS = 3

/** True for loopback, private, link-local and internal host names and addresses, written as literals. */
export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true
  }
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (v4) {
    const [a = 0, b = 0] = v4.slice(1).map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    )
  }
  if (host.includes(':')) {
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(host)
    if (mapped?.[1]) return isPrivateHost(mapped[1])
    return host === '::' || host === '::1' || /^f[cd]/.test(host) || /^fe[89ab]/.test(host)
  }
  return false
}

function assertPublicHttps(url: URL): void {
  if (url.protocol !== 'https:') throw new Error('Only https URLs are loaded')
  if (isPrivateHost(url.hostname)) throw new Error('Private network addresses are not loaded')
}

/**
 * Builds the built-in loader: an https fetch with a timeout, a status check, a type check and a size
 * cap enforced while the body streams. Redirects are followed by hand, up to three, and every hop must
 * be https, must not name a private address written as a literal and, when `allowedHosts` is set, must
 * be on the list. A host name that resolves to a private address is not caught: pass a `loadImage`
 * with its own resolution when specs are untrusted. When `allowedHosts` is set and the runtime hides
 * a redirect (browsers), the load is refused, because the target cannot be checked.
 */
export function createImageLoader(options: ImageLoadOptions = {}): ImageLoader {
  const { timeoutMs = IMAGE_TIMEOUT_MS, signal: caller, maxBytes = MAX_IMAGE_BYTES, allowedHosts } = options
  const allowed = allowedHosts?.map((host) => host.toLowerCase())
  return async (src) => {
    const timeout = AbortSignal.timeout(timeoutMs)
    const signal = caller ? AbortSignal.any([timeout, caller]) : timeout
    let url = new URL(src)
    let response: Response | undefined
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      assertPublicHttps(url)
      if (allowed && !allowed.includes(url.hostname.toLowerCase())) {
        throw new ImageBlockedError('The image host is not in the allowed list.')
      }
      response = await fetch(url, { signal, redirect: 'manual' })
      // A browser hides the target of a manual redirect. Follow it only when no host list has to be checked.
      if (response.type === 'opaqueredirect') {
        if (allowed) throw new ImageBlockedError('Redirects cannot be checked in this runtime.')
        response = await fetch(url, { signal })
        break
      }
      const location = response.headers.get('location')
      if (response.status < 300 || response.status >= 400 || !location) break
      if (hop === MAX_REDIRECTS) throw new Error('Too many redirects')
      url = new URL(location, url)
    }
    if (!response) throw new Error('No response')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const type = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
    if (!/^image\/(png|jpe?g|gif|svg\+xml)$/.test(type)) throw new Error(`Unsupported content type "${type}"`)
    return `data:${type};base64,${toBase64(await readCapped(response, maxBytes))}`
  }
}

/** The built-in loader with default limits. */
export const fetchImage: ImageLoader = createImageLoader()

export interface ImageWarning {
  src: string
  blocked: boolean
  message: string
}

/**
 * The source of every `Image` the walker can reach, resolved the way the walker resolves it: inside a
 * `repeat` once per item. Visibility is not evaluated, so a hidden image is still loaded.
 */
function collectImageSources(spec: Partial<Spec>, state: Record<string, unknown>): Set<string> {
  const sources = new Set<string>()
  const elements = spec.elements ?? {}

  const visit = (key: string, scope: PropResolutionContext, path: ReadonlySet<string>): void => {
    if (path.has(key) || !Object.hasOwn(elements, key)) return
    const element = elements[key]
    if (!element) return
    if (element.type === 'Image') {
      try {
        const props = resolveElementProps(element.props, scope)
        if (typeof props.src === 'string') sources.add(props.src)
      } catch {
        // The walker reports unusable props; nothing to load here.
      }
    }
    const next = new Set(path).add(key)
    const keys = element.children ?? []
    if (!element.repeat) {
      for (const child of keys) visit(child, scope, next)
      return
    }
    const statePath = resolveRepeatStatePath(element.repeat.statePath, scope.repeatBasePath)
    if (statePath === undefined) return
    const items: unknown = getByPath(state, statePath)
    if (!Array.isArray(items)) return
    items.forEach((item: unknown, index) => {
      const inner: PropResolutionContext = {
        stateModel: state,
        repeatItem: item,
        repeatIndex: index,
        repeatBasePath: resolveRepeatItemStatePath(statePath, index),
      }
      for (const child of keys) visit(child, inner, next)
    })
  }

  if (spec.root) visit(spec.root, { stateModel: state }, new Set())
  return sources
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
  options: ImageLoadOptions = {},
): Promise<Map<string, string>> {
  const { concurrency = 6, signal, maxBytes = MAX_IMAGE_BYTES, allowedHosts } = options
  const allowed = allowedHosts?.map((host) => host.toLowerCase())
  const sources = collectImageSources(spec, state)

  const loaded = new Map<string, string>()
  const wanted = [...sources]
  for (const src of wanted.slice(MAX_IMAGES)) {
    warn({ src, blocked: true, message: `A spec may use at most ${MAX_IMAGES} different images.` })
  }
  const accepted = wanted.slice(0, MAX_IMAGES)

  const loadOne = async (src: string): Promise<void> => {
    if (classifySource(src) === 'blocked') {
      warn({ src, blocked: true, message: 'Only https URLs and data: images are allowed.' })
      return
    }
    try {
      if (allowed && classifySource(src) === 'https' && !allowed.includes(new URL(src).hostname.toLowerCase())) {
        throw new ImageBlockedError('The image host is not in the allowed list.')
      }
      const data = classifySource(src) === 'data' ? src : await load(src)
      if (classifySource(data) !== 'data') throw new Error('The loader must return a data: image')
      if (data.length > maxBytes * 1.4) throw new ImageBlockedError(sizeMessage(maxBytes))
      if (!hasImageSignature(data)) throw new Error('The data is not the image type it claims to be')
      loaded.set(src, data)
    } catch (error) {
      // A caller abort is not a bad image: it ends the whole render.
      if (signal?.aborted) throw signal.reason
      warn({
        src,
        blocked: error instanceof ImageBlockedError,
        message: error instanceof Error ? error.message : 'Could not load the image.',
      })
    }
  }

  // A small worker pool: at most `concurrency` loads run at once, and the pool stops taking work after an abort.
  let next = 0
  const worker = async (): Promise<void> => {
    for (;;) {
      signal?.throwIfAborted()
      const src = accepted[next++]
      if (src === undefined) return
      await loadOne(src)
    }
  }
  const workers = Math.min(Math.max(1, concurrency), accepted.length)
  await Promise.all(Array.from({ length: workers }, worker))
  return loaded
}

/** Whether the bytes of a data URI start the way its declared image type says they do. */
export function hasImageSignature(dataUri: string): boolean {
  const type = /^data:image\/([a-z0-9+]+);/i.exec(dataUri)?.[1]?.toLowerCase()
  let bytes: Uint8Array
  try {
    bytes = bytesOf(dataUri)
  } catch {
    return false
  }
  const starts = (...signature: number[]): boolean => signature.every((byte, at) => bytes[at] === byte)
  switch (type) {
    case 'png':
      return starts(0x89, 0x50, 0x4e, 0x47)
    case 'jpg':
    case 'jpeg':
      return starts(0xff, 0xd8, 0xff)
    case 'gif':
      return starts(0x47, 0x49, 0x46, 0x38)
    case 'svg+xml':
      return /^\s*(<\?xml|<svg|<!--|<!doctype svg)/i.test(new TextDecoder().decode(bytes.subarray(0, 256)))
    default:
      return false
  }
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
