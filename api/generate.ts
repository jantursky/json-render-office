import { defineCatalog } from '@json-render/core'
import { google } from '@ai-sdk/google'
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

/**
 * With GOOGLE_GENERATIVE_AI_API_KEY set, LLM_MODEL is a Google model id such as "gemini-3.5-flash-lite"
 * and is called directly. Otherwise it is "provider/model" and goes through the AI Gateway.
 */
const pickModel = (name: string) => (process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(name) : name)

/** Streams the report spec as JSONL patches, the text format json-render's prompt asks the model for. */
export async function POST(request: Request): Promise<Response> {
  const model = process.env.LLM_MODEL
  if (!model) return fail(501, 'no-model')

  const prompt = await readPrompt(request)
  if (prompt === null) return fail(400, 'invalid-prompt')

  const result = streamText({
    model: pickModel(model),
    instructions: catalog.prompt(),
    prompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: request.signal,
  })

  // A failed model call ends the stream before any text, or throws on the first read. Answer with an
  // error then, instead of a 200 with an empty body.
  const reader = toTextStream({ stream: result.stream }).getReader()
  let first: ReadableStreamReadResult<string>
  try {
    first = await reader.read()
  } catch (error) {
    console.error(error)
    return fail(502, 'model-failed')
  }
  if (first.done) return fail(502, 'model-failed')

  const stream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue(first.value)
    },
    async pull(controller) {
      const next = await reader.read()
      if (next.done) controller.close()
      else controller.enqueue(next.value)
    },
    cancel: (reason: unknown) => reader.cancel(reason),
  })
  return createTextStreamResponse({ stream })
}
