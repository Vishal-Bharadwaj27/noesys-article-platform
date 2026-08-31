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

  const align = (() => {
    const s: string = node.attrs.style || "";
    if (
      s.includes("float: left") ||
      (s.includes("margin-right: auto") && s.includes("margin-left: 0"))
    )
      return "left";
    if (s.includes("float: right")) return "right";
    if (
      s.includes("margin: 0 auto") ||
      (s.includes("margin-left: auto") && s.includes("margin-right: auto"))
    )
      return "center";
    return "left";
  })();

  const setAlign = (a: string) => {
    let style = "";
    if (a === "left")
      style =
        "display:block; margin-left:0; margin-right:auto; float:none; max-width:100%";
    if (a === "center")
      style =
        "display:block; margin-left:auto; margin-right:auto; float:none; max-width:100%";
    if (a === "right")
      style =
        "display:block; margin-left:auto; margin-right:0; float:none; max-width:100%";
    updateAttributes({ style });
  };

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
  // alignment style applied to wrapper, image fills wrapper
  let wrapperStyle: any = { display: "block", maxWidth: "100%" };
  if (node.attrs.style) {
    // parse simple style string for wrapper
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
            <div
              style={{
                position: "absolute",
                top: -32,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 4,
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                padding: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              {["left", "center", "right"].map((a) => (
                <button
                  key={a}
                  onClick={() => setAlign(a)}
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    borderRadius: 4,
                    background: align === a ? "#0f172a" : "transparent",
                    color: align === a ? "white" : "#334155",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
