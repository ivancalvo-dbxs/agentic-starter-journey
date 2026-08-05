import Head from "next/head";
import Link from "next/link";
import { SECTIONS, hrefFor } from "@/lib/nav";

const DESCRIPTION =
  "Machine-readable runbooks that take a coding agent from an empty Databricks account to a deployed, bundle-defined project.";

const CONTRACT: { block: string; use: string }[] = [
  { block: "Mental Model", use: "What the page's topic is and why it exists." },
  { block: "Goal", use: "The single outcome the page produces." },
  { block: "Prerequisites", use: "What must be true before running. Agent checks first." },
  { block: "Skill", use: "The exact skill to invoke, and which library ships it." },
  { block: "Inputs", use: "Table of values. Source says human-provided or agent-derived." },
  { block: "Run", use: "The commands or skill invocation." },
  { block: "Verify", use: "A runnable check plus its expected output." },
  { block: "Where this fails", use: "Silent-failure traps: symptom, cause, fix." },
  { block: "Next", use: "Do next, manual fallback, reference." },
];

const SECTION_BLURB: Record<string, string> = {
  "01-infra-setup/index":
    "One-time platform work, driven by Terraform through ai-platform-kit.",
  "02-databricks-projects/index":
    "From the workspace edge inward, everything is a bundle resource through databricks-agent-skills.",
};

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Agentic Starter Journey</title>
        <meta name="description" content={DESCRIPTION} />
      </Head>
      <main className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Agentic Starter Journey
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
          {DESCRIPTION}
        </p>

        <section className="mt-14">
          <h2 className="text-base font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            How to read a page
          </h2>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            Every page is written for a coding agent, not a human. A human sends the agent a page URL and an outcome. The agent reads the page, collects the inputs, invokes the skill, and runs the verification.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 dark:text-neutral-400">
                  <th className="py-2 pr-4 font-medium">Block</th>
                  <th className="py-2 font-medium">What the agent does with it</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {CONTRACT.map((c) => (
                  <tr key={c.block}>
                    <td className="py-2 pr-4 font-mono text-neutral-900 dark:text-neutral-100">{c.block}</td>
                    <td className="py-2 text-neutral-600 dark:text-neutral-400">{c.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <nav aria-label="Contents" className="mt-16">
          <ul className="divide-y divide-neutral-200 border-t border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {SECTIONS.map((s) => (
              <li key={s.slug} className="py-5">
                <Link href={hrefFor(s.slug)} className="group flex items-baseline gap-4 no-underline">
                  <span className="w-6 shrink-0 text-right font-mono text-sm text-neutral-400 dark:text-neutral-600">
                    {s.number}
                  </span>
                  <span className="text-lg text-neutral-900 group-hover:underline dark:text-neutral-100">
                    {s.label}
                  </span>
                </Link>
                <p className="mt-1 pl-10 text-sm text-neutral-600 dark:text-neutral-400">
                  {SECTION_BLURB[s.slug]}
                </p>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </>
  );
}
