import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
  Unlink,
} from "lucide-react";

import { sanitizeRichTextHtml } from "./richText";

type RichTextEditorProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const toolbarButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-brand-200 hover:text-brand-600 hover:bg-brand-50";

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = "",
  onChange,
  placeholder = "Write text here...",
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const normalizedValue = useMemo(() => sanitizeRichTextHtml(value || ""), [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if ((editor.innerHTML || "") !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const nextValue = sanitizeRichTextHtml(editor.innerHTML || "");
    if (editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue;
    }
    onChange(nextValue);
  };

  const exec = (command: string, commandValue?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const insertLink = () => {
    const url = window.prompt("Enter link URL", "https://");
    if (!url) return;
    exec("createLink", url.trim());
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    syncValue();
  };

  const activeEditorClass =
    "min-h-[140px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={toolbarButtonClass}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className={toolbarButtonClass}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className={toolbarButtonClass}>
          <Underline className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertLink} className={toolbarButtonClass}>
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("unlink")} className={toolbarButtonClass}>
          <Unlink className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} className={toolbarButtonClass}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} className={toolbarButtonClass}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("removeFormat")} className={toolbarButtonClass}>
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        {!isFocused && !normalizedValue ? (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400">
            {placeholder}
          </div>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          className={activeEditorClass}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            syncValue();
          }}
          onInput={syncValue}
          onPaste={handlePaste}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
