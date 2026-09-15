import { useState } from "react";
import { SetupView } from "./components/SetupView";
import { TypeView } from "./components/TypeView";
import { ResultsView } from "./components/ResultsView";
import "./App.css";

type Stage = "setup" | "type" | "results";

interface Attempt {
  typedText: string;
  elapsedMs: number;
}

function App() {
  const [stage, setStage] = useState<Stage>("setup");
  const [sourceText, setSourceText] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [typeKey, setTypeKey] = useState(0);

  const startWith = (text: string) => {
    setSourceText(text);
    setAttempt(null);
    setTypeKey((k) => k + 1);
    setStage("type");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <svg
            className="app-logo"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              fill="#2f9e44"
              d="M27.5 6.5c2.5-2 6-3 8.5-1.5 1 .6.8 2-.3 2.3-2.3.6-4.4 1.7-5.9 3.6-1 1.3-2.9 1.2-3.6-.3-.6-1.4-.2-3 1.3-4.1Z"
            />
            <path
              fill="#ff9f1c"
              d="M24 43.5c-9.9 0-17-7.7-17-16.9 0-9.6 7-17.3 15.6-19.4 5.6-1.4 11.6.2 15.6 4.3 3.6 3.7 5.3 8.9 4.6 14.1-1.3 10.1-9 17.9-18.8 17.9Z"
            />
            <path
              fill="#ffbf47"
              d="M38.2 11.5c3.6 3.7 5.3 8.9 4.6 14.1-1.3 10.1-9 17.9-18.8 17.9-2.4 0-4.7-.4-6.8-1.3 3 1.9 6.6 2.8 10.4 2.3 9.8-1.3 16.9-10.3 16.9-20.1 0-4.9-1.9-9.4-5-12.7-.4-.4-.9-.8-1.3-1.2.4.3.7.6 1 1Z"
            />
          </svg>
          mango
        </h1>
      </header>

      <main>
        {stage === "setup" && <SetupView onStart={startWith} />}

        {stage === "type" && (
          <TypeView
            key={typeKey}
            onDone={(typedText, elapsedMs) => {
              setAttempt({ typedText, elapsedMs });
              setStage("results");
            }}
          />
        )}

        {stage === "results" && attempt && (
          <ResultsView
            sourceText={sourceText}
            typedText={attempt.typedText}
            elapsedMs={attempt.elapsedMs}
            onRetry={() => {
              setAttempt(null);
              setTypeKey((k) => k + 1);
              setStage("type");
            }}
            onNewText={() => {
              setSourceText("");
              setAttempt(null);
              setStage("setup");
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
