import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageNodeView from "./ResizableImageNodeView";

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("width") || el.style.width || null,
        renderHTML: (attrs: any) => (attrs.width ? { width: attrs.width } : {}),
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("height") || el.style.height || null,
        renderHTML: (attrs: any) =>
          attrs.height ? { height: attrs.height } : {},
      },
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("style"),
        renderHTML: (attrs: any) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
  renderHTML({ HTMLAttributes }: any) {
    // Ensure width/height are reflected as inline style for preview portability
    const styleParts: string[] = [];
    if (HTMLAttributes.width)
      styleParts.push(
        `width:${HTMLAttributes.width}${String(HTMLAttributes.width).endsWith("px") || String(HTMLAttributes.width).endsWith("%") ? "" : "px"}`,
      );
    if (HTMLAttributes.height)
      styleParts.push(`height:${HTMLAttributes.height}`);
    if (HTMLAttributes.style) styleParts.push(HTMLAttributes.style);
    const style = styleParts.join("; ");
    return ["img", { ...HTMLAttributes, style: style || undefined }];
  },
}).configure({ inline: false, allowBase64: true });
