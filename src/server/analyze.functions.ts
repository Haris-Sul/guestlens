import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

export type Insight = { swahili: string; english: string };

export type AnalysisResult = {
  highlight: Insight;
  fix: Insight;
  opportunity: Insight;
  smsDraft: string;
  confidence: "High" | "Medium" | "Low";
};

export const analyzeFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: { review: string }) => {
    if (!data?.review || typeof data.review !== "string" || !data.review.trim()) {
      throw new Error("A review text is required.");
    }
    return { review: data.review.slice(0, 4000) };
  })
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this app.");

    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const openai = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const result = streamText({
      model: openai.responses("openai/gpt-6-astra"),
      maxRetries: 0,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
      prompt: `You are an assistant for rural tourism operators in Kenya. Analyze this guest review and respond with ONLY a JSON object (no markdown, no code fences) with this exact shape:
{
  "highlight": {"swahili": "...", "english": "..."},
  "fix": {"swahili": "...", "english": "..."},
  "opportunity": {"swahili": "...", "english": "..."},
  "smsDraft": "...",
  "confidence": "High" | "Medium" | "Low"
}
Rules:
- highlight = the single thing the guest loved most. fix = the most important thing to improve (if none, suggest a small polish). opportunity = one new revenue or experience idea inspired by the review.
- Each swahili field: one short natural Swahili sentence. Each english field: the faithful English translation of that same sentence.
- smsDraft: a short warm thank-you SMS in English (max 320 chars) addressed to the guest, mentioning a 10% discount code GUEST10 for their next visit.
- confidence: how confident you are in this analysis given the review length and clarity.
Review:
"""${data.review}"""`,
    });

    const text = (await result.text).trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The AI returned an unreadable response. Please try again.");
    const parsed = JSON.parse(match[0]) as AnalysisResult;
    if (!["High", "Medium", "Low"].includes(parsed.confidence)) parsed.confidence = "Medium";
    return parsed;
  });
