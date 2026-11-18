import { JSONUIProvider, Renderer } from '@json-render/vue'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp } from 'vue'
import { describe, expect, it } from 'vitest'

import { themeStyle, webRegistry } from '../src/web'
import { reportSpec } from './helpers'

const html = (spec = reportSpec()) =>
  renderToString(
    createSSRApp({
      render: () =>
        h(JSONUIProvider, { registry: webRegistry }, { default: () => h(Renderer, { spec, registry: webRegistry }) }),
    }),
  )

describe('web registry', () => {
  it('renders the report as HTML', async () => {
    const out = await html()
    expect(out).toContain('<h1>Quarterly review</h1>')
    expect(out.match(/<h2>/g)).toHaveLength(2)
    expect(out).toContain('<table class="jr-striped">')
    expect(out).toContain('<li>Enterprise up 31%</li>')
    expect(out).toContain('alt="A pixel"')
  })

  it('draws a chart as SVG with a legend', async () => {
    const out = await html()
    expect(out).toContain('<svg')
    expect(out.match(/<rect/g)).toHaveLength(3)
    expect(out).toContain('Revenue by quarter')
  })

  it('renders a half-streamed spec without throwing', async () => {
    const spec = reportSpec()
    delete spec.elements.c2
    await expect(html(spec)).resolves.toContain('Revenue grew 24%')
  })
})

describe('themeStyle', () => {
  it('turns the theme into CSS custom properties', () => {
    const style = themeStyle({ colors: { accent: '#00FF00' }, palette: ['#111111'] }) as Record<string, string>
    expect(style['--jr-accent']).toBe('#00FF00')
    expect(style['--jr-series-0']).toBe('#111111')
    expect(style['--jr-font-body']).toContain('Calibri')
  })

  it('drops image sources the Office renderers refuse', async () => {
    const spec = reportSpec()
    const image = Object.values(spec.elements).find((e) => e.type === 'Image')!
    for (const src of ['http://169.254.169.254/x', '/etc/passwd', 'file:///etc/hosts']) {
      image.props.src = src
      expect(await html(spec)).not.toContain(src)
    }
    image.props.src = 'https://example.com/a.png'
    expect(await html(spec)).toContain('src="https://example.com/a.png"')
  })

  it('cycles a short palette over the series colours', () => {
    const style = themeStyle({ palette: ['#111111', '#222222'] })
    expect(style['--jr-series-0']).toBe('#111111')
    expect(style['--jr-series-3']).toBe('#222222')
    expect(style['--jr-series-11']).toBe('#222222')
  })
})
