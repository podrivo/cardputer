/**
 * Inject installer-specific Open Graph / Twitter meta when `?i=<id>` is present.
 * Hash deep links never reach the server; share URLs use the query param instead.
 */
import meta from "../../catalog-meta.json" with { type: "json" };

const SITE = "Cardputer ADV Installers";

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function replaceMeta(html, { title, desc, pageUrl }) {
  const t = esc(title);
  const d = esc(desc);
  const u = esc(pageUrl);
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${d}">`
    )
    .replace(
      /<meta property="og:title" content="[^"]*">/,
      `<meta property="og:title" content="${t}">`
    )
    .replace(
      /<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${d}">`
    )
    .replace(
      /<meta property="og:url" content="[^"]*">/,
      `<meta property="og:url" content="${u}">`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*">/,
      `<meta name="twitter:title" content="${t}">`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*">/,
      `<meta name="twitter:description" content="${d}">`
    );
}

export default async (request, context) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("i");
  if (!id) return;

  const item = meta[id];
  if (!item) return;

  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const title = `${item.emoji} ${item.name} · ${SITE}`;
  const pageUrl = `${url.origin}/?i=${encodeURIComponent(id)}`;
  const html = replaceMeta(await response.text(), {
    title,
    desc: item.desc,
    pageUrl,
  });

  return new Response(html, {
    status: response.status,
    headers: response.headers,
  });
};
