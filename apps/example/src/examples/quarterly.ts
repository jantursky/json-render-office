import { bullets, chart, paragraph, report, table } from '../lib/build'

export const quarterly = report({
  title: 'Quarterly business review',
  subtitle: 'Q3 2026',
  author: 'Finance team',
  chapters: [
    {
      title: 'Revenue grew 24%',
      notes: 'Open with the headline number, then credit the enterprise tier.',
      blocks: [
        paragraph('Revenue reached $18.4M, driven mostly by enterprise renewals and two large new accounts.'),
        chart(
          'bar',
          'Revenue by quarter ($M)',
          ['Q4 25', 'Q1 26', 'Q2 26', 'Q3 26'],
          [{ name: 'Revenue', values: [14.1, 14.9, 16.2, 18.4] }],
        ),
      ],
    },
    {
      title: 'Enterprise leads every region',
      blocks: [
        table(
          ['Region', 'Revenue', 'Growth'],
          [
            ['Americas', '$8.9M', '+27%'],
            ['EMEA', '$6.1M', '+22%'],
            ['APAC', '$3.4M', '+18%'],
          ],
        ),
      ],
    },
    {
      title: 'Costs stayed flat',
      blocks: [
        bullets([
          'Headcount unchanged at 212',
          'Cloud spend down 6% after the migration',
          'Support cost per ticket down 11%',
        ]),
      ],
    },
    {
      title: 'Next quarter priorities',
      blocks: [
        bullets(
          ['Close the three open enterprise deals', 'Launch the self-serve plan', 'Hire two solutions engineers'],
          true,
        ),
      ],
    },
  ],
})
