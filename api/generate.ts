import { defineCatalog } from '@json-render/core'
import { createTextStreamResponse, streamText, toTextStream } from 'ai'
import { schema, standardComponentDefinitions } from 'json-render-report/server'

const MAX_PROMPT_LENGTH = 500
const MAX_OUTPUT_TOKENS = 4000

const catalog = defineCatalog(schema, { components: standardComponentDefinitions })

const fail = (status: number, error: string): Response => Response.json({ error }, { status })

const readPrompt = async (request: Request): Promise<string | null> => {
  const body: unknown = await request.json().catch(() => null)
  if (typeof body !== 'object' || body === null || !('prompt' in body)) return null
  const { prompt } = body
  if (typeof prompt !== 'string') return null
  const trimmed = prompt.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_PROMPT_LENGTH ? trimmed : null
}

/** Streams the report spec as JSONL patches, the text format json-render's prompt asks the model for. */
export async function POST(request: Request): Promise<Response> {
  const model = process.env.LLM_MODEL
  if (!model) return fail(501, 'no-model')

  const prompt = await readPrompt(request)
  if (prompt === null) return fail(400, 'invalid-prompt')

  const result = streamText({
    model,
    instructions: catalog.prompt(),
    prompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: request.signal,
  })
  return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) })
}
