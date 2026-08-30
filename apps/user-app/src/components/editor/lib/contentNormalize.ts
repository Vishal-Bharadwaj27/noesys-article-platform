import { marked } from "marked";

/**
 * Shared normalisation helpers for pasted / stored article content.
 *
 * Three jobs:
 *  1. cleanPastedHtml()  -> turn Word / Google Docs clipboard HTML into clean,
 *     Tiptap-parseable HTML while KEEPING images (data: and https:).
 *  2. markdownToHtml()   -> render a pasted markdown document (incl. base64
 *     images) to HTML so Tiptap shows it formatted instead of as literal text.
 *  3. resolveContentToHtml() -> used by the editor + the preview/viewer to
 *     decide whether stored content is HTML or markdown.
 */

marked.setOptions({ gfm: true, breaks: false });

/* ------------------------------------------------------------------ */
/* Markdown                                                            */
/* ------------------------------------------------------------------ */

const MD_SIGNALS: RegExp[] = [
  /^\s{0,3}#{1,6}\s+\S/m, // # heading
  /^\s{0,3}(\*|-|\+)\s+\S/m, // - bullet
  /^\s{0,3}\d+\.\s+\S/m, // 1. ordered
  /^\s{0,3}>\s+\S/m, // > quote
  /^\s{0,3}```/m, // ``` fence
  /!\[[^\]]*\]\([^)]+\)/, // ![alt](src)  <- includes base64
  /\[[^\]]+\]\((https?:|\/|#)[^)]*\)/, // [text](url)
  /^\s{0,3}\|.+\|\s*$/m, // | table |
  /^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/m, // --- rule
  /(\*\*|__)\S[\s\S]*?\1/, // **bold**
];

export function isLikelyMarkdown(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!t) return false;
  // Real HTML wins; markdown files never start with a tag.
  if (/^<[a-z!][\s\S]*>/i.test(t)) return false;
  return MD_SIGNALS.some((re) => re.test(t));
}

export function markdownToHtml(md: string): string {
  if (!md || !md.trim()) return "<p></p>";
  const html = marked.parse(md, { async: false }) as string;
  return html && html.trim() ? html : "<p></p>";
}

export function isLikelyHtml(value: string): boolean {
  if (!value) return true;
  return /^\s*<[a-z!][\s\S]*>/i.test(value.trim());
}

/** Decide how to feed stored/incoming content into Tiptap. */
export function resolveContentToHtml(content: string): string {
  if (!content || !content.trim()) return "<p></p>";
  if (isLikelyMarkdown(content)) return markdownToHtml(content);
  if (isLikelyHtml(content)) return content;
  return markdownToHtml(content);
}

/* ------------------------------------------------------------------ */
/* Word / Google Docs HTML                                             */
/* ------------------------------------------------------------------ */

/** src values Tiptap can actually render. file:// and cid: are dead links. */
export function isUsableImageSrc(src: string | null): boolean {
  if (!src) return false;
  return /^(data:image\/|https?:|blob:)/i.test(src.trim());
}

/**
 * Strip Office/Docs junk (conditional comments, <style>, mso-* classes,
 * <o:p>, VML shapes) but preserve structure (headings, lists, tables,
 * bold/italic) and every usable <img>.
 *
 * Runs in the browser and uses DOMParser, so it must only be called from
 * client code (paste handlers) — which is the only place we use it.
 */
export function cleanPastedHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  // Kill IE conditional comments + Word's <style> blob before parsing:
  // they can hold megabytes of mso rules and confuse the parser.
  let html = rawHtml
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<xml[\s\S]*?<\/xml>/gi, "")
    .replace(/<\/?o:[a-z]+[^>]*>/gi, "")
    .replace(/<\/?w:[a-z]+[^>]*>/gi, "");

  const doc = new DOMParser().parseFromString(html, "text/html");

  // VML shapes: <v:shape><v:imagedata src="..."/></v:shape> -> <img>
  doc.querySelectorAll("*").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "v:imagedata" || tag === "imagedata") {
      const src = el.getAttribute("src") || el.getAttribute("o:href");
      if (isUsableImageSrc(src)) {
        const img = doc.createElement("img");
        img.setAttribute("src", src as string);
        el.replaceWith(img);
      } else {
        el.remove();
      }
    }
  });

  // Drop leftover VML / namespaced elements, keeping their text.
  doc.querySelectorAll("*").forEach((el) => {
    if (el.tagName.includes(":")) {
      el.replaceWith(...Array.from(el.childNodes));
    }
  });

  // Unusable images (file:///, cid:) are removed so we don't render broken
  // icons; the paste handler re-attaches clipboard image files instead.
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (!isUsableImageSrc(src)) {
      img.remove();
      return;
    }
    img.removeAttribute("style");
    img.removeAttribute("class");
    img.removeAttribute("width");
    img.removeAttribute("height");
  });

  // Strip presentational attributes Tiptap ignores anyway, plus mso classes.
  doc.querySelectorAll("*").forEach((el) => {
    if (el.tagName.toLowerCase() === "img") return;
    el.removeAttribute("class");
    el.removeAttribute("lang");
    el.removeAttribute("id");
    const style = el.getAttribute("style");
    if (style) {
      // Keep only text-align, which Tiptap's TextAlign extension understands.
      const align = /text-align:\s*(left|center|right|justify)/i.exec(style);
      if (align) el.setAttribute("style", `text-align:${align[1].toLowerCase()}`);
      else el.removeAttribute("style");
    }
    if (el.tagName.toLowerCase() === "span" && !el.attributes.length) {
      el.replaceWith(...Array.from(el.childNodes));
    }
  });

  // Word emits empty "spacer" paragraphs by the dozen.
  doc.querySelectorAll("p").forEach((p) => {
    const text = (p.textContent || "").replace(/\u00a0|\s/g, "");
    if (!text && !p.querySelector("img,table,br")) p.remove();
  });

  return doc.body.innerHTML;
}

/** True when the clipboard HTML came from Word / Outlook / Google Docs. */
export function isOfficeHtml(html: string): boolean {
  return /mso-|urn:schemas-microsoft-com|class="?Mso|docs-internal-guid/i.test(
    html || "",
  );
}

/* ------------------------------------------------------------------ */
/* Remote -> base64 (best effort)                                      */
/* ------------------------------------------------------------------ */

const MAX_INLINE_BYTES = 3 * 1024 * 1024;

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/") || blob.size > MAX_INLINE_BYTES) return null;
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    // CORS-blocked (common for Google Docs) — leave the original URL alone.
    return null;
  }
}

/**
 * Converts http(s)/blob image sources in an HTML string to base64 data URLs so
 * the article keeps working after the source page expires. Best effort: any
 * image that can't be fetched keeps its original src.
 */
export async function inlineRemoteImages(html: string): Promise<string> {
  if (!html || !/<img/i.test(html)) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const imgs = Array.from(doc.querySelectorAll("img")).filter((i) =>
    /^(https?:|blob:)/i.test(i.getAttribute("src") || ""),
  );
  if (!imgs.length) return html;
  await Promise.all(
    imgs.map(async (img) => {
      const dataUrl = await urlToDataUrl(img.getAttribute("src") as string);
      if (dataUrl) img.setAttribute("src", dataUrl);
    }),
  );
  return doc.body.innerHTML;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("Could not read image file"));
    fr.readAsDataURL(file);
  });
}
