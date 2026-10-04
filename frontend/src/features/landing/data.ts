// Shared static data for landing page sections.
// Keep this file as the single source of truth for copy/content.

export const LANDING_HEADLINE = 'See why your AI agent failed.';

export const LANDING_TAGLINE =
  'Black Box turns agent execution traces into evidence-backed diagnoses, causal chains, and replayable outcome proofs.';

export const ANNOUNCEMENT = 'Trace → Diagnose → Replay';

export const FAQ_ITEMS = [
  {
    q: 'What is Black Box?',
    a: 'Black Box is a developer tool for diagnosing failures inside AI agent execution traces. It records every step, identifies the suspect using a trained model, exposes the causal chain, and lets you replay from a checkpoint to prove a fix works.',
  },
  {
    q: 'What does a trace contain?',
    a: "A trace is a sequence of steps — model calls, tool invocations, retrieval lookups, parsing, and state changes. Each step records its input, output, latency, token usage, and an error flag.",
  },
  {
    q: 'How does diagnosis work?',
    a: "The diagnosis model assigns a blame score to every step based on learned failure patterns. The highest-scoring step becomes the suspect. A deterministic fallback is used when the trained model isn't available.",
  },
  {
    q: 'What is a causal chain?',
    a: 'The causal chain traces data dependencies from the suspect step to the final answer. Any downstream step that reads from the suspect\'s output is included, showing how one early fault propagates.',
  },
  {
    q: 'How does replay prove a diagnosis?',
    a: "Replay re-runs the trace from a checkpoint with the suspect step's output patched. If the final answer changes, the suspect was causally responsible. If it doesn't, the trace continues without interruption.",
  },
  {
    q: 'What does the evaluation dashboard measure?',
    a: 'Top-1 accuracy (exact blame match), Top-3 accuracy (suspect in top 3), and F1 score — all on held-out traces with known ground-truth faults, compared against majority-class and random baselines.',
  },
  {
    q: 'Do I need a live agent to use Black Box?',
    a: 'No. Black Box operates on recorded traces stored as JSONL. Demo mode includes five pre-seeded runs covering common failure modes.',
  },
];
