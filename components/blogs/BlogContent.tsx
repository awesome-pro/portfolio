import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

const lowlight = createLowlight(common);

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  TiptapImage,
  TiptapLink,
  Youtube,
  CodeBlockLowlight.configure({ lowlight }),
];

export default function BlogContent({
  content,
}: {
  content: Record<string, unknown>;
}) {
  // Guard: TipTap JSON must have a `type` field
  if (!content || !content.type) return null;

  const html = generateHTML(content, extensions);

  return (
    <div
      className="
        blog-content text-ink leading-relaxed
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-ink [&_h1]:mt-10 [&_h1]:mb-4
        [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink [&_h2]:mt-8 [&_h2]:mb-3
        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-6 [&_h3]:mb-2
        [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-ink [&_h4]:mt-5 [&_h4]:mb-2
        [&_p]:text-base [&_p]:leading-7 [&_p]:text-ink-muted [&_p]:mb-4
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-80
        [&_strong]:text-ink [&_strong]:font-semibold
        [&_em]:italic
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-ink-muted
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:text-ink-muted
        [&_li]:mb-1.5 [&_li]:leading-7
        [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-ink-muted [&_blockquote]:italic [&_blockquote]:my-6
        [&_hr]:border-border [&_hr]:my-8
        [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_img]:my-6 [&_img]:w-full [&_img]:object-cover
        [&_pre]:bg-surface [&_pre]:border [&_pre]:border-border [&_pre]:rounded-xl [&_pre]:p-5 [&_pre]:my-6 [&_pre]:overflow-x-auto
        [&_code]:font-mono [&_code]:text-sm
        [&_pre_code]:text-ink-muted
        [&_:not(pre)>code]:bg-surface [&_:not(pre)>code]:border [&_:not(pre)>code]:border-border [&_:not(pre)>code]:rounded [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-sm [&_:not(pre)>code]:text-ink
        [&_.youtube-embed]:w-full [&_.youtube-embed]:aspect-video [&_.youtube-embed]:rounded-xl [&_.youtube-embed]:overflow-hidden [&_.youtube-embed]:my-6 [&_.youtube-embed]:border [&_.youtube-embed]:border-border
        [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:border [&_iframe]:border-border [&_iframe]:my-6
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
