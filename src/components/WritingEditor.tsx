import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Scissors, Copy, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

interface WritingEditorProps {
  onChange?: (text: string) => void;
}

const WritingEditor = ({ onChange }: WritingEditorProps) => {
  const [text, setText] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    onChange?.(text);
  }, [text, onChange]);

  // Prevent keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+X)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
      e.preventDefault();
      toast.warning("Please use the on-screen buttons for Cut, Copy, and Paste.");
    }
  };

  const handleCustomCut = () => {
    if (!textAreaRef.current) return;
    const { selectionStart, selectionEnd, value } = textAreaRef.current;
    if (selectionStart === selectionEnd) return;
    
    const selectedText = value.substring(selectionStart, selectionEnd);
    navigator.clipboard.writeText(selectedText);
    
    const newText = value.substring(0, selectionStart) + value.substring(selectionEnd);
    setText(newText);
    
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.setSelectionRange(selectionStart, selectionStart);
      }
    }, 0);
  };

  const handleCustomCopy = () => {
    if (!textAreaRef.current) return;
    const { selectionStart, selectionEnd, value } = textAreaRef.current;
    if (selectionStart === selectionEnd) return;
    
    const selectedText = value.substring(selectionStart, selectionEnd);
    navigator.clipboard.writeText(selectedText);
    textAreaRef.current.focus();
  };

  const handleCustomPaste = async () => {
    if (!textAreaRef.current) return;
    try {
      const clipboardText = await navigator.clipboard.readText();
      const { selectionStart, selectionEnd, value } = textAreaRef.current;
      
      const newText = value.substring(0, selectionStart) + clipboardText + value.substring(selectionEnd);
      setText(newText);
      
      const newCursorPos = selectionStart + clipboardText.length;
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } catch (err) {
      toast.error("Please allow clipboard access to use Paste.");
    }
  };

  return (
    <div className="rounded-xl border bg-card p-1">
      <div className="flex gap-2 px-3 py-2 border-b bg-muted/20">
        <Button variant="outline" size="sm" onClick={handleCustomCut} className="h-8 text-xs font-semibold gap-1.5" type="button">
          <Scissors className="h-3.5 w-3.5" /> Cut
        </Button>
        <Button variant="outline" size="sm" onClick={handleCustomCopy} className="h-8 text-xs font-semibold gap-1.5" type="button">
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleCustomPaste} className="h-8 text-xs font-semibold gap-1.5" type="button">
          <ClipboardPaste className="h-3.5 w-3.5" /> Paste
        </Button>
      </div>
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        placeholder="Start typing your response here..."
        className="w-full min-h-[200px] p-5 bg-transparent resize-y text-sm leading-relaxed focus:outline-none text-foreground placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between border-t px-5 py-2.5 text-xs text-muted-foreground">
        <span>Word Count: {wordCount}</span>
        <span>{text.length} characters</span>
      </div>
    </div>
  );
};

export default WritingEditor;
