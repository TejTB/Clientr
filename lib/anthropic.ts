import Anthropic from "@anthropic-ai/sdk";
import type { ProspectResult } from "@/types/database";

// Was claude-sonnet-4-20250514 (deprecated, retires 2026-06-15). Upgraded to current
// Sonnet 4.6.
const MODEL = "claude-sonnet-4-6";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[anthropic] ANTHROPIC_API_KEY is not set. Add it to .env.local."
    );
  }
  if (!apiKey.startsWith("sk-ant-")) {
    console.warn(
      `[anthropic] ANTHROPIC_API_KEY does not start with "sk-ant-" (got prefix "${apiKey.slice(0, 7)}..."). Check it is correct.`
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

function describeAnthropicError(err: unknown): Record<string, unknown> {
  if (err instanceof Anthropic.APIError) {
    return {
      kind: "Anthropic.APIError",
      name: err.name,
      status: err.status,
      type: (err as any).type,
      message: err.message,
      request_id: (err as any).request_id ?? (err as any).requestID,
      error: (err as any).error
    };
  }
  if (err instanceof Error) {
    return { kind: err.name, message: err.message, stack: err.stack };
  }
  return { kind: "unknown", value: String(err) };
}

export { describeAnthropicError };

function buildSearchSystemPrompt(icpQuery: string): string {
  return `You are a senior business development consultant specialising in finding growth opportunities for boutique creative agencies and freelance web designers.

Be concise. Each field must be under these limits:
- why_theyre_a_fit: 2 sentences max, 150 chars max
- why_now: 1 sentence max, 100 chars max
- outreach_copy: 3 sentences max, 200 chars max
- red_flags: 1 sentence max, 80 chars max
Total response must be under 3000 characters.

Your task: identify 5 real UK businesses that are genuinely underserved creatively and would benefit from working with a small, talented agency.

USER'S TARGET CLIENT PROFILE:
${icpQuery}

PROSPECT QUALITY RULES, read carefully:

IDEAL PROSPECTS (target these):
- Founder-led business, owner handles their own marketing
- Revenue roughly £50k to £800k per year, real business not a hobby
- Website clearly DIY: Squarespace template, basic Shopify theme, Wix site, or outdated WordPress with no clear design system
- Strong Instagram presence (5k to 35k followers) showing the brand has an audience but their web presence does not match
- Product or service quality is clearly good, they deserve better branding
- No evidence of recent professional redesign (check for agency credits, clean grid systems, motion design)
- Located in the UK

DISQUALIFY ANY PROSPECT THAT HAS:
- A professionally designed, modern website (clean typography, custom animations, clear brand system means an agency is already involved)
- Over 50k Instagram followers (too established, has in-house team)
- A nationally recognised brand name (Hoodrich, Gymshark, ASOS and similar)
- "Agency" or "Designer" in their LinkedIn team
- A recently launched site that looks polished
- A Shopify Plus store (signals serious investment in their stack)
- Fit score below 6, do not include, replace with a better prospect

SELF-CHECK BEFORE RETURNING:
For each prospect ask yourself:
1. Would a solo web designer have a realistic chance of landing this client? YES or NO
2. Does their website genuinely look like it needs help? YES or NO
3. Is this a real business I can verify exists? YES or NO
4. Does every field in this object refer to THIS specific company? YES or NO
If any answer is NO, remove the prospect and find a replacement.

OUTPUT FORMAT, return exactly this JSON, nothing else:
[
  {
    "company_name": "exact trading name",
    "industry": "specific niche in 3 words max",
    "location": "City, UK",
    "website": "https://fullurl.com",
    "instagram": "handle_without_at",
    "follower_range": "12k-18k",
    "website_platform": "Shopify | Squarespace | Wix | WordPress | Other",
    "why_theyre_a_fit": "Max 2 sentences, 150 chars. What is wrong with their site and why it costs them.",
    "why_now": "Max 1 sentence, 100 chars. The signal that makes this the RIGHT moment to reach out.",
    "outreach_copy": "Max 3 sentences, 200 chars total. Conversational DM. Reference ONE specific thing. Soft open question. Never mention price. No em-dashes. Never say 'I came across your brand'.",
    "fit_score": 7,
    "red_flags": "Max 1 sentence, 80 chars, or null if none"
  }
]

Return EXACTLY 5 prospects. All fit_score 6 or above.
Every prospect must pass all 4 self-check questions.
Return valid JSON only. No markdown. No preamble. No explanation.`;
}

function buildSearchUserPrompt(icpQuery: string): string {
  return `Find 5 prospects for: "${icpQuery}"`;
}

/**
 * Replace characters that frequently break JSON.parse when models slip:
 * smart quotes, em/en dashes, ellipsis, NBSP, and stray control chars
 * (everything except \t \n \r).
 */
function sanitizeForParse(text: string): string {
  return text
    .replace(/[‘’‚‛]/g, "'") // curly single quotes -> '
    .replace(/[“”„‟]/g, '"') // curly double quotes -> "
    .replace(/[–—―]/g, "-") // en/em/horizontal-bar dashes -> hyphen
    .replace(/…/g, "...") // horizontal ellipsis -> ...
    .replace(/ /g, " ") // non-breaking space -> space
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""); // control chars except \t \n \r
}

function stripFences(text: string): string {
  const t = text.trim();
  // ```json ... ``` or ``` ... ``` anywhere in the response
  return t.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();
}

/**
 * Try a sequence of increasingly forgiving extraction strategies.
 * Returns the parsed JSON array on first success.
 * Throws { code: "parse_failed", raw } if every strategy fails.
 */
function extractAndParse(rawText: string): unknown[] {
  const sanitized = sanitizeForParse(rawText);

  // Strategy 1: parse the response as-is
  try {
    const parsed = JSON.parse(sanitized);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }

  // Strategy 2: extract a JSON array via regex (greedy, [ ... ])
  const arrayMatch = sanitized.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through */
    }
  }

  // Strategy 3: strip ```json``` fences and try both direct + regex
  const fenced = stripFences(sanitized);
  if (fenced && fenced !== sanitized) {
    try {
      const parsed = JSON.parse(fenced);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through */
    }
    const fencedMatch = fenced.match(/\[[\s\S]*\]/);
    if (fencedMatch) {
      try {
        const parsed = JSON.parse(fencedMatch[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }
  }

  // All strategies exhausted. Throw with full raw payload attached.
  const err: any = new Error("parse_failed");
  err.code = "parse_failed";
  err.raw = rawText;
  throw err;
}

function coerceProspect(raw: any): ProspectResult | null {
  if (!raw || typeof raw !== "object") return null;
  const company_name =
    typeof raw.company_name === "string" ? raw.company_name.trim() : "";
  if (!company_name) return null;
  const fit_score = (() => {
    const n = Number(raw.fit_score);
    if (!Number.isFinite(n)) return 5;
    return Math.max(1, Math.min(10, Math.round(n)));
  })();
  return {
    company_name,
    industry: typeof raw.industry === "string" ? raw.industry : "",
    location: typeof raw.location === "string" ? raw.location : "",
    website: typeof raw.website === "string" ? raw.website : "",
    instagram: typeof raw.instagram === "string" ? raw.instagram : "",
    follower_range:
      typeof raw.follower_range === "string" ? raw.follower_range : "",
    website_platform:
      typeof raw.website_platform === "string" ? raw.website_platform : "",
    fit_reason:
      typeof raw.fit_reason === "string"
        ? raw.fit_reason
        : typeof raw.why_theyre_a_fit === "string"
          ? raw.why_theyre_a_fit
          : "",
    why_now: typeof raw.why_now === "string" ? raw.why_now : "",
    fit_score,
    red_flags: typeof raw.red_flags === "string" ? raw.red_flags : "",
    outreach_copy:
      typeof raw.outreach_copy === "string" ? raw.outreach_copy : ""
  };
}

export async function searchProspects(
  icpQuery: string
): Promise<ProspectResult[]> {
  const client = getAnthropic();

  const baseRequest: any = {
    model: MODEL,
    max_tokens: 4000,
    system: buildSearchSystemPrompt(icpQuery),
    messages: [
      { role: "user", content: buildSearchUserPrompt(icpQuery) }
    ]
  };

  let response: any;
  try {
    response = await client.messages.create(baseRequest);
  } catch (err) {
    console.error(
      "[anthropic.search] call failed. Error detail:",
      describeAnthropicError(err)
    );
    throw err;
  }

  const content: any[] = Array.isArray(response?.content) ? response.content : [];
  const combined = content
    .filter((b: any) => b && b.type === "text" && typeof b.text === "string")
    .map((b: any) => b.text as string)
    .join("\n")
    .trim();

  if (!combined) {
    const err: any = new Error("parse_failed");
    err.code = "parse_failed";
    err.raw = "";
    throw err;
  }

  // Robust multi-strategy parse. Logs full raw response on total failure.
  let parsed: unknown[];
  try {
    parsed = extractAndParse(combined);
  } catch (err: any) {
    console.error(
      "[anthropic.search] parse_failed. Raw Claude response (first 4000 chars):\n",
      typeof err?.raw === "string" ? err.raw.slice(0, 4000) : "(no raw)"
    );
    throw err;
  }

  const prospects: ProspectResult[] = [];
  for (const item of parsed) {
    const p = coerceProspect(item);
    if (p) prospects.push(p);
  }
  return prospects;
}

const FOLLOWUP_SYSTEM_PROMPT = `You write follow-up messages for creative agency outreach. Short, friendly, not pushy. 2 to 3 sentences. Reference the original message briefly. End with a soft question. Return only the message text, no preamble, no quotes around it. Never use em-dashes. Use commas or full stops instead.`;

function buildFollowupUserPrompt(companyName: string, originalOutreach: string): string {
  return `You previously sent this outreach to ${companyName}:

${originalOutreach}

They have not replied after 5 days. Write a short, friendly follow-up.`;
}

export async function generateFollowUp(
  companyName: string,
  originalOutreach: string
): Promise<string> {
  const client = getAnthropic();

  let response: any;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: FOLLOWUP_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildFollowupUserPrompt(companyName, originalOutreach) }
      ]
    });
  } catch (err) {
    console.error(
      "[anthropic.followup] call failed. Error detail:",
      describeAnthropicError(err)
    );
    throw err;
  }

  const content: any[] = Array.isArray(response?.content) ? response.content : [];
  const text = content
    .filter((b: any) => b && b.type === "text" && typeof b.text === "string")
    .map((b: any) => b.text as string)
    .join("\n")
    .trim();

  let cleaned = text;
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

export const ANTHROPIC_MODEL = MODEL;
