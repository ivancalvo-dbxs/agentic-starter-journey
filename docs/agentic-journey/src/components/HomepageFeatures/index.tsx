import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Written for agents',
    description: (
      <>
        No screenshots, no click-throughs. Each page states the goal, the inputs to
        collect, the skill to invoke, and a runnable verification check.
      </>
    ),
  },
  {
    title: 'Two skill libraries',
    description: (
      <>
        ai-platform-kit provisions the platform. databricks-agent-skills builds the
        data and AI assets on top of it. Every page names the skill it needs.
      </>
    ),
  },
  {
    title: 'Ends in a DABs repo',
    description: (
      <>
        Start with an empty account. Finish with a bundle-defined project deployed
        from CI/CD to dev, staging, and production.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className="col col--4">
      <div className={styles.featureCard}>
        <div className={styles.featureContent}>
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
          <p className={styles.featureDescription}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
