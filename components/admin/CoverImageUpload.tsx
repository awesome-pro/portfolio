"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface CoverImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function CoverImageUpload({
  value,
  onChange,
}: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium text-ink-muted font-mono">
        Cover image
      </label>

      {value ? (
        <div className="relative group">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
            <Image
              src={value}
              alt="Cover"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 border border-border text-ink-muted hover:text-destructive text-xs transition-colors flex items-center justify-center"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className="w-full aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-ink-faint hover:border-ink-muted hover:text-ink-muted transition-colors bg-surface disabled:opacity-50"
        >
          {uploading ? (
            <span className="font-mono text-xs">Uploading…</span>
          ) : (
            <>
              <span className="text-2xl">↑</span>
              <span className="font-mono text-xs">
                Click or drag & drop a cover image
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-xs text-destructive font-mono">{error}</p>}
    </div>
  );
}
