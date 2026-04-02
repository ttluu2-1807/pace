import { type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { anthropic, buildSystemPrompt } from "@/lib/claude"
import { getCoachContext } from "@/lib/db"

export async function POST(request: NextRequest) {
  // Verify API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Coach unavailable — configure API key" },
      { status: 503 }
    )
  }

  let body: { messages: Array<{ role: "user" | "assistant"; content: string }>; userId: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { messages, userId } = body

  if (!userId || !Array.isArray(messages)) {
    return Response.json({ error: "Missing userId or messages" }, { status: 400 })
  }

  // Verify the authenticated user matches the userId
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user || user.id !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
  } catch {
    return Response.json({ error: "Auth check failed" }, { status: 401 })
  }

  // Fetch coach context
  let context: Awaited<ReturnType<typeof getCoachContext>>
  try {
    context = await getCoachContext(userId)
  } catch {
    return Response.json({ error: "Failed to load coaching context" }, { status: 500 })
  }

  const systemPrompt = buildSystemPrompt(context, context.profile.coaching_voice)

  // Validate messages conform to what Anthropic expects
  const anthropicMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

  if (anthropicMessages.length === 0) {
    return Response.json({ error: "No valid messages" }, { status: 400 })
  }

  try {
    const stream = anthropic.messages.stream({
      model: "claude-haiku-3-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
                )
              )
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
          controller.close()
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Stream error"
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: errorMsg })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: `Claude API error: ${message}` }, { status: 500 })
  }
}
