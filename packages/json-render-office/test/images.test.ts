import type { Spec } from '@json-render/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { classifySource, fetchImage, MAX_IMAGE_BYTES, preloadImages, sniffImageSize, type ImageWarning } from '../src'

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
          r: { type: 'Box', props: {}, children: [] },
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
