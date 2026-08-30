import { useEditor, EditorContent } from "@tiptap/react";
import { marked } from "marked";
import "./tiptap.css";
import { tiptapExtensions } from "./TiptapExtensions";

type Props = {
  content: string;
};

/**
 * Some older articles were saved as raw markdown (from a previous
 * markdown-mode toggle) instead of Tiptap HTML. Tiptap only understands
 * HTML — fed raw markdown, it renders "## Heading" and "![](base64...)"
 * as literal text instead of parsing them. This detects that case and
 * converts to HTML before loading.
 */
function isLikelyHtml(value: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  // HTML content from Tiptap always starts with a tag, e.g. <p>, <h1>, <img
  return /^<[a-z][\s\S]*>/i.test(trimmed);
}

function resolveHtml(content: string): string {
  if (!content) return "<p></p>";
  if (isLikelyHtml(content)) return content;
  return marked.parse(content, { async: false }) as string;
}

/**
 * Strictly for viewing articles. No toolbar, no editing, no upload logic.
 * Uses the same extensions + CSS as TiptapEditor so rendered output is
 * pixel-identical between edit mode and view mode.
 */
export default function ArticleViewer({ content }: Props) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: resolveHtml(content),
    editable: false,
  });

  if (!editor) return null;

  return (
    <div className="article-viewer">
      <EditorContent editor={editor} />
    </div>
  );
}