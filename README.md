# TrustAI

A misinformation tracker demo built with Next.js, React, and Tailwind CSS.

TrustAI helps users spot suspicious messages by flagging common misinformation patterns and pointing to credible fact-checking sources. It includes:

- **Pause** — Wait ✋️, Before clicking on any suspicious link or forwarding a message,stop. Take a moment to copy the link and Analyze it using TrustAI instead of reacting immediately.
- **Check** — Paste a forwarded message or link and get a verdict (Supported / Contradicted / Unverified) with a list of warning signs, credible sources, and next steps to verify before sharing.
- **Verify** — TrustAI automatically cross-references the content and provides trusted external resources, like cybersecurity links and fact-checking databases, so you can confidently confirm the facts.
- **Learn** — A  3-level quiz consisting of 5-question each directly derived from ai that teaches you to recognize red flags like urgency language, phishing attempts, and conspiratorial framing.

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

 **Accessibility & Security Features**

- ***​🌐 Multilingual Support***: TrustAI is built for a global audience with a dropdown menu for real-time translation into 10 distinct languages. Users can seamlessly switch between:  
​🇬🇧 English  
​🇮🇳 हिंदी (Hindi)  
​🇪🇸 Español (Spanish)  
​🇫🇷 Français (French)  
​🇨🇳 中文 (Chinese)  
​🇯🇵 日本語 (Japanese)  
​🇸🇦 العربية (Arabic)  
​🇵🇰 اردو (Urdu)  
​🇧🇩 বাংলা (Bangla)  
​🇵🇹 Português (Portuguese)


- ***​🎨 Customizable Themes***: Personalize your interface with a dynamic color palette selector tailored to your visual preference. Available accent colors include:  
​🟣 Purple  
​🔵 Cyan  
​🔴 Red  
​🟢 Green  
​🟠 Orange  


- ***​📞 Cybersecurity Dial***: Instant access to a dedicated cybersecurity helpline directly from the interface, ensuring users have immediate professional support when encountering severe digital threats or scams.


**This is a hackathon demo. The claim analysis uses keyword-based heuristics and mock data — it is not a real fact-checking engine. Always verify claims with official sources.**

- *Made by Suraj Singh Rawat*
- *School of Management Science,Lucknow* 
- *BCA 1st Year-'B'*
- *PURPOSE — RotaTech HACKATHON-2026*
