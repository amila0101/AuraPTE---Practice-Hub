import { useState, useEffect } from "react";

interface WritingEditorProps {
  onChange?: (text: string) => void;
}

const WritingEditor = ({ onChange }: WritingEditorProps) => {
  const [text, setText] = useState("");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    onChange?.(text);
  }, [text, onChange]);

  return (
    <div className="rounded-xl border bg-card p-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing your response here..."
        className="w-full min-h-[200px] p-5 bg-transparent resize-y text-sm leading-relaxed focus:outline-none text-foreground placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between border-t px-5 py-2.5 text-xs text-muted-foreground">
        <span>{wordCount} words</span>
        <span>{text.length} characters</span>
      </div>
    </div>
  );
};

export default WritingEditor;
