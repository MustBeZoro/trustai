# TrustAI

A misinformation tracker demo built with Next.js, React, and Tailwind CSS.

TrustAI helps users spot suspicious messages by flagging common misinformation patterns and pointing to credible fact-checking sources. It includes:

- **Checker** — Paste a forwarded message or link and get a verdict (Supported / Contradicted / Unverified) with a list of warning signs, credible sources, and next steps to verify before sharing.
- **Learn** — A 3-question quiz that teaches you to recognize red flags like urgency language, phishing attempts, and conspiratorial framing.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) components
- [lucide-react](https://lucide.dev/) icons

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for production

```bash
npm run build
npm start
```

## Notes

This is a hackathon demo. The claim analysis uses keyword-based heuristics and mock data — it is not a real fact-checking engine. Always verify claims with official sources.
