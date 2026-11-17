import type { Spec } from '@json-render/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { classifySource, fetchImage, MAX_IMAGE_BYTES, preloadImages, type ImageWarning } from '../src'

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
      {} as Spec,
      {},
      () => Promise.reject(new Error('no')),
      () => {},
    )
    expect(loaded.size).toBe(0)
  })
})
