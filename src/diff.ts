export type DiffOpType = "equal" | "missing" | "extra";

export interface DiffOp<T> {
  type: DiffOpType;
  item: T;
}

export interface WordToken {
  word: string;
  // Number of newlines between this word and the previous one (0 = same
  // line, 1 = new line, 2+ = a blank line / paragraph break before it).
  breaksBefore: number;
}

export function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

// Like tokenize, but keeps track of the line breaks between words so the
// diff output can reproduce the source text's original line structure.
export function tokenizeWithLayout(text: string): WordToken[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const tokens: WordToken[] = [];
  let pendingBreaks = 0;

  for (const line of lines) {
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (tokens.length > 0) pendingBreaks++;
      continue;
    }
    words.forEach((word, idx) => {
      const breaksBefore =
        idx === 0 && tokens.length > 0 ? pendingBreaks + 1 : 0;
      tokens.push({ word, breaksBefore });
    });
    pendingBreaks = 0;
  }

  return tokens;
}

function diffTokens<T>(a: T[], b: T[], key: (t: T) => string): DiffOp<T>[] {
  const n = a.length;
  const m = b.length;

  const dp: Uint32Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Uint32Array(m + 1);

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (key(a[i]) === key(b[j])) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const ops: DiffOp<T>[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(a[i]) === key(b[j])) {
      ops.push({ type: "equal", item: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "missing", item: a[i] });
      i++;
    } else {
      ops.push({ type: "extra", item: b[j] });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: "missing", item: a[i] });
    i++;
  }
  while (j < m) {
    ops.push({ type: "extra", item: b[j] });
    j++;
  }

  return ops;
}

export function computeWordDiff(
  sourceTokens: WordToken[],
  typedWords: string[],
): DiffOp<WordToken>[] {
  const key = (t: WordToken) => t.word.toLowerCase();
  const typedTokens: WordToken[] = typedWords.map((word) => ({
    word,
    breaksBefore: 0,
  }));
  return diffTokens(sourceTokens, typedTokens, key);
}

function diffChars(sourceWord: string, typedWord: string): DiffOp<string>[] {
  const key = (c: string) => c.toLowerCase();
  return diffTokens(Array.from(sourceWord), Array.from(typedWord), key);
}

// A render unit is either a whole word (equal / pure insertion / pure
// deletion) or a "substitution": a missing word immediately adjacent to an
// extra word, broken down into a character-level diff so only the actual
// difference between the two is highlighted instead of the whole word twice.
export type RenderUnit =
  | { kind: "equal" | "missing" | "extra"; word: string; breaksBefore: number }
  | { kind: "substitution"; chars: DiffOp<string>[]; breaksBefore: number };

export function buildRenderUnits(wordOps: DiffOp<WordToken>[]): RenderUnit[] {
  const units: RenderUnit[] = [];
  let i = 0;
  while (i < wordOps.length) {
    const current = wordOps[i];
    const next = i + 1 < wordOps.length ? wordOps[i + 1] : null;

    if (
      current.type !== "equal" &&
      next &&
      next.type !== "equal" &&
      next.type !== current.type
    ) {
      const missingOp = current.type === "missing" ? current : next;
      const extraOp = current.type === "extra" ? current : next;
      units.push({
        kind: "substitution",
        chars: diffChars(missingOp.item.word, extraOp.item.word),
        breaksBefore: missingOp.item.breaksBefore,
      });
      i += 2;
    } else {
      units.push({
        kind: current.type,
        word: current.item.word,
        breaksBefore: current.item.breaksBefore,
      });
      i += 1;
    }
  }
  return units;
}
