"use client";

import { FormEvent, useRef, useState } from "react";
import { ArrowUp, Lightbulb, MessageCircleMore, RotateCcw, ShieldCheck } from "lucide-react";
import { ErrorNotice, GradeSelect, ModuleIntro } from "@/components/Ui";
import { AppApiError, postJson } from "@/lib/client";
import type { ChatResponse } from "@/lib/schemas";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  answer?: ChatResponse;
};

export default function ChatPage() {
  const [topic, setTopic] = useState("Fractions");
  const [gradeLevel, setGradeLevel] = useState("Grade 5");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppApiError | null>(null);
  const lastQuestion = useRef("");

  async function sendMessage(event?: FormEvent, retryText?: string) {
    event?.preventDefault();
    const question = (retryText ?? draft).trim();
    if (!question || topic.trim().length < 2 || loading) return;

    const userMessage: UiMessage = { id: crypto.randomUUID(), role: "user", content: question };
    const nextMessages = retryText ? messages : [...messages, userMessage];
    if (!retryText) {
      setMessages(nextMessages);
      setDraft("");
    }
    lastQuestion.current = question;
    setLoading(true);
    setError(null);

    try {
      const apiMessages = nextMessages.slice(-9).map(({ role, content }) => ({ role, content }));
      const payload = await postJson<{ answer: ChatResponse }>("/api/chat", {
        topic,
        gradeLevel,
        messages: apiMessages,
      });
      const assistantMessage: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `${payload.answer.reply}\n\n${payload.answer.checkForUnderstanding}`,
        answer: payload.answer,
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (requestError) {
      setError(requestError instanceof AppApiError ? requestError : new AppApiError("Something went wrong.", true));
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    setMessages([]);
    setError(null);
    setDraft("");
  }

  return (
    <div className="page-stack chat-page">
      <ModuleIntro
        eyebrow="During learning · Student Chat"
        title="A learning conversation that keeps students thinking."
        description="Answers adjust to the selected grade. Practice questions begin with a hint—not the final answer."
      />

      <section className="chat-config" aria-label="Chat learning context">
        <div className="field-group compact-field">
          <label htmlFor="chat-topic">Topic</label>
          <input id="chat-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={120} placeholder="e.g. Fractions" />
        </div>
        <div className="field-group compact-field">
          <label htmlFor="chat-grade">Grade level</label>
          <GradeSelect id="chat-grade" value={gradeLevel} onChange={setGradeLevel} />
        </div>
        <button type="button" className="button button-quiet reset-button" onClick={resetChat} disabled={messages.length === 0}>
          <RotateCcw size={15} /> New conversation
        </button>
      </section>

      <div className="chat-frame">
        <div className="chat-trustbar">
          <span><ShieldCheck size={16} /> Teacher-guided learning space</span>
          <span>No personal information, please.</span>
        </div>
        <div className="messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <span className="guide-avatar"><MessageCircleMore size={24} /></span>
              <h2>Hi, I’m Loop Guide.</h2>
              <p>I can explain {topic || "your topic"}, ask you questions, or help you work through a problem one step at a time.</p>
              <div className="suggestion-row">
                <button type="button" onClick={() => setDraft(`Explain ${topic || "this topic"} in a simple way.`)}>Explain the idea</button>
                <button type="button" onClick={() => setDraft(`Give me a practice question about ${topic || "this topic"}.`)}>Give me practice</button>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <span className="message-author">{message.role === "user" ? "You" : "Loop Guide"}</span>
              {message.answer?.mode === "guided_practice" && (
                <span className="hint-label"><Lightbulb size={13} /> Hint {Math.max(message.answer.hintLevel, 1)} of 3</span>
              )}
              {message.content.split("\n").map((line, index) => line ? <p key={`${message.id}-${index}`}>{line}</p> : null)}
            </article>
          ))}
          {loading && (
            <article className="message assistant typing" aria-label="Loop Guide is thinking">
              <span /><span /><span />
            </article>
          )}
          {error && <ErrorNotice message={error.message} retryable={error.retryable} onRetry={() => sendMessage(undefined, lastQuestion.current)} />}
        </div>

        <form className="chat-composer" onSubmit={(event) => sendMessage(event)}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={1200}
            rows={2}
            placeholder="Ask a question or share a problem you’re working on…"
            aria-label="Message Loop Guide"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />
          <button type="submit" className="send-button" aria-label="Send message" disabled={!draft.trim() || !topic.trim() || loading}>
            <ArrowUp size={20} />
          </button>
          <span className="composer-meta">Enter to send · Shift + Enter for a new line</span>
        </form>
      </div>
    </div>
  );
}
