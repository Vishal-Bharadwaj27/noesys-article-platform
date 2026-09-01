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
 * Google Docs (and many plain web pages) never emit <b>/<strong>/<em>/<u>.
 * Every bit of bold/italic/underline is a <span style="font-weight:700">
 * (or font-style:italic / text-decoration:underline) instead. If we don't
 * convert those to real tags now, the later cleanup strips the `style`
 * attribute, the span ends up with zero attributes, and it gets unwrapped —
 * silently dropping the formatting. Must run BEFORE detectAndConvertBoldHeadings
 * (so it can see real <strong> for its "whole paragraph is bold" check) and
 * before the attribute-stripping pass in cleanPastedHtml.
 */
function convertInlineStylesToSemanticTags(html: string): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
 
  const isBoldStyle = (style: string) =>
    /font-weight\s*:\s*(bold|[6-9]\d{2}|1000)/i.test(style);
  const isItalicStyle = (style: string) => /font-style\s*:\s*italic/i.test(style);
  const isUnderlineStyle = (style: string) =>
    /text-decoration[^;]*:\s*[^;]*underline/i.test(style);
 
  // Reverse (innermost-first): setting el.innerHTML reparses its children,
  // detaching the original child element objects. Processing children
  // before their ancestors avoids skipping a nested styled span whose
  // parent already got rewritten.
  const styledEls = Array.from(doc.querySelectorAll("[style]")).reverse();
  styledEls.forEach((el) => {
    const style = el.getAttribute("style") || "";
    const bold = isBoldStyle(style);
    const italic = isItalicStyle(style);
    const underline = isUnderlineStyle(style);
    if (!bold && !italic && !underline) return;
    if (!(el.textContent || "").trim()) return;
 
    let inner = el.innerHTML;
    if (bold && !el.closest("b,strong,h1,h2,h3,h4,h5,h6"))
      inner = `<strong>${inner}</strong>`;
    if (italic && !el.closest("em,i")) inner = `<em>${inner}</em>`;
    if (underline && !el.closest("u")) inner = `<u>${inner}</u>`;
    el.innerHTML = inner;
  });
 
  return doc.body.innerHTML;
}
 
/**
 * A paragraph's own `style` attribute is where Word puts heading signals,
 * but Google Docs puts font-size/font-weight on an inner <span> that wraps
 * the whole line instead. Borrow that span's style ONLY when its text
 * content matches the entire paragraph (so a small nested footnote span
 * elsewhere in the paragraph can't falsely trigger a heading promotion).
 */
function getDominantStyle(p: HTMLElement): string {
  const own = p.getAttribute("style") || "";
  const text = (p.textContent || "").trim();
  if (!text) return own;
  const styled = Array.from(p.querySelectorAll("[style]")) as HTMLElement[];
  const dominant = styled.find((e) => (e.textContent || "").trim() === text);
  return dominant ? `${own};${dominant.getAttribute("style") || ""}` : own;
}
 
/**
 * Detect and convert Google Docs / web-page "fake headings" to semantic
 * heading tags. Google Docs and many websites don't emit <h1>-<h3>; they
 * present headings as bold text with a large inline font-size instead.
 * Walk the parsed DOM, and for any paragraph whose (own or dominant span)
 * style is bold and visually large (font-size >= 18px OR font-weight >= 700)
 * replace it with a real <h1>-<h4> so Tiptap can serialize and re-render it
 * correctly.
 */
function detectAndConvertBoldHeadings(html: string): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
 
  // Collect candidate style rules from <style> blocks before they're stripped:
  // Word defines headings via mso-style-name / mso-outline-level there.
  // We keep a map of class -> heading level derived from style text.
  let styleText = "";
  doc.querySelectorAll("style").forEach((s) => (styleText += s.textContent || ""));
 
  const getHeadingFromClass = (cls: string): string | null => {
    if (/MsoHeading\s*1/i.test(cls) || /MsoTitle/i.test(cls)) return "h1";
    if (/MsoHeading\s*2/i.test(cls)) return "h2";
    if (/MsoHeading\s*3/i.test(cls)) return "h3";
    return null;
  };
 
  // 1) Convert Word paragraphs that are actually headings (MsoHeading, outline-level, large bold)
  doc.querySelectorAll("p").forEach((p) => {
    if (p.closest("h1,h2,h3,h4,h5,h6,li,table")) return;
    const text = (p.textContent || "").trim();
    if (!text || text.length > 400) return;
    const style = getDominantStyle(p);
    const cls = p.getAttribute("class") || "";
 
    // Check Word heading signals
    const outlineMatch = /mso-outline-level:\s*(\d)/i.exec(style);
    const styleNameMatch = /mso-style-name:\s*"?Heading\s*(\d)"?/i.exec(style);
    const classHeading = getHeadingFromClass(cls);
    // Also check styleText for this element's class defining a heading
    let level: string | null = null;
    if (outlineMatch) level = `h${outlineMatch[1]}`;
    else if (styleNameMatch) level = `h${styleNameMatch[1]}`;
    else if (classHeading) level = classHeading;
    // Fallback: large + bold heuristic for Google Docs / unstyled Word export
    if (!level) {
      const fsMatch = /font-size\s*:\s*(\d+)\s*(?:pt|px)/i.exec(style);
      const fwMatch = /font-weight\s*:\s*(bold|[6-9]\d{2}|1000)/i.exec(style);
      let fontSize = fsMatch ? parseInt(fsMatch[1], 10) : 0;
      // pt to px approx
      if (fsMatch && /pt/i.test(fsMatch[0])) fontSize = Math.round(fontSize * 1.33);
      const isBold = fwMatch !== null || !!p.querySelector("b,strong") || /font-weight:\s*bold/i.test(style);
      const hasLarge = fontSize >= 16;
      // Only promote short paragraphs that are bold+larger than body
      if (isBold && hasLarge) {
        level = fontSize >= 22 ? "h1" : fontSize >= 18 ? "h2" : "h3";
      } else if (classHeading) {
        level = classHeading;
      }
    }
    if (level) {
      const h = doc.createElement(level);
      // Preserve inner formatting (bold/italic) but strip Word junk spans
      h.innerHTML = p.innerHTML;
      // Clean mso tab stops inside heading
      h.innerHTML = h.innerHTML.replace(/<span[^>]*mso-tab-count[^>]*>[\s\S]*?<\/span>/gi, " ").trim();
      p.replaceWith(h);
    }
  });
 
  // 2) Convert standalone bold spans/divs that act as headings (Google Docs)
  doc.querySelectorAll("b, strong").forEach((el) => {
    if (el.closest("h1,h2,h3,h4,h5,h6,li,p")) return;
    const text = (el.textContent || "").trim();
    if (!text || text.length > 300) return;
    const parent = el.parentElement;
    // Only if the bold element is the dominant content of its parent
    if (parent && (parent.textContent || "").trim() !== text) return;
    const style = (el.getAttribute("style") || "") + (parent?.getAttribute("style") || "");
    const fsMatch = /font-size\s*:\s*(\d+)\s*px/i.exec(style);
    const fontSize = fsMatch ? parseInt(fsMatch[1], 10) : 0;
    if (fontSize >= 18 || el.tagName === "B" || el.tagName === "STRONG") {
      // Use parent context if it looks like a heading block
      const target = parent && parent !== doc.body ? parent : el;
      if (target.closest("h1,h2,h3")) return;
      const lvl = fontSize >= 24 ? "h1" : fontSize >= 20 ? "h2" : "h3";
      const h = doc.createElement(lvl);
      h.innerHTML = target.innerHTML;
      target.replaceWith(h);
    }
  });
 
  return doc.body.innerHTML;
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
 
  // Google Docs/web pages encode bold/italic/underline purely via inline
  // styles on <span> (no <b>/<strong>/<em>/<u>). Convert those to semantic
  // tags first so they survive both heading detection and the later
  // attribute-stripping pass.
  html = convertInlineStylesToSemanticTags(html);
 
  // Then detect and convert Google Docs bold headings to semantic headings
  // BEFORE the rest of the cleanup strips inline styles.
  html = detectAndConvertBoldHeadings(html);
 
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
 
  // Before stripping, collect Word list info (mso-list paragraphs)
  const wordListInfo = new Map<
    Element,
    { level: number; isOrdered: boolean }
  >();
  doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6").forEach((el) => {
    const style = el.getAttribute("style") || "";
    const cls = el.getAttribute("class") || "";
    if (/mso-list/i.test(style) || /MsoListParagraph/i.test(cls)) {
      const levelMatch = /level(\d+)/i.exec(style);
      const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;
      // Detect bullet vs numbered: mso-list often contains lfo style but text tells us
      const raw = (el.textContent || "").trim();
      const isOrdered = /^\d+[\.\)]/.test(raw) || /^\s*\d/.test(raw);
      wordListInfo.set(el, { level, isOrdered });
    }
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
      if (align)
        el.setAttribute("style", `text-align:${align[1].toLowerCase()}`);
      else el.removeAttribute("style");
    }
    if (el.tagName.toLowerCase() === "span" && !el.attributes.length) {
      el.replaceWith(...Array.from(el.childNodes));
    }
  });
 
  // Convert Word "1. Heading" paragraphs (fake numbering with mso-tab-count)
  // into real <ol><li> / <ul><li> so Tiptap renders them as proper lists
  // and body text below aligns naturally instead of starting at extreme left
  // while the heading appears indented.
  // Also handles Google Docs numbering which comes as <p> with leading "1. "
  if (wordListInfo.size > 0) {
    // Process in DOM order, grouping consecutive list paragraphs into lists
    let currentList: HTMLElement | null = null;
    let currentOrdered: boolean | null = null;
    const bodyChildren = Array.from(doc.body.children) as HTMLElement[];
    for (const child of bodyChildren) {
      if (!wordListInfo.has(child)) {
        currentList = null;
        currentOrdered = null;
        continue;
      }
      const info = wordListInfo.get(child)!;
      // Use ordered/unordered based on detected text pattern
      const isOrdered = info.isOrdered;
      if (!currentList || currentOrdered !== isOrdered) {
        const list = doc.createElement(isOrdered ? "ol" : "ul");
        child.before(list);
        currentList = list;
        currentOrdered = isOrdered;
      }
      const li = doc.createElement("li");
      // Clean leading "1. " / "1) " / "• " and any leftover tab \u00a0
      let text = child.innerHTML
        .replace(/^\s*(?:\d+[\.\)]|•|·)\s*(?:&nbsp;|\u00a0|\s)*/i, "")
        .replace(/<span[^>]*mso-tab-count[^>]*>[\s\S]*?<\/span>/gi, " ")
        .trim();
      // If this child is already a heading, don't wrap it in a list item
      if (/^<h[1-6]/i.test(child.outerHTML.trim())) {
        currentList = null;
        currentOrdered = null;
        continue;
      }
      li.innerHTML = text || child.textContent || "";
      currentList.appendChild(li);
      child.remove();
    }
  }
 
  // Fallback: even without mso-list markers, Google Docs sometimes pastes
  // numbered headings as plain "1.  Heading Title" paragraphs. Detect a run
  // of such paragraphs at the top and convert them too (heading + body pattern)
  {
    const paras = Array.from(doc.body.querySelectorAll("p")) as HTMLElement[];
    // Only convert if we see 2+ consecutive "N. text" paragraphs that look like outline
    let run: HTMLElement[] = [];
    for (const p of paras) {
      const t = (p.textContent || "").trim();
      if (
        /^\d+[\.\)]\s+\S/.test(t) &&
        t.length < 200 &&
        !p.querySelector("img,table")
      ) {
        run.push(p);
      } else if (run.length >= 2) {
        break;
      } else {
        run = [];
      }
    }
    if (run.length >= 2 && wordListInfo.size === 0) {
      let list: HTMLElement | null = null;
      for (const p of run) {
        if (!list) {
          list = doc.createElement("ol");
          p.before(list);
        }
        const li = doc.createElement("li");
        li.innerHTML =
          p.innerHTML.replace(/^\s*\d+[\.\)]\s*/, "").trim() ||
          p.textContent ||
          "";
        list.appendChild(li);
        p.remove();
      }
    }
  }
 
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
    if (!blob.type.startsWith("image/") || blob.size > MAX_INLINE_BYTES)
      return null;
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