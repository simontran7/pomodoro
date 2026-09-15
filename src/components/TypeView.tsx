import { useEffect, useRef, useState } from "react";
import { tokenize } from "../diff";
import { formatDuration } from "../format";

interface TypeViewProps {
  onDone: (typedText: string, elapsedMs: number) => void;
}

export function TypeView({ onDone }: TypeViewProps) {
  const [started, setStarted] = useState(false);
  const [text, setText] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!started) return;
    startRef.current = performance.now();
    textareaRef.current?.focus();
    const handle = setInterval(() => {
      setElapsedMs(performance.now() - startRef.current);
    }, 100);
    return () => clearInterval(handle);
  }, [started]);

  const finish = () => {
    onDone(text, performance.now() - startRef.current);
  };

  const wordCount = tokenize(text).length;

  if (!started) {
    return (
      <section className="view active">
        <div className="view-footer" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={() => setStarted(true)}>
            Ready
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="view active">
      <div className="type-header">
        <span className="pill">{formatDuration(elapsedMs)}</span>
        <span className="pill">
          {wordCount} word{wordCount === 1 ? "" : "s"}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        className="type-textarea"
        placeholder="Type everything you remember..."
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            finish();
          }
        }}
      />
      <div className="view-footer">
        <span className="hint-small">⌘/Ctrl + Enter to finish</span>
        <button className="btn btn-primary" onClick={finish}>
          Done
        </button>
      </div>
    </section>
  );
}
