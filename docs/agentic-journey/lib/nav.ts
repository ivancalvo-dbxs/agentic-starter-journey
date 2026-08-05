// The single source of truth for reading order and for the landing page table.
// Derived from the old Docusaurus sidebars.ts. Slugs are the content/ paths
// without the .md extension, which are also the URL paths under /docs/, so the
// /docs/... links already written in the content resolve without rewriting.

export type Section = {
  /** Row number on the landing page. Omitted for the how-to-use preamble. */
  number?: number;
  /** Landing page label. */
  label: string;
  /** content/ path without .md, e.g. "01-prerequisites/index". */
  slug: string;
  /** Child pages, in reading order. */
  children?: { label: string; slug: string; children?: { label: string; slug: string }[] }[];
};

export const SECTIONS: Section[] = [
  { label: "How to use this site", slug: "how-to-use" },
  {
    number: 1,
    label: "Prerequisites",
    slug: "01-prerequisites/index",
    children: [
      { label: "Databricks CLI", slug: "01-prerequisites/databricks-cli" },
      { label: "Skill libraries", slug: "01-prerequisites/skill-libraries" },
    ],
  },
  {
    number: 2,
    label: "Infra setup",
    slug: "02-infra-setup/index",
    children: [
      {
        label: "Create workspaces",
        slug: "02-infra-setup/create-workspaces/index",
        children: [
          { label: "AWS", slug: "02-infra-setup/create-workspaces/aws" },
          { label: "Azure", slug: "02-infra-setup/create-workspaces/azure" },
          { label: "GCP", slug: "02-infra-setup/create-workspaces/gcp" },
        ],
      },
      { label: "Create groups", slug: "02-infra-setup/create-groups" },
      { label: "Metastore owner", slug: "02-infra-setup/metastore-owner" },
    ],
  },
  {
    number: 3,
    label: "Cost monitoring",
    slug: "03-cost-monitoring/index",
    children: [{ label: "Cost dashboards", slug: "03-cost-monitoring/cost-dashboards" }],
  },
  {
    number: 4,
    label: "Data governance strategy",
    slug: "04-data-governance-strategy/index",
    children: [
      { label: "Create catalogs", slug: "04-data-governance-strategy/create-catalogs" },
    ],
  },
  { number: 5, label: "Access your data", slug: "05-access-your-data" },
  {
    number: 6,
    label: "Build the first pipeline",
    slug: "06-build-first-pipeline/index",
    children: [
      { label: "Project repo", slug: "06-build-first-pipeline/project-repo" },
      { label: "Pipeline resource", slug: "06-build-first-pipeline/pipeline-resource" },
    ],
  },
  { number: 7, label: "Query and explore", slug: "07-query-and-explore" },
  {
    number: 8,
    label: "Unified analytics",
    slug: "08-unified-analytics/index",
    children: [
      { label: "Metric views", slug: "08-unified-analytics/metric-views" },
      { label: "Dashboards", slug: "08-unified-analytics/dashboards" },
      { label: "Genie Agents", slug: "08-unified-analytics/genie-agents" },
    ],
  },
  {
    number: 9,
    label: "Predictive analytics",
    slug: "09-predictive-analytics/index",
    children: [
      { label: "Feature tables", slug: "09-predictive-analytics/feature-tables" },
      { label: "Train and register", slug: "09-predictive-analytics/train-and-register" },
      { label: "Serving and batch", slug: "09-predictive-analytics/serving-and-batch" },
    ],
  },
  {
    number: 10,
    label: "Agents",
    slug: "10-agents/index",
    children: [
      { label: "Vector search", slug: "10-agents/vector-search" },
      { label: "Agent Bricks", slug: "10-agents/agent-bricks" },
      { label: "Evaluation", slug: "10-agents/evaluation" },
    ],
  },
  { number: 11, label: "Orchestration", slug: "11-orchestration" },
  { number: 12, label: "Data access control", slug: "12-data-access-control" },
  {
    number: 13,
    label: "CI/CD and DevOps",
    slug: "13-ci-cd-devops/index",
    children: [
      { label: "GitHub Actions", slug: "13-ci-cd-devops/github-actions" },
      { label: "Other providers", slug: "13-ci-cd-devops/other-providers" },
    ],
  },
];

/** Flattened reading order: every page, depth-first, exactly as the sidebar read. */
export const READING_ORDER: { label: string; slug: string }[] = SECTIONS.flatMap((s) => [
  { label: s.number ? `${s.number}. ${s.label}` : s.label, slug: s.slug },
  ...(s.children ?? []).flatMap((c) => [
    { label: c.label, slug: c.slug },
    ...(c.children ?? []),
  ]),
]);

/** URL path for a slug. "foo/index" serves at /docs/foo/, matching the old routes. */
export function hrefFor(slug: string): string {
  return `/docs/${slug.replace(/\/index$/, "")}`;
}

/** The next page in reading order, or null on the last page. */
export function nextOf(slug: string): { label: string; slug: string } | null {
  const i = READING_ORDER.findIndex((p) => p.slug === slug);
  return i >= 0 && i + 1 < READING_ORDER.length ? READING_ORDER[i + 1] : null;
}
