import Head from "next/head";
import Link from "next/link";
import { SECTIONS, hrefFor } from "@/lib/nav";

const TAGLINE =
  "Machine-readable runbooks that take a coding agent from an empty Databricks account to a deployed project.";

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Agentic Journey</title>
        <meta name="description" content={TAGLINE} />
      </Head>
      <main className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Agentic Journey
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
          {TAGLINE}
        </p>

        <nav aria-label="Contents" className="mt-14">
          <ul className="divide-y divide-neutral-200 border-t border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {SECTIONS.map((s) => (
              <li key={s.slug}>
                <Link
                  href={hrefFor(s.slug)}
                  className="group flex items-baseline gap-4 py-3.5 no-underline"
                >
                  <span className="w-6 shrink-0 text-right font-mono text-sm text-neutral-400 dark:text-neutral-600">
                    {s.number ?? ""}
                  </span>
                  <span className="text-neutral-900 group-hover:underline dark:text-neutral-100">
                    {s.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </>
  );
}
