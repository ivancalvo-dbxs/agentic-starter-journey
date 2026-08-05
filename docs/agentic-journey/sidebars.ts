import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {type: 'doc', id: 'how-to-use', label: 'How to use this site'},
    {
      type: 'category',
      label: '1. Prerequisites',
      collapsed: true,
      link: {type: 'doc', id: '01-prerequisites/index'},
      items: [
        '01-prerequisites/databricks-cli',
        '01-prerequisites/skill-libraries',
      ],
    },
    {
      type: 'category',
      label: '2. Infra setup',
      collapsed: true,
      link: {type: 'doc', id: '02-infra-setup/index'},
      items: [
        {
          type: 'category',
          label: 'Create workspaces',
          link: {type: 'doc', id: '02-infra-setup/create-workspaces/index'},
          items: [
            '02-infra-setup/create-workspaces/aws',
            '02-infra-setup/create-workspaces/azure',
            '02-infra-setup/create-workspaces/gcp',
          ],
        },
        '02-infra-setup/create-groups',
        '02-infra-setup/metastore-owner',
      ],
    },
    {
      type: 'category',
      label: '3. Cost monitoring',
      collapsed: true,
      link: {type: 'doc', id: '03-cost-monitoring/index'},
      items: [
        '03-cost-monitoring/cost-dashboards',
      ],
    },
    {
      type: 'category',
      label: '4. Data governance strategy',
      collapsed: true,
      link: {type: 'doc', id: '04-data-governance-strategy/index'},
      items: [
        '04-data-governance-strategy/create-catalogs',
      ],
    },
    {type: 'doc', id: '05-access-your-data', label: '5. Access your data'},
    {
      type: 'category',
      label: '6. Build the first pipeline',
      collapsed: true,
      link: {type: 'doc', id: '06-build-first-pipeline/index'},
      items: [
        '06-build-first-pipeline/project-repo',
        '06-build-first-pipeline/pipeline-resource',
      ],
    },
    {type: 'doc', id: '07-query-and-explore', label: '7. Query and explore'},
    {
      type: 'category',
      label: '8. Unified analytics',
      collapsed: true,
      link: {type: 'doc', id: '08-unified-analytics/index'},
      items: [
        '08-unified-analytics/metric-views',
        '08-unified-analytics/dashboards',
        '08-unified-analytics/genie-agents',
      ],
    },
    {
      type: 'category',
      label: '9. Predictive analytics',
      collapsed: true,
      link: {type: 'doc', id: '09-predictive-analytics/index'},
      items: [
        '09-predictive-analytics/feature-tables',
        '09-predictive-analytics/train-and-register',
        '09-predictive-analytics/serving-and-batch',
      ],
    },
    {
      type: 'category',
      label: '10. Agents',
      collapsed: true,
      link: {type: 'doc', id: '10-agents/index'},
      items: [
        '10-agents/vector-search',
        '10-agents/agent-bricks',
        '10-agents/evaluation',
      ],
    },
    {type: 'doc', id: '11-orchestration', label: '11. Orchestration'},
    {type: 'doc', id: '12-data-access-control', label: '12. Data access control'},
    {
      type: 'category',
      label: '13. CI/CD and DevOps',
      collapsed: true,
      link: {type: 'doc', id: '13-ci-cd-devops/index'},
      items: [
        '13-ci-cd-devops/github-actions',
        '13-ci-cd-devops/other-providers',
      ],
    },
  ],
};

export default sidebars;
