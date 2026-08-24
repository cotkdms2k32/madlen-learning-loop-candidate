"use client";

import { FormEvent, useState } from "react";
import { GraduationCap, MessageSquareQuote, ShieldCheck, Sparkles } from "lucide-react";
import { CopyButton, ErrorNotice, LoadingButton, ModuleIntro } from "@/components/Ui";
import { AppApiError, postJson } from "@/lib/client";
import { contentLanguageName, type ContentLocale } from "@/lib/language";
import type { EssayResponse } from "@/lib/schemas";

const sampleEssay = `School gardens should be part of every community because they teach lessons that cannot be learned from a textbook alone. When students plant seeds, measure growth, and solve problems such as poor soil, science becomes something they can see and touch. Gardens can also provide vegetables for school meals and create a calm place where students work together. Some people argue that gardens cost too much time, but a small garden can be cared for by different classes on a schedule. For these reasons, a school garden is not just decoration; it is a practical classroom that benefits the whole community.`;

const graderLabels = {
  en: {
    overallScore: "Advisory overall score",
    reviewTitle: "Four-criteria review",
    reviewDescription: "Use the detail below to apply your professional judgement.",
    passageFeedback: "Passage-specific feedback",
    strength: "What works",
    improvement: "Next step",
    summary: "Student-facing summary",
    copy: "Copy summary",
    copied: "Copied",
    reviewRequired: "Teacher review required.",
    reviewWarning: "Check quotations, scores, and context before using this feedback.",
    criteria: { Argument: "Argument", Clarity: "Clarity", Evidence: "Evidence", Structure: "Structure" },
  },
  tr: {
    overallScore: "Danışman niteliğinde genel puan",
    reviewTitle: "Dört ölçütlü değerlendirme",
    reviewDescription: "Aşağıdaki ayrıntıları mesleki değerlendirmenizle birlikte kullanın.",
    passageFeedback: "Metne dayalı geri bildirim",
    strength: "Güçlü yön",
    improvement: "Sonraki adım",
    summary: "Öğrenciyle paylaşılabilir özet",
    copy: "Özeti kopyala",
    copied: "Kopyalandı",
    reviewRequired: "Öğretmen incelemesi gerekli.",
    reviewWarning: "Bu geri bildirimi kullanmadan önce alıntıları, puanları ve bağlamı kontrol edin.",
    criteria: { Argument: "Sav", Clarity: "Açıklık", Evidence: "Kanıt", Structure: "Yapı" },
  },
} as const;

export default function GraderPage() {
  const [essay, setEssay] = useState("");
  const [result, setResult] = useState<EssayResponse | null>(null);
  const [contentLocale, setContentLocale] = useState<ContentLocale>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppApiError | null>(null);
  const labels = graderLabels[contentLocale];

  async function gradeEssay(event?: FormEvent) {
    event?.preventDefault();
    if (essay.trim().length < 120) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await postJson<{ result: EssayResponse; locale: ContentLocale }>("/api/grader", { essay });
      setResult(payload.result);
      setContentLocale(payload.locale);
    } catch (requestError) {
      setError(requestError instanceof AppApiError ? requestError : new AppApiError("Something went wrong.", true));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <ModuleIntro
        eyebrow="After learning · Essay Grader"
        title="Turn a draft into clear, teachable feedback."
        description="Review four visible criteria, see comments tied to the student’s own words, and copy a concise summary to share."
      />

      <div className="workspace-grid grader-workspace">
        <aside className="input-card essay-input-card">
          <form onSubmit={gradeEssay} className="form-stack">
            <div className="field-group">
              <label htmlFor="student-essay">Student essay</label>
              <textarea
                id="student-essay"
                value={essay}
                onChange={(event) => setEssay(event.target.value)}
                maxLength={8000}
                rows={17}
                placeholder="Paste the student’s essay here…"
              />
              <div className="field-meta">
                <span>{essay.length < 120 ? `${120 - essay.length} more characters needed` : "Ready to review"}</span>
                <span>{essay.length}/8,000</span>
              </div>
            </div>
            <button type="button" className="sample-chip" onClick={() => setEssay(sampleEssay)}>Use a sample essay</button>
            <LoadingButton loading={loading} disabled={essay.trim().length < 120}>Review essay</LoadingButton>
            <div className="advisory-note"><ShieldCheck size={16} /><span>AI feedback is advisory. A teacher should review it before grading or sharing.</span></div>
          </form>
        </aside>

        <section className="output-area" aria-live="polite">
          {error && <ErrorNotice message={error.message} retryable={error.retryable} onRetry={() => gradeEssay()} />}
          {loading && !result && <div className="skeleton-card tall"><span /><span /><span /><span /><span /></div>}
          {!loading && !result && !error && (
            <div className="empty-state">
              <GraduationCap size={32} aria-hidden="true" />
              <h2>Feedback will appear here</h2>
              <p>The review uses the same four criteria every time, so the reasoning stays visible.</p>
            </div>
          )}
          {result && (
            <div className={loading ? "result-stack result-muted" : "result-stack"} lang={contentLocale}>
              <div className="score-hero">
                <div className="score-ring"><strong>{result.overallScore}</strong><span>/100</span></div>
                <div><span className="result-kicker">{labels.overallScore}</span><h2>{labels.reviewTitle}</h2><p>{labels.reviewDescription}</p><span className="language-note">Content language · {contentLanguageName(contentLocale)}</span></div>
              </div>

              <div className="criteria-grid">
                {result.criteria.map((criterion) => (
                  <article className="criterion-card" key={criterion.name}>
                    <div className="criterion-score"><h3>{labels.criteria[criterion.name]}</h3><span>{criterion.score}/5</span></div>
                    <div className="score-track" aria-label={contentLocale === "tr" ? `${labels.criteria[criterion.name]}: 5 üzerinden ${criterion.score}` : `${labels.criteria[criterion.name]}: ${criterion.score} out of 5`}><span style={{ width: `${criterion.score * 20}%` }} /></div>
                    <p>{criterion.rationale}</p>
                  </article>
                ))}
              </div>

              <section className="content-card">
                <div className="card-title-row"><MessageSquareQuote size={19} /><h3>{labels.passageFeedback}</h3></div>
                <div className="passage-list">
                  {result.passageFeedback.map((item, index) => (
                    <article className={`passage-item ${item.kind}`} key={`${item.passage}-${index}`}>
                      <span>{item.kind === "strength" ? labels.strength : labels.improvement}</span>
                      <blockquote>“{item.passage}”</blockquote>
                      <p>{item.feedback}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="summary-card">
                <div className="summary-heading"><div><Sparkles size={18} /><h3>{labels.summary}</h3></div><CopyButton text={result.studentSummary} label={labels.copy} copiedLabel={labels.copied} /></div>
                <p>{result.studentSummary}</p>
              </section>

              <div className="advisory-banner"><ShieldCheck size={18} /><span><strong>{labels.reviewRequired}</strong> {labels.reviewWarning}</span></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
