import type { Spec } from '@json-render/core'
import { validateProps as validate, type PropsIssue } from 'json-render-office'

import { standardComponentDefinitions } from './catalog'

export type { PropsIssue }

/** Checks every element's props against its standard component's Zod schema (limits included). */
export const validateProps = (spec: Spec): PropsIssue[] => validate(spec, standardComponentDefinitions)
