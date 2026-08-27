import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { useRef, useCallback } from "react";
import { convertImageToBase64 } from "@/utils/imageToBase64";
import "./tiptap.css";

export default function TiptapEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: "Write your article content here..." }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      handlePaste: (_view, e) => {
        const items = Array.from(e.clipboardData?.items || []) as DataTransferItem[];
        const img = items.find((i) => i.type.startsWith("image/"));

        if (img) {
          e.preventDefault();
          const file = img.getAsFile();
          if (file) handleImage(file);
          return true;
        }

        return false;
      },
      handleDrop: (_view, e) => {
        const file = e.dataTransfer?.files[0];
        if (file?.type.startsWith("image/")) {
          e.preventDefault();
          handleImage(file);
          return true;
        }
        return false;
      },
    },
  });

  const handleImage = useCallback(async (file: File) => {
    try {
      const b64 = await convertImageToBase64(file);
      editor?.chain().focus().setImage({ src: b64 }).run();
    } catch (err: any) {
      alert(err.message);
    }
  }, [editor]);

  if (!editor) return null;
  const len = editor.getHTML().length;
  const warn = len > 450000;

  return (
    <div className="border border-slate-500 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-500">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className="px-2 py-1 text-xs border rounded hover:bg-white">↺</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className="px-2 py-1 text-xs border rounded hover:bg-white">↻</button>
        <select onChange={(e) => { const v=e.target.value; if(v==="p") editor.chain().focus().setParagraph().run(); else editor.chain().focus().toggleHeading({level: Number(v) as any}).run(); }} className="text-xs border rounded px-1 py-1">
          <option value="p">Paragraph</option><option value="1">H1</option><option value="2">H2</option><option value="3">H3</option>
        </select>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-xs border rounded ${editor.isActive("bold")?"bg-slate-800 text-white":"hover:bg-white"}`}><b>B</b></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-xs border rounded ${editor.isActive("italic")?"bg-slate-800 text-white":"hover:bg-white"}`}><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 text-xs border rounded ${editor.isActive("underline")?"bg-slate-800 text-white":"hover:bg-white"}`}><u>U</u></button>
        <button type="button" onClick={() => { const url=prompt("Enter URL"); if(url) editor.chain().focus().setLink({href:url}).run(); }} className="px-2 py-1 text-xs border rounded hover:bg-white">Link</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="px-2 py-1 text-xs border rounded hover:bg-white">• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className="px-2 py-1 text-xs border rounded hover:bg-white">1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className="px-2 py-1 text-xs border rounded hover:bg-white">Quote</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="px-2 py-1 text-xs border rounded hover:bg-white">Code</button>
        <button type="button" onClick={() => editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run()} className="px-2 py-1 text-xs border rounded hover:bg-white">Table</button>
        <button type="button" onClick={() => fileRef.current?.click()} className="px-2 py-1 text-xs border rounded hover:bg-white">Image</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) handleImage(f); e.target.value=""; }} />
      </div>
      <EditorContent editor={editor} className="min-h-[300px] max-h-[45vh] overflow-auto" />
      <div className={`text-xs px-3 py-1 border-t text-right ${warn?"text-amber-600":"text-slate-400"}`}>{len.toLocaleString()} / 500,000 chars {warn && "— approaching limit"}</div>
    </div>
  );
}