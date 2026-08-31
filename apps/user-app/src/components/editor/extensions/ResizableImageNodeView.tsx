import { NodeViewWrapper } from "@tiptap/react";
import { useRef } from "react";

export default function ResizableImageNodeView({
  node,
  selected,
  updateAttributes,
  extension,
}: any) {
  const { src, alt, title, width } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: React.MouseEvent, dir: string) => {
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
  let wrapperStyle: any = { display: "block", maxWidth: "100%" };
  const ta = node.attrs.textAlign;
  if (ta === "center") {
    wrapperStyle.marginLeft = "auto";
    wrapperStyle.marginRight = "auto";
  } else if (ta === "right") {
    wrapperStyle.marginLeft = "auto";
    wrapperStyle.marginRight = "0";
  } else if (ta === "left") {
    wrapperStyle.marginLeft = "0";
    wrapperStyle.marginRight = "auto";
  }
  if (node.attrs.style) {
    node.attrs.style.split(";").forEach((p: string) => {
      const [k, v] = p.split(":").map((s: string) => s.trim());
      if (k && v)
        wrapperStyle[
          k.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())
        ] = v;
    });
  }

  return (
    <NodeViewWrapper
      className={`resizable-image-wrapper ${selected ? "ProseMirror-selectednode" : ""}`}
      style={wrapperStyle}
      data-drag-handle
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "inline-block",
          maxWidth: "100%",
        }}
      >
        <img
          src={src}
          alt={alt}
          title={title}
          style={{
            ...imgStyle,
            maxWidth: "100%",
            height: "auto",
            display: "block",
            borderRadius: 6,
          }}
        />
        {selected && (
          <>
            <div
              onMouseDown={(e) => onMouseDown(e, "w")}
              style={{
                position: "absolute",
                left: -4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 8,
                height: 40,
                background: "#6366f1",
                borderRadius: 4,
                cursor: "ew-resize",
              }}
            />
            <div
              onMouseDown={(e) => onMouseDown(e, "e")}
              style={{
                position: "absolute",
                right: -4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 8,
                height: 40,
                background: "#6366f1",
                borderRadius: 4,
                cursor: "ew-resize",
              }}
            />
            <div
              onMouseDown={(e) => onMouseDown(e, "e")}
              style={{
                position: "absolute",
                right: -4,
                bottom: -4,
                width: 12,
                height: 12,
                background: "#6366f1",
                borderRadius: 2,
                cursor: "nwse-resize",
              }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
