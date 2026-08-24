# Madlen Learning Loop – Candidate Prototype

A focused AI-powered prototype for one connected learning lifecycle:

**Live prototype:** https://madlen-learning-loop-candidate.netlify.app

**Source repository:** https://github.com/cotkdms2k32/madlen-learning-loop-candidate

- **Before class:** Lesson Prep Assistant
- **During learning:** Student Chatbot
- **After learning:** Essay Grader

The interface is English to match Madlen's current public product language and the case brief. AI output follows the language of the user's input, so Turkish topics, questions, and essays receive Turkish responses.

## What works

- Topic + grade → lesson objectives, key concepts, outline, **exactly five** proposed slides, and 2–3 discussion questions.
- Grade-aware student chat with progressive three-level hints for exercises instead of immediate answers.
- Essay review with four visible criteria, exact essay quotations, specific feedback, and a copyable student summary.
- Validated structured AI responses, input limits, loading/error/retry states, responsive layout, and teacher-review notices.
- No database, authentication, tracking, or client-side API key.

## Local setup

Requirements: Node.js 20.9+ and pnpm.

```bash
pnpm install
copy .env.example .env.local
```

Add a Groq key to `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Then run:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Validation

```bash
pnpm test
pnpm lint
pnpm build
```

The test set covers the required output shapes, exact slide count, chat limits and hint envelope, essay input limits, complete/unique rubric criteria, and passage-feedback balance.

## Deploy to Netlify

1. Push this repository to a Git provider and import it into Netlify.
2. Netlify reads `netlify.toml`, uses the pinned pnpm version, and runs `pnpm build` on Node 22. Its maintained OpenNext adapter is applied automatically.
3. In **Site configuration → Environment variables**, add `GROQ_API_KEY`. Optionally add `GROQ_MODEL`.
4. Deploy. Never place the key in a `NEXT_PUBLIC_*` variable.

Netlify's zero-configuration Next.js adapter handles the server-side route handlers. The Groq key is read only in `src/lib/groq.ts`, which imports `server-only`.

## Quota and failure behaviour

The prototype uses short context windows, bounded outputs, and a lightweight per-IP limiter (18 requests per 10 minutes) to protect the free API quota. If Groq returns a quota or temporary-service error, the UI explains the problem and offers retry without losing the user's input.

An automatic Gemini fallback was deliberately left out: it would add a second secret, a second output contract, and another provider/data path to validate for a three-day prototype. If the Groq allowance proves insufficient in real review traffic, the next controlled step is a manually enabled Gemini adapter behind the same validated schemas—not an untested silent failover.

## Repository map

```text
src/app/                 Pages and server API routes
src/components/          Shared navigation and UI primitives
src/lib/schemas.ts       Input/output contracts and JSON schemas
src/lib/prompts.ts       Pedagogical system instructions
src/lib/groq.ts          Server-only Groq client
src/lib/http.ts          Safe errors and lightweight rate limiting
src/lib/language.ts      English/Turkish content-language policy and checks
src/lib/schemas.test.ts  Representative validation tests
src/lib/language.test.ts Representative language-detection checks
CASE_STUDY_RESPONSE.md   Competitive, value proposition and growth response
PROCESS_NOTES.md         Concise development record and limitations
social/                  PYP Unit Planner social creative and source assets
output/pdf/              Polished strategic response and one-page process PDF
scripts/                 Reproducible PDF builder
```

## Security note

Do not paste real student personal data into this prototype. AI feedback is advisory and requires teacher review. The in-memory rate limiter is suitable for a demo, but a production system would require a shared limiter, authentication, retention controls, school agreements, and a full privacy/security review.
