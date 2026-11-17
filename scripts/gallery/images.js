import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { promisify } from 'node:util'

const run = promisify(execFile)
const magick = (...args) => run('magick', args)

export const MAX_BYTES = 150 * 1024

/** A picture for the Image components: a sun over two hills, as a PNG data URI. */
export async function samplePicture() {
  const { stdout } = await run(
    'magick',
    [
      ...['-size', '800x450', 'gradient:#364153-#f5f5f5'],
      ...['-fill', '#e42b0c', '-draw', 'circle 600,140 600,80'],
      ...['-fill', '#101828', '-draw', 'polygon 0,450 0,330 220,190 470,450'],
      ...['-fill', '#4a5565', '-draw', 'polygon 250,450 520,260 800,360 800,450'],
      'png:-',
    ],
    { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 },
  )
  return `data:image/png;base64,${stdout.toString('base64')}`
}

/** Cuts a page down: `trim` to its content, `top` or `bottom` to a third of the page, `none` as is. */
export async function crop(file, mode) {
  if (mode === 'trim') await magick(file, '-trim', '+repage', '-bordercolor', 'white', '-border', '16', file)
  else if (mode === 'top') await magick(file, '-gravity', 'North', '-crop', '100%x30%+0+0', '+repage', file)
  else if (mode === 'bottom') await magick(file, '-gravity', 'South', '-crop', '100%x30%+0+0', '+repage', file)
  else if (mode !== 'none') throw new Error(`Unknown crop mode "${mode}".`)
}

/** Writes one PNG: a single page as is, or several pages in a grid with a hairline around each. */
export async function compose(pages, tile, target) {
  if (pages.length === 1) {
    await magick(pages[0], '-strip', '-colors', '256', `PNG8:${target}`)
  } else {
    await magick(
      'montage',
      ...pages.flatMap((page) => ['(', page, '-bordercolor', '#d4d4d4', '-border', '1', ')']),
      ...['-tile', tile, '-geometry', '+8+8', '-background', 'white'],
      ...['-strip', '-colors', '256', `PNG8:${target}`],
    )
  }
  const { size } = await stat(target)
  if (size > MAX_BYTES) throw new Error(`${target} is ${Math.round(size / 1024)} KB, over the 150 KB limit.`)
  const { stdout } = await magick('identify', '-format', '%w %h', target)
  const [width, height] = stdout.split(' ').map(Number)
  return { bytes: size, width, height }
}
