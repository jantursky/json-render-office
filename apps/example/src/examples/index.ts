import type { Spec } from '@json-render/core'

import { launch } from './launch'
import { quarterly } from './quarterly'
import { status } from './status'

export interface FixedExample {
  id: string
  label: string
  spec: Spec
}

export const fixedExamples: FixedExample[] = [
  { id: 'quarterly', label: 'Quarterly review', spec: quarterly },
  { id: 'launch', label: 'Product launch plan', spec: launch },
  { id: 'status', label: 'Project status', spec: status },
]

export { launch, quarterly, status }
