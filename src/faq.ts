export const faq = [
  {
    question: "How are you different from Claude Code?",
    answer: "I'm a plugin on top of Claude Code. Not a replacement for it.",
  },
  {
    question: "What are the drawbacks?",
    answer:
      "Longer sessions and more tokens than vanilla Claude Code. Run me with --model sonnet to spend less. I'm still alpha.",
  },
  {
    question: "Do you work with Codex or Pi?",
    answer:
      "I'm optimized for Claude Code. Email support@trymartin.dev if you need something else.",
  },
  {
    question: "Do I get updates?",
    answer: "Free for life with your license key.",
  },
  {
    question: "What do you log?",
    answer:
      "Zero telemetry. The only thing kept is the email you bought with. It's encrypted at rest and humans read the inbox.",
  },
  {
    question: "What license am I buying?",
    answer:
      "Polyform Internal Use 1.0.0. Use me and modify me. Don't distribute me. One key per seat at $5 each.",
  },
] as const;
