import { bullets, chart, paragraph, report, table } from '../lib/build'

export const launch = report({
  title: 'Product launch plan',
  subtitle: 'Version 2.0 release',
  author: 'Product team',
  chapters: [
    {
      title: 'Launch in six weeks',
      notes: 'Stress that the date depends on the beta exit criteria.',
      blocks: [
        paragraph('Version 2.0 ships on 14 October. Beta feedback is positive and three blockers remain.'),
        bullets([
          'Beta with 40 customers',
          'Docs and migration guide ready by week 4',
          'Public announcement on launch day',
        ]),
      ],
    },
    {
      title: 'Who we are launching to',
      blocks: [
        chart(
          'doughnut',
          'Target segments',
          ['Existing customers', 'Trials', 'New leads'],
          [{ name: 'Share of launch audience', values: [55, 25, 20] }],
        ),
      ],
    },
    {
      title: 'Timeline',
      blocks: [
        table(
          ['Week', 'Milestone', 'Owner'],
          [
            ['1', 'Feature freeze', 'Engineering'],
            ['3', 'Beta exit review', 'Product'],
            ['5', 'Launch assets final', 'Marketing'],
            ['6', 'Release and announce', 'Everyone'],
          ],
        ),
      ],
    },
    {
      title: 'Risks we are tracking',
      blocks: [
        bullets([
          'Data migration time on large accounts',
          'Support readiness for the first week',
          'Pricing page sign-off',
        ]),
      ],
    },
  ],
})
