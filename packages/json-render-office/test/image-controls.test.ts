import type { Spec } from '@json-render/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createImageLoader,
  fetchImage,
  IMAGE_TIMEOUT_MS,
  MAX_IMAGE_BYTES,
  preloadImages,
  type ImageWarning,
} from '../src'

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
const response = (body: Uint8Array, type = 'image/png'): Response =>
  new Response(body as BodyInit, { headers: { 'content-type': type } })

const imageSpec = (...srcs: string[]): Spec => ({
  root: 'r',
  elements: {
    r: { type: 'Box', props: {}, children: srcs.map((_, i) => `i${i}`) },
    ...Object.fromEntries(srcs.map((src, i) => [`i${i}`, { type: 'Image', props: { src, alt: '' }, children: [] }])),
  },
})

afterEach(() => vi.unstubAllGlobals())

describe('defaults', () => {
  it('keep the 1.0.1 timeout and size cap', () => {
    expect(IMAGE_TIMEOUT_MS).toBe(10_000)
    expect(MAX_IMAGE_BYTES).toBe(10 * 1024 * 1024)
  })

  it('createImageLoader() with no options behaves like fetchImage', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(response(png)))
    await expect(createImageLoader()('https://x.test/a.png')).resolves.toBe(await fetchImage('https://x.test/a.png'))
  })
})

describe('timeoutMs and signal', () => {
  // A fetch that never answers on its own and rejects when its signal aborts, as real fetch does.
  const hanging = (_url: URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error(String(init.signal?.reason))))
    })

  it('gives up on a slow image at timeoutMs', async () => {
    vi.stubGlobal('fetch', hanging)
    await expect(createImageLoader({ timeoutMs: 20 })('https://x.test/a.png')).rejects.toThrow()
  })

  it('stops a pending load when the caller aborts', async () => {
    vi.stubGlobal('fetch', hanging)
    const controller = new AbortController()
    const pending = createImageLoader({ signal: controller.signal })('https://x.test/a.png')
    controller.abort(new Error('stop'))
    await expect(pending).rejects.toThrow('stop')
  })

  it('rejects the whole preload with the abort reason, not a warning', async () => {
    const controller = new AbortController()
    const warnings: ImageWarning[] = []
    const load = () => {
      controller.abort(new Error('user left'))
      return Promise.resolve(PNG)
    }
    await expect(
      preloadImages(imageSpec('https://x.test/1.png', 'https://x.test/2.png'), {}, load, (w) => warnings.push(w), {
        signal: controller.signal,
        concurrency: 1,
      }),
    ).rejects.toThrow('user left')
    expect(warnings).toHaveLength(0)
  })
})

describe('concurrency', () => {
  it('never runs more loads at once than the limit', async () => {
    const srcs = Array.from({ length: 20 }, (_, i) => `https://x.test/${i}.png`)
    let inFlight = 0
    let peak = 0
    const load = async () => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await new Promise((done) => setTimeout(done, 5))
      inFlight -= 1
      return PNG
    }
    const loaded = await preloadImages(imageSpec(...srcs), {}, load, () => {}, { concurrency: 4 })
    expect(loaded.size).toBe(20)
    expect(peak).toBe(4)
  })

  it('defaults to six at a time', async () => {
    const srcs = Array.from({ length: 20 }, (_, i) => `https://x.test/${i}.png`)
    let inFlight = 0
    let peak = 0
    const load = async () => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await new Promise((done) => setTimeout(done, 5))
      inFlight -= 1
      return PNG
    }
    await preloadImages(imageSpec(...srcs), {}, load, () => {})
    expect(peak).toBe(6)
  })
})

describe('maxBytes', () => {
  it('blocks a streamed image over the caller cap', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(response(new Uint8Array(11))))
    await expect(createImageLoader({ maxBytes: 10 })('https://x.test/a.png')).rejects.toThrow('larger than')
  })

  it('reports an over-cap image as blocked-image', async () => {
    const warnings: ImageWarning[] = []
    const big = `data:image/png;base64,${'A'.repeat(200)}`
    await preloadImages(
      imageSpec('https://x.test/a.png'),
      {},
      () => Promise.resolve(big),
      (w) => warnings.push(w),
      {
        maxBytes: 10,
      },
    )
    expect(warnings).toEqual([expect.objectContaining({ blocked: true })])
  })
})

describe('allowedHosts', () => {
  it('skips a host outside the list without fetching it', async () => {
    const load = vi.fn(() => Promise.resolve(PNG))
    const warnings: ImageWarning[] = []
    const loaded = await preloadImages(
      imageSpec('https://other.example.org/a.png'),
      {},
      load,
      (w) => warnings.push(w),
      { allowedHosts: ['cdn.example.com'] },
    )
    expect(loaded.size).toBe(0)
    expect(load).not.toHaveBeenCalled()
    expect(warnings).toEqual([expect.objectContaining({ blocked: true })])
  })

  it('matches host names case-insensitively', async () => {
    const loaded = await preloadImages(
      imageSpec('https://CDN.example.com/a.png'),
      {},
      () => Promise.resolve(PNG),
      () => {},
      {
        allowedHosts: ['cdn.example.com'],
      },
    )
    expect(loaded.size).toBe(1)
  })

  it('refuses a redirect to a host outside the list', async () => {
    const request = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 302, headers: { location: 'https://evil.test/a.png' } })),
    )
    vi.stubGlobal('fetch', request)
    await expect(createImageLoader({ allowedHosts: ['x.test'] })('https://x.test/a.png')).rejects.toThrow(
      'not in the allowed list',
    )
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('refuses a browser-hidden redirect when a host list is set', async () => {
    const hidden = Object.defineProperty(new Response(null, { status: 200 }), 'type', { value: 'opaqueredirect' })
    vi.stubGlobal('fetch', () => Promise.resolve(hidden))
    await expect(createImageLoader({ allowedHosts: ['x.test'] })('https://x.test/a.png')).rejects.toThrow(
      'cannot be checked',
    )
  })
})
