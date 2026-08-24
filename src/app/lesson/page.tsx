"use client";

import { useState } from "react";
import { BookOpenText, Eye, MessagesSquare, Presentation } from "lucide-react";
import { CopyButton, ErrorNotice, GradeSelect, LoadingButton, ModuleIntro } from "@/components/Ui";
import { AppApiError, postJson } from "@/lib/client";
import type { LessonResponse } from "@/lib/schemas";

function formatLesson(lesson: LessonResponse) {
  return `${lesson.lessonTitle}\n\nOBJECTIVES\n${lesson.objectives.map((item) => `• ${item}`).join("\n")}\n\nKEY CONCEPTS\n${lesson.keyConcepts.map((item) => `• ${item}`).join("\n")}\n\nLESSON OUTLINE\n${lesson.outline.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\nFIVE-SLIDE PLAN\n${lesson.slides.map((slide, index) => `\nSlide ${index + 1}: ${slide.title}\n${slide.bullets.map((bullet) => `• ${bullet}`).join("\n")}\nVisual: ${slide.visualSuggestion}`).join("\n")}\n\nDISCUSSION QUESTIONS\n${lesson.discussionQuestions.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}

export default function LessonPage() {
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Grade 7");
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppApiError | null>(null);

  async function generateLesson(event?: React.FormEvent) {
    event?.preventDefault();
    if (topic.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await postJson<{ lesson: LessonResponse }>("/api/lesson", { topic, gradeLevel });
      setLesson(payload.lesson);
    } catch (requestError) {
      setError(requestError instanceof AppApiError ? requestError : new AppApiError("Something went wrong.", true));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <ModuleIntro
        eyebrow="Before class · Lesson Prep"
        title="Build the backbone of tomorrow’s lesson."
        description="Choose a topic and grade. You’ll get a clear outline, five proposed slides, and questions that open up discussion."
      />

      <div className="workspace-grid">
        <aside className="input-card">
          <form onSubmit={generateLesson} className="form-stack">
            <div className="field-group">
              <label htmlFor="lesson-topic">What are you teaching?</label>
              <input
                id="lesson-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={120}
                placeholder="e.g. Photosynthesis"
              />
              <div className="field-meta">
                <span>Use a focused topic or learning goal.</span>
                <span>{topic.length}/120</span>
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="lesson-grade">Grade level</label>
              <GradeSelect id="lesson-grade" value={gradeLevel} onChange={setGradeLevel} />
            </div>
            <button type="button" className="sample-chip" onClick={() => setTopic("How ecosystems stay in balance")}>Try an example</button>
            <LoadingButton loading={loading} disabled={topic.trim().length < 2}>Generate lesson plan</LoadingButton>
            <p className="form-footnote">AI creates a starting point. Review facts and adapt the plan to your class.</p>
          </form>
        </aside>

        <section className="output-area" aria-live="polite">
          {error && <ErrorNotice message={error.message} retryable={error.retryable} onRetry={() => generateLesson()} />}
          {loading && !lesson && <LessonSkeleton />}
          {!loading && !lesson && !error && (
            <div className="empty-state">
              <BookOpenText size={31} aria-hidden="true" />
              <h2>Your lesson plan will appear here</h2>
              <p>Start with one clear topic. The result stays easy to scan and edit.</p>
            </div>
          )}
          {lesson && (
            <div className={loading ? "result-stack result-muted" : "result-stack"}>
              <div className="result-heading">
                <div>
                  <span className="result-kicker">Lesson plan</span>
                  <h2>{lesson.lessonTitle}</h2>
                </div>
                <CopyButton text={formatLesson(lesson)} label="Copy lesson" />
              </div>

              <div className="two-column-card">
                <section>
                  <h3>Objectives</h3>
                  <ul className="clean-list">{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section>
                  <h3>Key concepts</h3>
                  <div className="tag-list">{lesson.keyConcepts.map((item) => <span key={item}>{item}</span>)}</div>
                </section>
              </div>

              <section className="content-card">
                <div className="card-title-row"><BookOpenText size={19} /><h3>Lesson outline</h3></div>
                <ol className="number-list">{lesson.outline.map((item) => <li key={item}>{item}</li>)}</ol>
              </section>

              <section>
                <div className="section-inline-title"><Presentation size={20} /><h3>Five proposed slides</h3><span>Exactly 5</span></div>
                <div className="slides-grid">
                  {lesson.slides.map((slide, index) => (
                    <article className="slide-card" key={`${slide.title}-${index}`}>
                      <span className="slide-index">Slide {index + 1}</span>
                      <h4>{slide.title}</h4>
                      <ul>{slide.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                      <div className="visual-note"><Eye size={15} /><span><strong>Visual:</strong> {slide.visualSuggestion}</span></div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="content-card discussion-card">
                <div className="card-title-row"><MessagesSquare size={19} /><h3>Discussion questions</h3></div>
                <ol className="number-list">{lesson.discussionQuestions.map((item) => <li key={item}>{item}</li>)}</ol>
              </section>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LessonSkeleton() {
  return <div className="skeleton-card" aria-label="Generating lesson"><span /><span /><span /><span /></div>;
}
