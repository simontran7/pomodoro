import { Fragment, useMemo } from "react";
import { buildRenderUnits, computeWordDiff, tokenize, tokenizeWithLayout } from "../diff";
import { formatDuration } from "../format";

interface ResultsViewProps {
  sourceText: string;
  typedText: string;
  elapsedMs: number;
  onRetry: () => void;
  onNewText: () => void;
}

export function ResultsView({
  sourceText,
  typedText,
  elapsedMs,
  onRetry,
  onNewText,
}: ResultsViewProps) {
  const { units, accuracy, matched, total } = useMemo(() => {
    const sourceTokens = tokenizeWithLayout(sourceText);
    const typedWords = tokenize(typedText);
    const wordOps = computeWordDiff(sourceTokens, typedWords);
    const units = buildRenderUnits(wordOps);
    const matched = wordOps.filter((o) => o.type === "equal").length;
    const total = sourceTokens.length;
    const accuracy = total ? Math.round((matched / total) * 100) : 0;
    return { units, accuracy, matched, total };
  }, [sourceText, typedText]);

  return (
    <section className="view active">
      <div className="results-stats">
        <div className="stat">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">accuracy</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {matched}/{total}
          </span>
          <span className="stat-label">words matched</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatDuration(elapsedMs)}</span>
          <span className="stat-label">time</span>
        </div>
      </div>

      <div className="results-controls">
        <div className="legend">
          <span className="legend-item">
            <span className="swatch swatch-equal" />
            correct
          </span>
          <span className="legend-item">
            <span className="swatch swatch-missing" />
            missed
          </span>
          <span className="legend-item">
            <span className="swatch swatch-extra" />
            extra
          </span>
        </div>
      </div>

      <div className="diff-output">
        {units.map((unit, idx) => (
          <Fragment key={idx}>
            {Array.from({ length: Math.min(unit.breaksBefore, 2) }).map((_, bidx) => (
              <br key={`br-${idx}-${bidx}`} />
            ))}
            {unit.kind === "substitution" ? (
              <span className="word word-sub">
                {unit.chars.map((c, cidx) => (
                  <span key={cidx} className={`char char-${c.type}`}>
                    {c.item}
                  </span>
                ))}
              </span>
            ) : (
              <span className={`word word-${unit.kind}`}>{unit.word}</span>
            )}
          </Fragment>
        ))}
      </div>

      <div className="view-footer">
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
        <button className="btn btn-primary" onClick={onNewText}>
          New text
        </button>
      </div>
    </section>
  );
}
