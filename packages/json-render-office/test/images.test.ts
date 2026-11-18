import type { Spec } from '@json-render/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  classifySource,
  fetchImage,
  hasImageSignature,
  isPrivateHost,
  MAX_IMAGE_BYTES,
  preloadImages,
  sniffImageSize,
  type ImageWarning,
} from '../src'

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

afterEach(() => vi.unstubAllGlobals())

describe('classifySource', () => {
  it.each([
    [PNG, 'data'],
    ['https://example.com/a.png', 'https'],
    ['http://example.com/a.png', 'blocked'],
    ['/etc/passwd', 'blocked'],
    ['file:///etc/passwd', 'blocked'],
    ['data:text/html;base64,PGI+', 'blocked'],
    ['', 'blocked'],
  ])('%s is %s', (src, kind) => {
    expect(classifySource(src)).toBe(kind)
  })
})

const response = (body: Uint8Array, type: string, status = 200): Response =>
  new Response(body as BodyInit, { status, headers: { 'content-type': type } })

describe('fetchImage', () => {
  it('returns a data URI for a small image', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(response(new Uint8Array([1, 2, 3]), 'image/png')))
    await expect(fetchImage('https://x.test/a.png')).resolves.toBe('data:image/png;base64,AQID')
  })

  it('rejects a 404', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(response(new Uint8Array(), 'text/html', 404)))
    await expect(fetchImage('https://x.test/a.png')).rejects.toThrow('HTTP 404')
  })

  it('rejects other content types', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(response(new Uint8Array([1]), 'text/html')))
    await expect(fetchImage('https://x.test/a.png')).rejects.toThrow('Unsupported content type')
  })

  it('rejects an image over the size cap', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(response(new Uint8Array(MAX_IMAGE_BYTES + 1), 'image/png')))
    await expect(fetchImage('https://x.test/a.png')).rejects.toThrow('larger than 10 MB')
  })
})

describe('fetchImage limits', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47])

  it('passes a timeout signal', async () => {
    const init = vi.fn((_url: URL, _init?: RequestInit) => Promise.resolve(response(png, 'image/png')))
    vi.stubGlobal('fetch', init)
    await fetchImage('https://x.test/a.png')
    expect(init.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it.each([
    'http://x.test/a.png',
    'https://localhost/a.png',
    'https://127.0.0.1/a.png',
    'https://169.254.169.254/x',
    'https://[::1]/a.png',
  ])('refuses %s without a request', async (src) => {
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    await expect(fetchImage(src)).rejects.toThrow()
    expect(request).not.toHaveBeenCalled()
  })

  it('follows a redirect to another public https URL', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', (url: URL) => {
      calls.push(url.href)
      return Promise.resolve(
        calls.length === 1
          ? new Response(null, { status: 302, headers: { location: 'https://cdn.test/real.png' } })
          : response(png, 'image/png'),
      )
    })
    await expect(fetchImage('https://x.test/a.png')).resolves.toMatch(/^data:image\/png;base64,/)
    expect(calls).toEqual(['https://x.test/a.png', 'https://cdn.test/real.png'])
  })

  it('refuses a redirect to a private address or to http', async () => {
    for (const location of ['https://10.0.0.5/internal.png', 'http://x.test/a.png']) {
      const request = vi.fn(() => Promise.resolve(new Response(null, { status: 301, headers: { location } })))
      vi.stubGlobal('fetch', request)
      await expect(fetchImage('https://x.test/a.png')).rejects.toThrow()
      expect(request).toHaveBeenCalledTimes(1)
    }
  })

  it('gives up after three redirects', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(new Response(null, { status: 302, headers: { location: 'https://x.test/again.png' } })),
    )
    await expect(fetchImage('https://x.test/a.png')).rejects.toThrow('Too many redirects')
  })

  it('refuses a declared length over the cap before reading the body', async () => {
    const read = vi.fn()
    const big = new Response(new ReadableStream({ pull: read }, { highWaterMark: 0 }), {
      headers: { 'content-type': 'image/png', 'content-length': String(MAX_IMAGE_BYTES + 1) },
    })
    vi.stubGlobal('fetch', () => Promise.resolve(big))
    await expect(fetchImage('https://x.test/a.png')).rejects.toThrow('larger than 10 MB')
    expect(read).not.toHaveBeenCalled()
  })

  it('stops reading a streamed body that grows past the cap', async () => {
    let sent = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 1024 * 1024
        controller.enqueue(new Uint8Array(1024 * 1024))
        if (sent > MAX_IMAGE_BYTES * 3) controller.close()
      },
    })
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(body, { headers: { 'content-type': 'image/png' } })))
    await expect(fetchImage('https://x.test/a.png')).rejects.toThrow('larger than 10 MB')
    expect(sent).toBeLessThan(MAX_IMAGE_BYTES * 3)
  })
})

describe('isPrivateHost', () => {
  it.each([
    'localhost',
    'app.localhost',
    'printer.local',
    'db.internal',
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    '[::1]',
    'fd00::1',
    'fe80::1',
    '::ffff:10.0.0.1',
  ])('%s is private', (host) => {
    expect(isPrivateHost(host)).toBe(true)
  })

  it.each(['example.com', '8.8.8.8', '172.32.0.1', '172.15.0.1', '100.63.0.1', '2606:4700::1111'])(
    '%s is public',
    (host) => {
      expect(isPrivateHost(host)).toBe(false)
    },
  )
})

describe('hasImageSignature', () => {
  const b64 = (type: string, bytes: number[]): string =>
    `data:image/${type};base64,${btoa(String.fromCharCode(...bytes))}`

  it('accepts bytes that match the declared type', () => {
    expect(hasImageSignature(PNG)).toBe(true)
    expect(hasImageSignature(b64('jpeg', [0xff, 0xd8, 0xff, 0xe0]))).toBe(true)
    expect(hasImageSignature(b64('gif', [0x47, 0x49, 0x46, 0x38, 0x39]))).toBe(true)
    expect(
      hasImageSignature(
        b64(
          'svg+xml',
          Array.from('<svg xmlns="x"/>', (c) => c.charCodeAt(0)),
        ),
      ),
    ).toBe(true)
  })

  it('rejects bytes that do not', () => {
    expect(hasImageSignature(b64('png', [1, 2, 3]))).toBe(false)
    expect(hasImageSignature(b64('jpeg', [0x89, 0x50, 0x4e, 0x47]))).toBe(false)
    expect(
      hasImageSignature(
        b64(
          'svg+xml',
          Array.from('<html>', (c) => c.charCodeAt(0)),
        ),
      ),
    ).toBe(false)
    expect(hasImageSignature('data:image/png;base64,@@@')).toBe(false)
    expect(hasImageSignature('data:image/webp;base64,AAAA')).toBe(false)
  })
})

describe('preloadImages', () => {
  const spec = (src: unknown): Spec => ({
    root: 'a',
    elements: { a: { type: 'Image', props: { src, alt: '' }, children: [] } },
  })

  it('loads each distinct source once and reports blocked and failed ones', async () => {
    const warnings: ImageWarning[] = []
    const seen: string[] = []
    const loaded = await preloadImages(
      {
        root: 'r',
        elements: {
          r: { type: 'Box', props: {}, children: ['a', 'b', 'c', 'd'] },
          a: { type: 'Image', props: { src: 'https://x.test/1.png' }, children: [] },
          b: { type: 'Image', props: { src: 'https://x.test/1.png' }, children: [] },
          c: { type: 'Image', props: { src: '/etc/passwd' }, children: [] },
          d: { type: 'Image', props: { src: 'https://x.test/bad.png' }, children: [] },
        },
      },
      {},
      (src) => {
        seen.push(src)
        return src.endsWith('bad.png') ? Promise.reject(new Error('boom')) : Promise.resolve(PNG)
      },
      (w) => warnings.push(w),
    )
    expect([...loaded.keys()]).toEqual(['https://x.test/1.png'])
    expect(seen.sort()).toEqual(['https://x.test/1.png', 'https://x.test/bad.png'])
    expect(warnings.map((w) => w.blocked).sort()).toEqual([false, true])
  })

  it('rejects a loader that returns something other than a data image', async () => {
    const warnings: ImageWarning[] = []
    const loaded = await preloadImages(
      spec('https://x.test/a.png'),
      {},
      () => Promise.resolve('/etc/passwd'),
      (w) => warnings.push(w),
    )
    expect(loaded.size).toBe(0)
    expect(warnings).toHaveLength(1)
  })

  it('reads sources that come from state', async () => {
    const loaded = await preloadImages(
      spec({ $state: '/pic' }),
      { pic: PNG },
      () => Promise.reject(new Error('no')),
      () => {},
    )
    expect([...loaded.keys()]).toEqual([PNG])
  })
})

describe('preloadImages scope', () => {
  const never = () => Promise.reject(new Error('no'))

  it('loads images inside a repeat, once per item', async () => {
    const spec: Spec = {
      root: 'list',
      elements: {
        list: { type: 'Box', props: {}, children: ['pic'], repeat: { statePath: '/items' } },
        pic: { type: 'Image', props: { src: { $item: 'url' } }, children: [] },
      },
    }
    const loaded = await preloadImages(spec, { items: [{ url: PNG }, { url: PNG }] }, never, () => {})
    expect([...loaded.keys()]).toEqual([PNG])
  })

  it('does not hang on a cycle, and ignores a repeat over something that is not a list', async () => {
    const cycle: Spec = {
      root: 'a',
      elements: {
        a: { type: 'Box', props: {}, children: ['a', 'pic'] },
        pic: { type: 'Image', props: { src: PNG }, children: [] },
      },
    }
    expect((await preloadImages(cycle, {}, never, () => {})).size).toBe(1)
    const text: Spec = {
      root: 'a',
      elements: {
        a: { type: 'Box', props: {}, children: ['pic'], repeat: { statePath: '/x' } },
        pic: { type: 'Image', props: { src: PNG }, children: [] },
      },
    }
    expect((await preloadImages(text, { x: 'abc' }, never, () => {})).size).toBe(0)
  })

  it('refuses images past the limit of 50', async () => {
    const elements: Spec['elements'] = { r: { type: 'Box', props: {}, children: [] } }
    for (let i = 0; i < 52; i++) {
      elements[`i${i}`] = { type: 'Image', props: { src: `https://x.test/${i}.png` }, children: [] }
      elements.r?.children?.push(`i${i}`)
    }
    const warnings: ImageWarning[] = []
    const loaded = await preloadImages(
      { root: 'r', elements },
      {},
      () => Promise.resolve(PNG),
      (w) => warnings.push(w),
    )
    expect(loaded.size).toBe(50)
    expect(warnings.filter((w) => w.blocked)).toHaveLength(2)
  })

  it('refuses data that is not the image it claims to be', async () => {
    const warnings: ImageWarning[] = []
    const fake = 'data:image/png;base64,AQID'
    const loaded = await preloadImages(
      { root: 'a', elements: { a: { type: 'Image', props: { src: fake }, children: [] } } },
      {},
      never,
      (w) => warnings.push(w),
    )
    expect(loaded.size).toBe(0)
    expect(warnings[0]?.message).toContain('not the image type')
  })
})

describe('preloadImages on a spec that has not started streaming', () => {
  it('loads nothing', async () => {
    const loaded = await preloadImages(
      {},
      {},
      () => Promise.reject(new Error('no')),
      () => {},
    )
    expect(loaded.size).toBe(0)
  })
})

describe('sniffImageSize', () => {
  const b64 = (bytes: number[]): string => `data:image/x;base64,${btoa(String.fromCharCode(...bytes))}`

  it('reads a PNG', () => {
    expect(sniffImageSize(PNG)).toEqual({ width: 1, height: 1 })
  })

  it('reads a GIF', () => {
    const gif = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x40, 0x01, 0xf0, 0x00]
    expect(sniffImageSize(b64(gif))).toEqual({ width: 320, height: 240 })
  })

  it('reads a JPEG past its other segments', () => {
    const jpeg = [
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0xc8, 0x01, 0x2c, 0x03,
    ]
    expect(sniffImageSize(b64(jpeg))).toEqual({ width: 300, height: 200 })
  })

  it('gives up on SVG, broken data and a JPEG without a frame', () => {
    expect(sniffImageSize(b64([0x3c, 0x73, 0x76, 0x67]))).toBeUndefined()
    expect(sniffImageSize('data:image/png;base64,@@@')).toBeUndefined()
    expect(sniffImageSize(b64([0xff, 0xd8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))).toBeUndefined()
  })
})
