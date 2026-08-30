import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  cleanPastedHtml,
  fileToDataUrl,
  inlineRemoteImages,
  isLikelyMarkdown,
  markdownToHtml,
} from "../lib/contentNormalize";

export interface SmartPasteOptions {
  /** Convert http(s) images to base64 after paste. Default true. */
  inlineRemoteImages: boolean;
}

/**
 * SmartPaste
 * ----------
 * One paste handler that covers the two cases we care about:
 *
 * 1. Rich document paste (Microsoft Word, Outlook, Google Docs, web page):
 *    clipboard carries `text/html`. We clean the Office junk and insert the
 *    WHOLE document — headings, lists, tables, bold/italic and images.
 *    If Word gave us dead `file:///` image links but also put the bitmaps in
 *    `clipboardData.files`, those files are inserted as base64 instead so no
 *    image is lost.
 *
 * 2. Markdown paste (a .md file's text, including `![alt](data:image/png;base64,…)`):
 *    clipboard carries only `text/plain` that looks like markdown. We render it
 *    with `marked` and insert the resulting HTML, so the editor and the Preview
 *    tab both show formatted markdown plus the inline images.
 *
 * Anything else falls through to Tiptap's default paste behaviour.
 */
export const SmartPaste = Extension.create<SmartPasteOptions>({
  name: "smartPaste",

  addOptions() {
    return { inlineRemoteImages: true };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const options = this.options;

    const insertHtml = (html: string) => {
      editor
        .chain()
        .focus()
        .insertContent(html, {
          parseOptions: { preserveWhitespace: false },
        })
        .run();
    };

    return [
      new Plugin({
        key: new PluginKey("smartPaste"),
        props: {
          handlePaste: (_view, event) => {
            const cd = (event as ClipboardEvent).clipboardData;
            if (!cd) return false;

            const html = cd.getData("text/html");
            const text = cd.getData("text/plain");
            const imageFiles = Array.from(cd.files || []).filter((f) =>
              f.type.startsWith("image/"),
            );

            /* ---- 1. rich HTML document ---- */
            if (html && html.trim()) {
              event.preventDefault();
              const cleaned = cleanPastedHtml(html);
              insertHtml(cleaned || "<p></p>");

              // Word dropped its images as file:/// links -> re-attach the
              // real bitmaps that came along in clipboardData.files.
              if (imageFiles.length && !/<img/i.test(cleaned)) {
                void (async () => {
                  for (const file of imageFiles) {
                    try {
                      const src = await fileToDataUrl(file);
                      editor.chain().focus().setImage({ src }).run();
                    } catch {
                      /* ignore unreadable clipboard image */
                    }
                  }
                })();
              } else if (options.inlineRemoteImages && /<img/i.test(cleaned)) {
                // Replace remote srcs with base64 so the article survives the
                // source page going away. Best effort; CORS failures are kept
                // as plain remote URLs.
                void (async () => {
                  const withData = await inlineRemoteImages(cleaned);
                  if (withData !== cleaned) {
                    // Re-render just the pasted fragment would need position
                    // bookkeeping; swapping srcs in the whole doc is safe and
                    // idempotent because data: urls are skipped.
                    const full = await inlineRemoteImages(editor.getHTML());
                    if (full !== editor.getHTML())
                      editor.commands.setContent(full, { emitUpdate: true });
                  }
                })();
              }
              return true;
            }

            /* ---- 2. bare image (screenshot / copied image) ---- */
            if (imageFiles.length && (!text || !text.trim())) {
              event.preventDefault();
              void (async () => {
                for (const file of imageFiles) {
                  try {
                    const src = await fileToDataUrl(file);
                    editor.chain().focus().setImage({ src }).run();
                  } catch {
                    /* ignore */
                  }
                }
              })();
              return true;
            }

            /* ---- 3. markdown text ---- */
            if (text && isLikelyMarkdown(text)) {
              event.preventDefault();
              insertHtml(markdownToHtml(text));
              return true;
            }

            return false;
          },

          handleDrop: (_view, event) => {
            const dt = (event as DragEvent).dataTransfer;
            const files = Array.from(dt?.files || []);
            const images = files.filter((f) => f.type.startsWith("image/"));
            const mdFile = files.find(
              (f) => /\.mdx?$/i.test(f.name) || f.type === "text/markdown",
            );

            if (mdFile) {
              event.preventDefault();
              void (async () => {
                insertHtml(markdownToHtml(await mdFile.text()));
              })();
              return true;
            }

            if (images.length) {
              event.preventDefault();
              void (async () => {
                for (const file of images) {
                  try {
                    const src = await fileToDataUrl(file);
                    editor.chain().focus().setImage({ src }).run();
                  } catch {
                    /* ignore */
                  }
                }
              })();
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

export default SmartPaste;
