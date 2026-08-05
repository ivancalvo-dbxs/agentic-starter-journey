// The single source of truth for reading order and for the landing page table.
// Slugs are content/ paths without .md, which are also the URL paths under /docs/.

export type Section = {
  /** Row number on the landing page. */
  number: number;
  /** Landing page label. */
  label: string;
  /** content/ path without .md, e.g. "01-infra-setup/index". */
  slug: string;
  /** Child pages, in reading order. Added per-task as pages land. */
  children?: { label: string; slug: string }[];
};

export const SECTIONS: Section[] = [
  {
    number: 1,
    label: "Infra Setup",
    slug: "01-infra-setup/index",
    children: [
      { label: "Pre-requisites", slug: "01-infra-setup/prerequisites" },
      { label: "Workspaces", slug: "01-infra-setup/workspaces" },
      { label: "Catalogs", slug: "01-infra-setup/catalogs" },
      { label: "Cloud Object Storage access", slug: "01-infra-setup/cloud-object-storage" },
    ],
  },
  {
    number: 2,
    label: "Databricks Projects",
    slug: "02-databricks-projects/index",
    children: [
      { label: "Project repo", slug: "02-databricks-projects/project-repo" },
    ],
  },
];

/** Flattened reading order: every page, depth-first. */
export const READING_ORDER: { label: string; slug: string }[] = SECTIONS.flatMap((s) => [
  { label: `${s.number}. ${s.label}`, slug: s.slug },
  ...(s.children ?? []),
]);

/** URL path for a slug. "foo/index" serves at /docs/foo/. */
export function hrefFor(slug: string): string {
  return `/docs/${slug.replace(/\/index$/, "")}`;
}

/** The next page in reading order, or null on the last page. */
export function nextOf(slug: string): { label: string; slug: string } | null {
  const i = READING_ORDER.findIndex((p) => p.slug === slug);
  return i >= 0 && i + 1 < READING_ORDER.length ? READING_ORDER[i + 1] : null;
}
