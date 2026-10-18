// The login-code email, in Hypernet's own clothes: the grey Windows 2000 frame, ink on paper, Tahoma, the square
// mark, the code large. Table layout and inline styles only, no images and no web fonts, so Gmail, Apple Mail and
// Outlook all draw the same thing. Used by app/api/hooks/neon-auth (Neon Auth's send.otp webhook) and rendered to
// docs/email/login-code.html by scripts/render-email.mjs.
//
// Plain TypeScript with erasable syntax only, so Node can run it directly (the preview script) and Next can bundle it.

export type LoginCodeEmail = { subject: string; html: string; text: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FACE = "#d4d0c8", PAPER = "#f8f7f3", INK = "#141414", DIM = "#5a5a5a", WHITE = "#ffffff", SHADOW = "#808080", DARK = "#404040", BAR = "#262626";
const SYS = "Tahoma, 'Segoe UI', Verdana, Geneva, sans-serif";

export function loginCodeEmail(code: string, opts: { minutes?: number; kind?: string } = {}): LoginCodeEmail {
  const minutes = opts.minutes ?? 5;
  const verify = opts.kind === "email-verification";
  const digits = String(code).replace(/\D/g, "");
  const spaced = digits.length === 6 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
  const line = verify ? `Your code to confirm this email on HYPERNET · GLOBAL. It works for ${minutes} minutes.`
                      : `Your code to log in to HYPERNET · GLOBAL. It works for ${minutes} minutes.`;
  const subject = `${digits} is your HYPERNET · GLOBAL code`;
  const text = `${line}\n\n    ${spaced}\n\nIf you didn't ask for it, ignore this email: nobody can log in without the code.\n\nHYPERNET · GLOBAL — find the events your people are going to.`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${FACE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(spaced)} — ${esc(line)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FACE}" style="background:${FACE};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="440" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:440px;background:${FACE};
    border-top:1px solid ${WHITE};border-left:1px solid ${WHITE};border-right:1px solid ${DARK};border-bottom:1px solid ${DARK};">
    <tr><td style="padding:2px;border-top:1px solid ${FACE};border-left:1px solid ${FACE};border-right:1px solid ${SHADOW};border-bottom:1px solid ${SHADOW};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td bgcolor="${BAR}" style="background:${BAR};padding:5px 8px;font:bold 13px/18px ${SYS};color:${WHITE};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="18" height="18" align="center" valign="middle" bgcolor="${PAPER}" style="width:18px;height:18px;background:${PAPER};color:${INK};font:12px/18px ${SYS};border:1px solid ${WHITE};">&#9670;</td>
            <td style="padding-left:7px;font:bold 13px/13px ${SYS};color:${WHITE};letter-spacing:0;">HYPERNET<span style="display:inline-block;width:0.28em;height:0.28em;border-radius:50%;background:${WHITE};margin:0 0.42em;vertical-align:0.22em;"></span>GLOBAL</td>
          </tr></table>
        </td></tr>
        <tr><td bgcolor="${PAPER}" style="background:${PAPER};padding:28px 28px 26px;border-top:1px solid ${SHADOW};border-left:1px solid ${SHADOW};border-right:1px solid ${WHITE};border-bottom:1px solid ${WHITE};">
          <p style="margin:0 0 18px;font:15px/22px ${SYS};color:${INK};">${esc(line)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr>
            <td bgcolor="${WHITE}" style="background:${WHITE};padding:12px 20px;border:1px solid ${INK};font:bold 34px/40px ${SYS};letter-spacing:4px;color:${INK};white-space:nowrap;">${esc(spaced)}</td>
          </tr></table>
          <p style="margin:0;font:12px/18px ${SYS};color:${DIM};">If you didn’t ask for it, ignore this email: nobody can log in without the code.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  <p style="margin:14px 0 0;font:11px/16px ${SYS};color:${DIM};">HYPERNET · GLOBAL — find the events your people are going to.</p>
</td></tr>
</table>
</body></html>`;
  return { subject, html, text };
}
