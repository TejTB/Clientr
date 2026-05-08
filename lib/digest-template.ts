import type { ProspectResult } from "@/types/database";

export const DIGEST_SUBJECT = "3 new prospects for you this week, CLIENTR";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

function fitScoreColor(score: number): { bg: string; fg: string } {
  if (score >= 8) return { bg: "#1B3A2A", fg: "#7BE5A8" };
  if (score >= 6) return { bg: "#2E2A1B", fg: "#E8C77B" };
  return { bg: "#3A1B22", fg: "#F08D9F" };
}

function renderProspectCard(p: ProspectResult): string {
  const company = escapeHtml(p.company_name || "");
  const industry = escapeHtml(p.industry || "");
  const location = escapeHtml(p.location || "");
  const why = escapeHtml(p.fit_reason || "");
  const score = Math.max(1, Math.min(10, Math.round(Number(p.fit_score) || 5)));
  const { bg: scoreBg, fg: scoreFg } = fitScoreColor(score);

  const industryPill = industry
    ? `<span style="display:inline-block;background:#1A1A2A;color:#A8A8C8;font-size:11px;line-height:1;padding:6px 10px;border-radius:999px;margin-right:8px;">${industry}</span>`
    : "";
  const locationText = location
    ? `<span style="color:#8888A8;font-size:12px;">${location}</span>`
    : "";

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0F0F1A;border:1px solid #1F1F2E;border-radius:12px;margin:0 0 16px 0;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="vertical-align:top;">
                <div style="font-size:18px;font-weight:600;color:#F0F0FF;line-height:1.3;margin:0 0 8px 0;">${company}</div>
                <div style="margin:0 0 12px 0;">
                  ${industryPill}${locationText}
                </div>
              </td>
              <td style="vertical-align:top;text-align:right;width:60px;">
                <span style="display:inline-block;background:${scoreBg};color:${scoreFg};font-size:12px;font-weight:600;line-height:1;padding:6px 10px;border-radius:8px;">${score}/10</span>
              </td>
            </tr>
          </table>
          <div style="font-size:14px;color:#C8C8E0;line-height:1.55;margin:0;">${why}</div>
        </td>
      </tr>
    </table>
  `;
}

export function renderDigestHtml(opts: {
  prospects: ProspectResult[];
  icp: string;
  appUrl: string;
}): string {
  const { prospects, icp, appUrl } = opts;
  const top = prospects.slice(0, 3);
  const truncatedIcp = escapeHtml(truncate(icp, 80));
  const safeAppUrl = escapeHtml(appUrl);

  const cards = top.map(renderProspectCard).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(DIGEST_SUBJECT)}</title>
  </head>
  <body style="margin:0;padding:0;background:#08080F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#F0F0FF;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#08080F;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;">
            <tr>
              <td style="padding:0 0 24px 0;">
                <div style="font-size:22px;font-weight:700;letter-spacing:0.02em;color:#6366F1;line-height:1;">CLIENTR</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 24px 0;">
                <div style="font-size:16px;color:#C8C8E0;line-height:1.5;margin:0;">Here are 3 fresh prospects matching: &ldquo;${truncatedIcp}&rdquo;</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0;">
                ${cards}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 0 8px 0;">
                <a href="${safeAppUrl}/" style="display:inline-block;background:#6366F1;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;line-height:1;padding:14px 22px;border-radius:10px;">View in CLIENTR &rarr;</a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 0 0 0;">
                <div style="font-size:11px;color:#5A5A78;line-height:1.5;">You are receiving this because weekly digest is enabled on your CLIENTR profile.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
