"use client";

import { Check, Clipboard, LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/client";
import { gradeLevels } from "@/lib/schemas";

export function ModuleIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="module-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function GradeSelect({
  value,
  onChange,
  id = "grade-level",
}: {
  value: string;
  onChange: (value: (typeof gradeLevels)[number]) => void;
  id?: string;
}) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value as (typeof gradeLevels)[number])}>
      {gradeLevels.map((grade) => (
        <option key={grade} value={grade}>{grade}</option>
      ))}
    </select>
  );
}

export function LoadingButton({
  loading,
  children,
  disabled,
}: {
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button className="button button-primary" type="submit" disabled={disabled || loading}>
      {loading && <LoaderCircle className="spin" size={17} aria-hidden="true" />}
      {loading ? "Thinking…" : children}
    </button>
  );
}

export function ErrorNotice({
  message,
  retryable,
  onRetry,
}: {
  message: string;
  retryable: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="notice notice-error" role="alert">
      <TriangleAlert size={19} aria-hidden="true" />
      <div>
        <strong>We couldn’t complete that request</strong>
        <p>{message}</p>
      </div>
      {retryable && onRetry && (
        <button type="button" className="button button-quiet" onClick={onRetry}>
          <RotateCcw size={15} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className="button button-secondary" onClick={handleCopy}>
      {copied ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
