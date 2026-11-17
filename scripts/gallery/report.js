import { standardComponentDefinitions } from '../../packages/json-render-report/dist/server.js'
import { builder } from './tree.js'

const n = builder(standardComponentDefinitions)

const report = (...chapters) =>
  n('Report', { title: 'Quarterly review', subtitle: 'Q3 2026', author: 'Finance team' }, ...chapters)
const chapter = (title, ...blocks) => n('Chapter', { title }, ...blocks)

const quarters = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [{ name: 'Revenue', values: [4.1, 4.8, 5.6, 6.9] }],
}

const revenue = chapter(
  'Revenue grew 24%',
  n('Paragraph', { text: 'Growth came mostly from the enterprise tier.' }),
  n('BulletList', { items: ['Enterprise revenue up 31%', 'Churn down to 2.1%'] }),
)

/** The report that backs the one-spec page: a web page, a deck and a document from the same tree. */
export const oneSpec = (picture) =>
  report(
    revenue,
    chapter(
      'Where it came from',
      n('Chart', { type: 'bar', title: 'Revenue by quarter', ...quarters }),
      n('Table', {
        columns: ['Region', 'Revenue'],
        rows: [
          ['EMEA', '$4.2M'],
          ['Americas', '$6.8M'],
        ],
        striped: true,
      }),
    ),
    chapter('The launch site', n('Image', { src: picture, alt: 'A sun over two hills' })),
  )

/**
 * One spec per standard component of json-render-report. Each is drawn as the deck slide it becomes.
 */
export const reportCases = (picture) => [
  { name: 'Report', tree: report(revenue), pages: [1] },
  { name: 'Chapter', tree: report(revenue) },
  {
    name: 'Paragraph',
    tree: report(
      chapter(
        'Revenue grew 24%',
        n('Paragraph', {
          text: 'Growth came mostly from the enterprise tier. Churn fell for the third quarter in a row.',
        }),
      ),
    ),
  },
  {
    name: 'BulletList',
    tree: report(
      chapter(
        'Next steps',
        n('BulletList', { items: ['Ship the new checkout', 'Hire two engineers', 'Review pricing'], ordered: true }),
      ),
    ),
  },
  {
    name: 'Table',
    tree: report(
      chapter(
        'Revenue by region',
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
    tree: report(chapter('Revenue grew 24%', n('Chart', { type: 'bar', title: 'Revenue by quarter', ...quarters }))),
  },
  {
    name: 'Image',
    tree: report(chapter('The launch site', n('Image', { src: picture, alt: 'A sun over two hills' }))),
  },
]
