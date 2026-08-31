import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ResizableImage } from "./extensions/ResizableImage";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Strike from "@tiptap/extension-strike";
import { useRef, useCallback, useEffect } from "react";
import { convertImageToBase64 } from "@/utils/imageToBase64";
import { Tooltip } from "antd";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link2,
  List,
  ListOrdered,
  Quote,
  Code2,
  Table2,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react";
import "./tiptap.css";
import "./paste-content.css";
import { SmartPaste } from "./extensions/SmartPaste";
import { resolveContentToHtml } from "./lib/contentNormalize";

function ToolBtn({ tip, active, onClick, children }: any) {
  return (
    <Tooltip title={tip}>
      <button
        type="button"
        onClick={onClick}
        className={`p-1.5 rounded border border-transparent ${active ? "bg-slate-800 text-white hover:bg-slate-900 border-slate-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-200"}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export default function TiptapEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Normalize whatever comes in on first mount: HTML passes through,
  // legacy markdown gets converted once up front. Keep resolveContentToHtml
  // for markdown + image rendering.
  const initialHtml = resolveContentToHtml(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Strike,
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      Link.configure({ openOnClick: false }),
      ResizableImage,
      Placeholder.configure({
        placeholder: "Write your article content here...",
      }),
      // Handles Word / Google Docs / Markdown pastes (see extensions/SmartPaste.ts)
      SmartPaste,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialHtml,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImage = useCallback(
    async (file: File) => {
      try {
        const b64 = await convertImageToBase64(file);
        editor?.chain().focus().setImage({ src: b64 }).run();
      } catch (err: any) {
        alert(err.message);
      }
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    const nextHtml = resolveContentToHtml(value || "");
    editor.commands.setContent(nextHtml);
  }, [value]);

  if (!editor) return null;
  return (
    <div className="border border-slate-300 bg-white rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-300">
        <ToolBtn tip="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={16} />
        </ToolBtn>
        <ToolBtn tip="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={16} />
        </ToolBtn>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <ToolBtn
          tip="Paragraph"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 size={16} />
        </ToolBtn>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <ToolBtn
          tip="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Strike"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <Link2 size={16} />
        </ToolBtn>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <ToolBtn
          tip="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 size={16} />
        </ToolBtn>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <ToolBtn
          tip="Align left"
          active={editor.isActive({ textAlign: "left" }) || editor.isActive("image", { textAlign: "left" })}
          onClick={() => {
            if (editor.isActive("image")) editor.chain().focus().updateAttributes("image", { textAlign: "left" }).run();
            else editor.chain().focus().setTextAlign("left").run();
          }}
        >
          <AlignLeft size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Align center"
          active={editor.isActive({ textAlign: "center" }) || editor.isActive("image", { textAlign: "center" })}
          onClick={() => {
            if (editor.isActive("image")) editor.chain().focus().updateAttributes("image", { textAlign: "center" }).run();
            else editor.chain().focus().setTextAlign("center").run();
          }}
        >
          <AlignCenter size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Align right"
          active={editor.isActive({ textAlign: "right" }) || editor.isActive("image", { textAlign: "right" })}
          onClick={() => {
            if (editor.isActive("image")) editor.chain().focus().updateAttributes("image", { textAlign: "right" }).run();
            else editor.chain().focus().setTextAlign("right").run();
          }}
        >
          <AlignRight size={16} />
        </ToolBtn>
        <ToolBtn
          tip="Justify"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify size={16} />
        </ToolBtn>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <ToolBtn
          tip="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2 size={16} />
        </ToolBtn>
        <ToolBtn tip="Insert image" onClick={() => fileRef.current?.click()}>
          <ImageIcon size={16} />
        </ToolBtn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImage(f);
            e.target.value = "";
          }}
        />
      </div>
      <EditorContent
        editor={editor}
        className="min-h-[300px] max-h-[45vh] overflow-auto"
      />
    </div>
  );
}
