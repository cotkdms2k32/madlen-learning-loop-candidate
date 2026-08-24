import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, GraduationCap, MessageCircleMore } from "lucide-react";

const stages = [
  {
    number: "01",
    phase: "Before class",
    title: "Prepare with purpose",
    description: "Turn a topic and grade level into a focused lesson outline and exactly five classroom-ready slides.",
    href: "/lesson",
    action: "Prepare a lesson",
    icon: BookOpenText,
  },
  {
    number: "02",
    phase: "During learning",
    title: "Guide, don’t give away",
    description: "Help students understand ideas at their level, with progressive hints that keep them doing the thinking.",
    href: "/chat",
    action: "Open student chat",
    icon: MessageCircleMore,
  },
  {
    number: "03",
    phase: "After learning",
    title: "Make feedback useful",
    description: "Review an essay across transparent criteria and turn specific observations into a shareable next step.",
    href: "/grader",
    action: "Review an essay",
    icon: GraduationCap,
  },
];

export default function HomePage() {
  return (
    <div className="page-stack home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">One connected learning lifecycle</span>
          <h1>From tomorrow’s lesson to the student’s next step.</h1>
          <p>
            Three focused AI tools help a teacher prepare, guide learning, and give clearer feedback—without turning the classroom into a generic chatbot.
          </p>
          <Link href="/lesson" className="button button-primary button-large">
            Start with lesson prep <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="hero-note" aria-label="Prototype principles">
          <span className="hero-note-label">Designed around teacher judgement</span>
          <ul>
            <li><CheckCircle2 size={18} /> Age-aware guidance</li>
            <li><CheckCircle2 size={18} /> Clear, structured outputs</li>
            <li><CheckCircle2 size={18} /> Teacher review at every step</li>
          </ul>
          <p>No accounts. No student records. Just the three core flows.</p>
        </div>
      </section>

      <section className="lifecycle" aria-labelledby="lifecycle-heading">
        <div className="section-heading">
          <span className="eyebrow">The learning loop</span>
          <h2 id="lifecycle-heading">Independently useful. Stronger together.</h2>
        </div>
        <div className="stage-grid">
          {stages.map(({ number, phase, title, description, href, action, icon: Icon }) => (
            <article className="stage-card" key={href}>
              <div className="stage-topline">
                <span className="stage-number">{number}</span>
                <Icon size={22} aria-hidden="true" />
              </div>
              <span className="stage-phase">{phase}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <Link href={href} className="text-link">
                {action} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
