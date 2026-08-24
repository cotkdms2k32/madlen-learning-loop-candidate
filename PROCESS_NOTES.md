# Process Notes — Madlen Learning Loop

## Major product and UX decisions

I treated the three requested tools as one learning loop rather than three unrelated demos: prepare before class, guide during learning, and review after learning. Each module still works on its own, but shares one calm navigation, vocabulary, visual system, and teacher-review posture. The navigation, forms, system states, and prototype framing are English because the case and Madlen's current public product are English-first. The learning workspace follows the user's content language: generated text, result-section labels, rubric names, hint labels, and copied exports switch together between English and Turkish. The server also rejects a model response when its language does not match the input, preventing mixed-language feedback from being displayed.

The MVP intentionally has no accounts, database, saved history, admin area, or automatic curriculum selector. Those additions would consume the deadline without improving the three review tasks. Teacher-facing outputs are structured for scanning and copying. Student chat is not a generic answer bot: practice requests trigger up to three progressive hints and a check-for-understanding question. Essay feedback always uses four named criteria, must include both a strength and an improvement, and only displays passage quotations that exist verbatim in the pasted essay.

## AI and technical tools used

- **Groq API + `openai/gpt-oss-120b`:** runtime generation. Chosen because Groq offers a no-cost developer tier and this production model supports strict JSON-schema structured outputs. It is called only from Next.js server routes.
- **Zod + strict JSON Schema:** validates both user inputs and model responses before rendering. This protects exact requirements such as five slides and four unique criteria.
- **Next.js + TypeScript:** one responsive application with server routes, typed contracts, and straightforward Netlify deployment.
- **Codex:** implementation, prompt iteration, research synthesis, test creation, build checks, and browser-based end-to-end QA.
- **Web research:** checked Madlen, MagicSchool, Brisk, Groq and Netlify claims against current first-party pages rather than relying on memory.
- **Image generation:** used only for the required static social post, not the product UI, so the application stays fast and reproducible.

## Real changes during development

The first architecture sketch considered a Groq SDK and a second-provider fallback. I replaced the SDK with a small native `fetch` client to reduce dependencies, and postponed Gemini failover because a second provider adds another secret, data path and response format to validate. Instead, the MVP bounds context/output length, rate-limits demo traffic, classifies provider errors, and preserves inputs for retry.

I also strengthened the essay flow after live testing: beyond schema validation, the server now rejects invented quotations by checking every returned passage against the submitted essay. The rubric validator rejects duplicate criteria and requires both positive and improvement feedback.

## Remaining limitations

- No persistence: refresh clears generated work and conversations.
- No real school/user controls, shared rate-limit store, audit log, or moderation dashboard.
- Grade adaptation and pedagogical quality still depend on model behaviour; educator review remains necessary.
- “Curriculum alignment” is not claimed in this prototype because no curriculum source, standard identifier or retrieval layer is supplied.
- The free Groq quota is appropriate for review traffic, not guaranteed classroom-scale concurrency.

## What to improve next

First validate the loop with 5–10 teachers: can they complete all three stages, how much time is saved, and where do they edit AI output? If evidence is positive, add curriculum-grounded generation with cited standards, teacher-controlled chat guardrails, saved/exportable work, and a provider adapter that can be deliberately switched to Gemini after equivalent safety and output tests.
