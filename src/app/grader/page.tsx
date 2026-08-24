"use client";

import { FormEvent, useState } from "react";
import { GraduationCap, MessageSquareQuote, ShieldCheck, Sparkles } from "lucide-react";
import { CopyButton, ErrorNotice, LoadingButton, ModuleIntro } from "@/components/Ui";
import { AppApiError, postJson } from "@/lib/client";
import type { EssayResponse } from "@/lib/schemas";

const sampleEssay = `School gardens should be part of every community because they teach lessons that cannot be learned from a textbook alone. When students plant seeds, measure growth, and solve problems such as poor soil, science becomes something they can see and touch. Gardens can also provide vegetables for school meals and create a calm place where students work together. Some people argue that gardens cost too much time, but a small garden can be cared for by different classes on a schedule. For these reasons, a school garden is not just decoration; it is a practical classroom that benefits the whole community.`;

export default function GraderPage() {
  const [essay, setEssay] = useState("");
  const [result, setResult] = useState<EssayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppApiError | null>(null);

  async function gradeEssay(event?: FormEvent) {
    event?.preventDefault();
    if (essay.trim().length < 120) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await postJson<{ result: EssayResponse }>("/api/grader", { essay });
      setResult(payload.result);
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
            <div className={loading ? "result-stack result-muted" : "result-stack"}>
              <div className="score-hero">
                <div className="score-ring"><strong>{result.overallScore}</strong><span>/100</span></div>
                <div><span className="result-kicker">Advisory overall score</span><h2>Four-criteria review</h2><p>Use the detail below to apply your professional judgement.</p></div>
              </div>

              <div className="criteria-grid">
                {result.criteria.map((criterion) => (
                  <article className="criterion-card" key={criterion.name}>
                    <div className="criterion-score"><h3>{criterion.name}</h3><span>{criterion.score}/5</span></div>
                    <div className="score-track" aria-label={`${criterion.name}: ${criterion.score} out of 5`}><span style={{ width: `${criterion.score * 20}%` }} /></div>
                    <p>{criterion.rationale}</p>
                  </article>
                ))}
              </div>

              <section className="content-card">
                <div className="card-title-row"><MessageSquareQuote size={19} /><h3>Passage-specific feedback</h3></div>
                <div className="passage-list">
                  {result.passageFeedback.map((item, index) => (
                    <article className={`passage-item ${item.kind}`} key={`${item.passage}-${index}`}>
                      <span>{item.kind === "strength" ? "What works" : "Next step"}</span>
                      <blockquote>“{item.passage}”</blockquote>
                      <p>{item.feedback}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="summary-card">
                <div className="summary-heading"><div><Sparkles size={18} /><h3>Student-facing summary</h3></div><CopyButton text={result.studentSummary} label="Copy summary" /></div>
                <p>{result.studentSummary}</p>
              </section>

              <div className="advisory-banner"><ShieldCheck size={18} /><span><strong>Teacher review required.</strong> Check quotations, scores, and context before using this feedback.</span></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
