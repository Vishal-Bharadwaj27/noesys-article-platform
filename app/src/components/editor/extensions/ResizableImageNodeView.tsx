import { NodeViewWrapper } from "@tiptap/react";
import { useRef } from "react";

export default function ResizableImageNodeView({
  node,
  selected,
  updateAttributes,
  extension,
  editor,
}: any) {
  const { src, alt, title, width } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const isEditable = editor?.isEditable ?? true;

  const onMouseDown = (e: React.MouseEvent, dir: string) => {
    if (!isEditable) return;
    e.preventDefault();
    const startX = e.clientX;
    const img = containerRef.current?.querySelector(
      "img",
    ) as HTMLImageElement | null;
    const startWidth = img?.clientWidth || 300;
    const onMove = (ev: MouseEvent) => {
      const delta = dir === "e" ? ev.clientX - startX : startX - ev.clientX;
      // for west handle invert
      const newW = Math.max(
        80,
        Math.min(
          900,
          startWidth + (dir === "e" ? delta : dir === "w" ? delta : 0),
        ),
      );
      // for se handle use delta
      updateAttributes({ width: `${Math.round(newW)}px` });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const imgStyle: any = {};
  if (width) imgStyle.width = width;

  // Use text-align on full-width wrapper to align inner inline-block container.
  // This is more reliable than margin:auto on the wrapper itself.
  let wrapperClassName = "block w-full max-w-full";
  const ta = node.attrs.textAlign || "left";

  wrapperClassName +=
    ta === "center"
      ? " text-center"
      : ta === "right"
        ? " text-right"
        : " text-left";

  if (node.attrs.style) {
    node.attrs.style.split(";").forEach((p: string) => {
      const [k, v] = p.split(":").map((s: string) => s.trim());
      if (k && v) {
        // Preserve legacy inline styles from node.attrs.style.
        // These styles are dynamic content attributes and cannot be
        // safely converted to static Tailwind classes.
        const styleMap: Record<string, string> = {
          display: "block",
          width: "w-full",
          "max-width": "max-w-full",
          "text-align": "text-left",
        };

        const tailwindClass = styleMap[k];
        if (tailwindClass && v === "100%") {
          wrapperClassName += ` ${tailwindClass}`;
        }
      }
    });

    // Don't let legacy margin styles override textAlign
    if (ta) {
      wrapperClassName = wrapperClassName
        .replace(/\bml-auto\b/g, "")
        .replace(/\bmr-auto\b/g, "");

      wrapperClassName += " block w-full";
      wrapperClassName +=
        ta === "center"
          ? " text-center"
          : ta === "right"
            ? " text-right"
            : " text-left";
    }
  }

  return (
    <NodeViewWrapper
      className={`resizable-image-wrapper ${selected && isEditable ? "ProseMirror-selectednode" : ""} ${wrapperClassName}`}
      data-drag-handle={isEditable ? true : undefined}
    >
      <div
        ref={containerRef}
        className="relative inline-block max-w-full"
      >
        <img
          src={src}
          alt={alt}
          title={title}
          style={imgStyle}
          className="max-w-full h-auto block rounded-[6px]"
        />

        {selected && isEditable && (
          <>
            <div
              onMouseDown={(e) => onMouseDown(e, "w")}
              className="absolute left-[-4px] top-1/2 h-[40px] w-[8px] -translate-y-1/2 cursor-ew-resize rounded-[4px] bg-[#6366f1]"
            />

            <div
              onMouseDown={(e) => onMouseDown(e, "e")}
              className="absolute right-[-4px] top-1/2 h-[40px] w-[8px] -translate-y-1/2 cursor-ew-resize rounded-[4px] bg-[#6366f1]"
            />

            <div
              onMouseDown={(e) => onMouseDown(e, "e")}
              className="absolute bottom-[-4px] right-[-4px] h-[12px] w-[12px] cursor-nwse-resize rounded-[2px] bg-[#6366f1]"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}