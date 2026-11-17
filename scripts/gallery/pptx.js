import { standardComponentDefinitions } from '../../packages/json-render-pptx/dist/server.js'
import { builder } from './tree.js'

const n = builder(standardComponentDefinitions)

const deck = (...slides) => n('Deck', { title: 'Quarterly review', author: 'Finance team' }, ...slides)
const slide = (props, ...children) => n('Slide', props, ...children)
const title = (text) => n('Title', { text })

const bullets = n('BulletList', {
  items: ['Enterprise revenue up 31%', 'Churn down to 2.1%', 'Two new regions launched'],
})

const quarters = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: 'Revenue', values: [4.1, 4.8, 5.6, 6.9] },
    { name: 'Cost', values: [3.2, 3.5, 3.9, 4.4] },
  ],
}

const chart = (type) =>
  slide(
    { slideNumber: true },
    title('Revenue grew 24%'),
    n('Chart', { type, title: 'Revenue by quarter', ...quarters, legend: true }),
  )

/** One spec per standard component of json-render-pptx. `picture` is a data URI for the Image case. */
export const pptxCases = (picture) => {
  const cover = slide(
    { layout: 'title' },
    title('Quarterly review'),
    n('Subtitle', { text: 'Q3 2026 business review' }),
  )
  const content = slide({ slideNumber: true }, title('What changed'), bullets)
  return [
    { name: 'Deck', tree: deck(cover, content) },
    {
      name: 'Slide',
      tree: deck(
        cover,
        content,
        slide({ layout: 'section' }, title('Regions'), n('Subtitle', { text: 'Where the growth came from' })),
        slide(
          { layout: 'blank', background: '#F5F5F5' },
          n('Text', { text: 'A blank slide: no padding, your own background.', align: 'center' }),
        ),
      ),
      tile: '2x2',
      pages: [1, 2, 3, 4],
    },
    {
      name: 'Columns',
      tree: deck(
        slide(
          {},
          title('Two ways to grow'),
          n(
            'Columns',
            { gap: 0.4 },
            n(
              'Column',
              {},
              n('Subtitle', { text: 'Upsell' }),
              n('Text', { text: 'Move existing customers to the enterprise tier.' }),
            ),
            n(
              'Column',
              {},
              n('Subtitle', { text: 'Expand' }),
              n('Text', { text: 'Open new regions with the current product.' }),
            ),
          ),
        ),
      ),
    },
    {
      name: 'Column',
      tree: deck(
        slide(
          {},
          title('Three priorities'),
          n(
            'Columns',
            {},
            n(
              'Column',
              {},
              n('Subtitle', { text: 'Speed' }),
              n('BulletList', { items: ['Faster checkout', 'Lighter pages'] }),
            ),
            n(
              'Column',
              {},
              n('Subtitle', { text: 'Reach' }),
              n('BulletList', { items: ['Two new regions', 'Local payments'] }),
            ),
            n(
              'Column',
              {},
              n('Subtitle', { text: 'Trust' }),
              n('BulletList', { items: ['Audit logs', 'SSO for all plans'] }),
            ),
          ),
        ),
      ),
    },
    {
      name: 'Title',
      tree: deck(
        slide(
          {},
          title('Revenue grew 24% year over year'),
          n('Text', { text: 'Growth came mostly from the enterprise tier.' }),
        ),
      ),
    },
    { name: 'Subtitle', tree: deck(cover) },
    {
      name: 'Text',
      tree: deck(
        slide(
          {},
          title('Summary'),
          n('Text', { text: 'Growth came mostly from the enterprise tier.' }),
          n('Text', { text: 'Churn fell for the third quarter in a row.', bold: true }),
          n('Text', { text: 'Forecasts assume no change in pricing.', italic: true, fontSize: 14 }),
        ),
      ),
    },
    {
      name: 'BulletList',
      tree: deck(
        slide(
          {},
          title('Next steps'),
          n('BulletList', {
            items: ['Ship the new checkout', 'Hire two support engineers', 'Review pricing in Q1'],
            ordered: true,
          }),
        ),
      ),
    },
    {
      name: 'Table',
      tree: deck(
        slide(
          {},
          title('Revenue by region'),
          n('Table', {
            columns: ['Region', 'Revenue', 'Growth'],
            rows: [
              ['EMEA', '$4.2M', '+18%'],
              ['Americas', '$6.8M', '+27%'],
              ['APAC', '$2.9M', '+31%'],
            ],
            striped: true,
          }),
        ),
      ),
    },
    {
      name: 'Chart',
      tree: deck(chart('bar'), chart('line'), chart('pie'), chart('doughnut')),
      tile: '2x2',
      pages: [1, 2, 3, 4],
    },
    {
      name: 'Image',
      tree: deck(slide({}, title('Launch site'), n('Image', { src: picture, alt: 'A sun over two hills' }))),
    },
  ]
}
