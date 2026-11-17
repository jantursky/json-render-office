import { standardComponentDefinitions } from '../../packages/json-render-docx/dist/server.js'
import { builder } from './tree.js'

const n = builder(standardComponentDefinitions)

const section = (props, ...children) => n('Section', props, ...children)
const documentOf = (...sections) =>
  n('Document', { title: 'Project report', author: 'Jane Doe', language: 'en-US' }, ...sections)
const doc = (props, ...children) => documentOf(section(props, ...children))
const para = (text, props = {}) => n('Paragraph', { text, ...props })

const lead = para(
  'Revenue grew in every quarter, mostly from the enterprise tier. Churn fell for the third quarter in a row.',
)

/** One spec per standard component of json-render-docx. `picture` is a data URI for the Image case. */
export const docxCases = (picture) => [
  {
    name: 'Document',
    tree: doc({}, n('Title', { text: 'Project report' }), para('Jane Doe  ·  Q3 2026'), lead),
    crop: 'trim',
  },
  {
    name: 'Section',
    tree: documentOf(
      section({ size: 'A4', orientation: 'portrait', margin: 1 }, n('Title', { text: 'Portrait, A4' }), lead),
      section(
        { size: 'Letter', orientation: 'landscape', margin: 0.5 },
        n('Title', { text: 'Landscape, Letter' }),
        lead,
      ),
    ),
    pages: [1, 2],
    tile: '2x1',
    crop: 'none',
  },
  {
    name: 'Header',
    tree: doc(
      {},
      n('Header', { text: 'Project report  ·  Confidential', align: 'right' }),
      n('Title', { text: 'Project report' }),
      lead,
    ),
    crop: 'top',
  },
  {
    name: 'Footer',
    tree: doc(
      {},
      n('Footer', { text: 'Confidential', pageNumbers: true, align: 'center' }),
      n('Title', { text: 'Project report' }),
      lead,
    ),
    crop: 'bottom',
  },
  { name: 'Title', tree: doc({}, n('Title', { text: 'Quarterly report' }), lead), crop: 'trim' },
  {
    name: 'Heading',
    tree: doc(
      {},
      n('Heading', { text: 'Results', level: 1 }),
      n('Heading', { text: 'Revenue', level: 2 }),
      n('Heading', { text: 'By region', level: 3 }),
      lead,
    ),
    crop: 'trim',
  },
  {
    name: 'Paragraph',
    tree: doc(
      {},
      lead,
      para('Forecasts assume no change in pricing.', { italic: true, align: 'justify' }),
      para('Figures are in US dollars.', { bold: true, color: '#E42B0C', fontSize: 12 }),
    ),
    crop: 'trim',
  },
  {
    name: 'List',
    tree: doc(
      {},
      n('List', {
        items: [
          'Faster checkout for returning customers',
          'Better search across all catalogs',
          'Fewer support tickets per order',
        ],
      }),
      n('List', {
        items: [
          'Ship the new checkout in the first quarter',
          'Hire two support engineers',
          'Review pricing before the renewals',
        ],
        ordered: true,
      }),
    ),
    crop: 'trim',
  },
  {
    name: 'Table',
    tree: doc(
      {},
      n('Table', {
        columns: ['Team', 'Owner', 'Status'],
        rows: [
          ['Checkout', 'Mira', 'On track'],
          ['Search', 'Tomas', 'At risk'],
          ['Billing', 'Jana', 'Done'],
        ],
        striped: true,
      }),
    ),
    crop: 'trim',
  },
  { name: 'Image', tree: doc({}, n('Image', { src: picture, alt: 'A sun over two hills', width: 4 })), crop: 'trim' },
  {
    name: 'PageBreak',
    tree: doc({}, para('The first page ends here.'), n('PageBreak'), para('The next element starts on a new page.')),
    pages: [1, 2],
    tile: '2x1',
    crop: 'none',
  },
  {
    name: 'TableOfContents',
    tree: doc(
      {},
      n('TableOfContents', { title: 'Contents', maxLevel: 2 }),
      n('Heading', { text: 'Results', level: 1 }),
      lead,
      n('Heading', { text: 'Revenue', level: 2 }),
      lead,
    ),
    crop: 'trim',
  },
]
