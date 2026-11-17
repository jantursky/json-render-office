import { bullets, chart, paragraph, report, table } from '../lib/build'

export const status = report({
  title: 'Project status',
  subtitle: 'Website relaunch, sprint 8 of 12',
  author: 'Delivery lead',
  chapters: [
    {
      title: 'On track, one risk open',
      notes: 'Ask for a decision on the legal review before the end of the call.',
      blocks: [
        paragraph(
          'Seven of twelve sprints are done. Scope is stable and the budget is at 62% against 58% of time elapsed.',
        ),
      ],
    },
    {
      title: 'Burndown is close to plan',
      blocks: [
        chart(
          'line',
          'Open tasks per sprint',
          ['S4', 'S5', 'S6', 'S7', 'S8'],
          [
            { name: 'Plan', values: [96, 78, 60, 42, 24] },
            { name: 'Actual', values: [96, 81, 65, 47, 30] },
          ],
        ),
      ],
    },
    {
      title: 'Status by workstream',
      blocks: [
        table(
          ['Workstream', 'Status', 'Next step'],
          [
            ['Design system', 'Done', 'Handover to content'],
            ['Content migration', 'On track', 'Finish product pages'],
            ['Search', 'At risk', 'Decide on provider'],
            ['Legal review', 'Waiting', 'Chase sign-off'],
          ],
        ),
      ],
    },
    {
      title: 'Decisions needed',
      blocks: [
        bullets(
          ['Choose the search provider by Friday', 'Confirm the legal review date', 'Approve two extra QA days'],
          true,
        ),
      ],
    },
  ],
})
