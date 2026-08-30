import { useEditor, EditorContent } from "@tiptap/react";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Table2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useRef } from "react";
import "./tiptap.css";
import { tiptapExtensions } from "./TiptapExtensions";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function ToolbarButton({
  tooltip,
  pressed,
  onClick,
  children,
}: {
  tooltip: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={pressed}
            onPressedChange={onClick}
            className={`
              h-9 w-9
              border border-transparent
              text-slate-700
              hover:bg-slate-100
              transition-colors
              ${pressed ? "!bg-black !text-white hover:!bg-black" : ""}
            `}
          >
            {children}
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function TiptapEditor({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: tiptapExtensions,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addImage = (file: File) => {
    if (!editor) return;

    const reader = new FileReader();

    reader.onload = () => {
      editor
        .chain()
        .focus()
        .setImage({
          src: reader.result as string,
        })
        .run();
    };

    reader.readAsDataURL(file);
  };

  if (!editor) return null;

  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-white">
        <ToolbarButton
          tooltip="Bold"
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>

        <ToolbarButton
          tooltip="Italic"
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>

        <ToolbarButton
          tooltip="Underline"
          pressed={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>

        <ToolbarButton
          tooltip="Heading 1"
          pressed={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={16} />
        </ToolbarButton>

        <ToolbarButton
          tooltip="Heading 2"
          pressed={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>

        <ToolbarButton
          tooltip="Bullet List"
          pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>

        <ToolbarButton
          tooltip="Ordered List"
          pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <ToolbarButton
          tooltip="Link"
          pressed={editor.isActive("link")}
          onClick={() => {
            const url = prompt("Enter URL");
            if (!url) return;
            editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <Link2 size={16} />
        </ToolbarButton>

        <ToolbarButton
          tooltip="Table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2 size={16} />
        </ToolbarButton>

        <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()}>
          <ImageIcon size={16} />
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addImage(file);
          }}
        />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="editor-content" />

      {/* Footer */}
      <div className="border-t px-3 py-2 text-xs text-slate-500 text-right">
        {editor.storage.characterCount.characters()} characters
      </div>
    </div>
  );
}