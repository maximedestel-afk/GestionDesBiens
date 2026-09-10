// Rendu Markdown simplifié pour l'aperçu de l'onglet Accès (gras, italique,
// code, titres, listes). Le texte est toujours échappé avant transformation :
// aucun HTML fourni par l'utilisateur n'est jamais injecté tel quel.

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/(^|[^_])_([^_]+)_(?!_)/g, "$1<em>$2</em>");
  return html;
}

export function renderMarkdownToHtml(source: string): string {
  const lines = source.split("\n");
  const blocks: string[] = [];
  let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;

  function flushList() {
    if (!listBuffer) return;
    const items = listBuffer.items.map((item) => `<li>${item}</li>`).join("");
    blocks.push(`<${listBuffer.type}>${items}</${listBuffer.type}>`);
    listBuffer = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    const bulletMatch = /^[-*]\s+(.*)$/.exec(line);
    const numberedMatch = /^\d+\.\s+(.*)$/.exec(line);

    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length + 2; // # -> h3, ## -> h4, ### -> h5
      blocks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
    } else if (bulletMatch) {
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList();
        listBuffer = { type: "ul", items: [] };
      }
      listBuffer.items.push(renderInline(bulletMatch[1]));
    } else if (numberedMatch) {
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList();
        listBuffer = { type: "ol", items: [] };
      }
      listBuffer.items.push(renderInline(numberedMatch[1]));
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      blocks.push(`<p>${renderInline(line)}</p>`);
    }
  }
  flushList();
  return blocks.join("\n");
}
