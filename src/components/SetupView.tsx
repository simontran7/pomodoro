import { useState } from "react";
import { tokenize } from "../diff";

interface SetupViewProps {
  onStart: (sourceText: string) => void;
}

export function SetupView({ onStart }: SetupViewProps) {
  const [text, setText] = useState("");
  const wordCount = tokenize(text).length;

  return (
    <section className="view active">
      <p className="hint">
        Paste the text you want to memorize.
      </p>
      <textarea
        placeholder="Paste text here..."
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="view-footer">
        <span className="wordcount">
          {wordCount} word{wordCount === 1 ? "" : "s"}
        </span>
        <button
          className="btn btn-primary"
          disabled={wordCount === 0}
          onClick={() => onStart(text)}
        >
          Start
        </button>
      </div>
    </section>
  );
}
