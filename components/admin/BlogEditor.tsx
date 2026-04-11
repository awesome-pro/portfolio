"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { createClient } from "@/lib/supabase/client";
import type { JSONContent } from "@tiptap/react";

const lowlight = createLowlight(common);

interface BlogEditorProps {
  initialContent?: JSONContent;
  onChange: (json: JSONContent, text: string) => void;
}

export default function BlogEditor({
  initialContent,
  onChange,
}: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TiptapImage.configure({ allowBase64: false }),
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your blog post here…" }),
      Youtube.configure({ width: 840, height: 480 }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getText());
    },
  });

  if (!editor) return null;

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `inline/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(path, file);

    if (error) return null;

    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    return data.publicUrl;
  }

  function addYoutubeEmbed() {
    const url = prompt("Paste a YouTube or Vimeo URL:");
    if (url) editor?.commands.setYoutubeVideo({ src: url });
  }

  function addLink() {
    const url = prompt("Enter URL:");
    if (url) {
      editor
        ?.chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-border bg-background">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          B
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          1. List
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code block"
        >
          {"</>"}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          ❝
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link">
          Link
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              const url = await uploadImage(file);
              if (url) editor.chain().focus().setImage({ src: url }).run();
            };
            input.click();
          }}
          title="Upload image"
        >
          Image
        </ToolbarButton>
        <ToolbarButton onClick={addYoutubeEmbed} title="Embed video">
          Video
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          —
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="
          min-h-[420px] p-6 text-ink leading-relaxed
          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[380px]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-ink-faint
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:mt-6
          [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-5
          [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-4
          [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:text-ink-muted
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:text-ink-muted
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:text-ink-muted
          [&_.ProseMirror_li]:mb-1
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-ink-muted [&_.ProseMirror_blockquote]:my-4
          [&_.ProseMirror_pre]:bg-background [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-border [&_.ProseMirror_pre]:rounded-xl [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:text-sm
          [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-sm
          [&_.ProseMirror_:not(pre)>code]:bg-background [&_.ProseMirror_:not(pre)>code]:border [&_.ProseMirror_:not(pre)>code]:border-border [&_.ProseMirror_:not(pre)>code]:rounded [&_.ProseMirror_:not(pre)>code]:px-1.5 [&_.ProseMirror_:not(pre)>code]:py-0.5 [&_.ProseMirror_:not(pre)>code]:text-sm
          [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:border [&_.ProseMirror_img]:border-border [&_.ProseMirror_img]:my-4 [&_.ProseMirror_img]:max-w-full
          [&_.ProseMirror_iframe]:w-full [&_.ProseMirror_iframe]:aspect-video [&_.ProseMirror_iframe]:rounded-xl [&_.ProseMirror_iframe]:border [&_.ProseMirror_iframe]:border-border [&_.ProseMirror_iframe]:my-4
          [&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-6
          [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline
        "
      />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-8 min-w-[32px] px-2 rounded-lg font-mono text-xs transition-colors ${
        active
          ? "bg-ink text-background"
          : "text-ink-muted hover:bg-surface hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}
