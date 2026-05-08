import type { ProspectResult } from "@/types/database";

const MIN_FIT_SCORE = 6;

function templateOutreach(companyName: string, industry: string): string {
  const niche = industry?.trim() || "your space";
  return `Hey ${companyName}! Love what you're building, your ${niche} content really stands out. I'm a web designer who works with brands like yours and I think there's a real opportunity to level up your online presence to match the quality of what you're putting out. Would you be open to a quick chat?`;
}

/**
 * Final-stage quality gate on Claude's prospect output.
 *  - drops prospects with empty company_name
 *  - drops prospects with fit_score below 6
 *  - fills missing outreach_copy with a fallback template (never returns a lead with empty outreach)
 *  - sorts by fit_score descending so best prospects show first
 */
export function applyQualityGate(prospects: ProspectResult[]): ProspectResult[] {
  const cleaned: ProspectResult[] = [];
  for (const p of prospects) {
    const name = (p.company_name ?? "").trim();
    if (!name) continue;
    const score = Number(p.fit_score);
    if (!Number.isFinite(score) || score < MIN_FIT_SCORE) continue;

    const rawOutreach = (p.outreach_copy ?? "").trim();
    const outreach = rawOutreach.length > 0
      ? rawOutreach
      : templateOutreach(name, p.industry ?? "");

    cleaned.push({
      ...p,
      company_name: name,
      outreach_copy: outreach,
      fit_score: Math.max(1, Math.min(10, Math.round(score)))
    });
  }
  cleaned.sort((a, b) => b.fit_score - a.fit_score);
  return cleaned;
}
