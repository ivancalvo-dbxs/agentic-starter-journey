import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Agentic Journey',
  tagline: 'Machine-readable runbooks that take a coding agent from an empty Databricks account to a deployed project.',
  favicon: 'img/databricks-logo-orange.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here.
  url: 'https://ivancalvo-dbxs.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/agentic-journey/',

  // GitHub pages deployment config
  organizationName: 'ivancalvo-dbxs',
  projectName: 'agentic-journey',

  onBrokenLinks: 'throw',

  plugins: [
    [
      require.resolve('docusaurus-plugin-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        searchResultLimits: 15,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          numberPrefixParser: false,
        },
        blog: false,
        theme: {
          customCss: ['./src/css/custom.css'],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: false,
      disableSwitch: false,
    },
    navbar: {
      title: 'Agentic Journey',
      logo: {
        alt: 'Agentic Journey Logo',
        src: 'img/databricks.ico',
      },
      items: [
        // Plain links rather than type: 'doc'. A doc-type item activates for the
        // whole docs plugin, so with two of them both light up on every doc page.
        {
          to: '/docs/how-to-use',
          position: 'left',
          label: 'How to use',
        },
        {
          to: '/docs/01-prerequisites/',
          position: 'left',
          label: 'Prerequisites',
        },
        {
          href: 'https://github.com/ivancalvo-dbxs/agentic-journey',
          label: 'GitHub',
          position: 'right',
          className: 'navbar-item-github',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Databricks Industry Solutions`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
