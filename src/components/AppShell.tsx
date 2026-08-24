"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, GraduationCap, House, MessageCircleMore, Sparkles } from "lucide-react";

const navigation = [
  { href: "/", label: "Overview", icon: House },
  { href: "/lesson", label: "Lesson Prep", icon: BookOpenText },
  { href: "/chat", label: "Student Chat", icon: MessageCircleMore },
  { href: "/grader", label: "Essay Grader", icon: GraduationCap },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Madlen Learning Loop home">
          <span className="brand-copy">
            <Image
              className="brand-logo"
              src="/madlen-logo.svg"
              alt="Madlen"
              width={140}
              height={32}
              priority
            />
            <small>Candidate Prototype · Learning Loop</small>
          </span>
        </Link>
        <div className="prototype-pill">
          <Sparkles size={14} aria-hidden="true" /> Candidate prototype
        </div>
      </header>

      <nav className="primary-nav" aria-label="Learning loop modules">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <main className="main-content">{children}</main>
      <footer className="site-footer">
        <span>Built for thoughtful teaching and guided learning.</span>
        <span>AI output should always be reviewed by an educator.</span>
      </footer>
    </div>
  );
}
