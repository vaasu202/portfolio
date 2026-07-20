const experiences = [
  {
    role: "Data Scientist Intern (Co-op)",
    company: "Delta Dental Insurance",
    period: "Jun 2025 — Present",
    summary:
      "Building governed GenAI analytics, document intelligence, and large-scale healthcare ML systems across Dataiku, Snowflake, Azure OpenAI, and MLflow.",
    highlights: [
      "Architected a Provider Insights AI platform spanning 131 datasets and reduced LLM analytics latency by 80%+.",
      "Built a vision-language invoice pipeline for handwritten and non-standard formats, removing hundreds of manual hours.",
      "Led self-supervised transformer learning across 3M+ claims, improving recall 40%+ over baseline models.",
      "Engineered partition-aware Oracle SQL pipelines for multimillion-row actuarial and government-program workloads.",
    ],
    tags: ["GenAI", "Dataiku", "Snowflake", "Azure OpenAI", "PyTorch", "MLflow"],
  },
  {
    role: "Data Scientist",
    company: "Ernst & Young (EY)",
    period: "Jan 2023 — Jun 2024",
    summary:
      "Advised Fortune 500 teams on cloud ML architecture, experimentation, data modernization, and production inference.",
    highlights: [
      "Cut enterprise ETL latency from 4+ hours to under 30 minutes across 5M+ daily records.",
      "Reduced retraining time 30% and improved inference accuracy 15% through AWS SageMaker modernization.",
      "Designed A/B tests and uplift models that drove a 30% revenue KPI lift across client portfolios.",
      "Deployed multi-region FastAPI services with zero-downtime rollouts and 25% faster delivery.",
    ],
    tags: ["AWS", "SageMaker", "Airflow", "FastAPI", "Causal ML", "Docker"],
  },
  {
    role: "Data Science Intern",
    company: "Ernst & Young (EY)",
    period: "Jun 2022 — Aug 2022",
    summary:
      "Built cross-validated models and controlled experiments across 10+ client engagements for Operations and Marketing teams.",
    highlights: [
      "Improved submission rates 20% and decision quality 25% with classification, regression, and uplift modeling.",
    ],
    tags: ["Experimentation", "Regression", "Uplift Modeling"],
  },
  {
    role: "Software Engineering Intern",
    company: "Exodrone Systems",
    period: "Dec 2021 — Jun 2022",
    summary:
      "Extended Mission Planner across frontend and backend systems using C#, .NET, and REST APIs.",
    highlights: [
      "Improved operator efficiency 35% and cut mission configuration load time 60%.",
    ],
    tags: ["C#", ".NET", "REST APIs"],
  },
  {
    role: "Data Science Intern",
    company: "NIIT Technologies",
    period: "Jun 2021 — Dec 2021",
    summary:
      "Developed and deployed a production CNN with real-time inference and automated drift monitoring.",
    highlights: ["Achieved 95%+ accuracy with sub-100ms inference latency."],
    tags: ["PyTorch", "CNN", "Model Monitoring"],
  },
];

const skillGroups = [
  {
    label: "Cloud & data",
    skills: ["AWS", "Snowflake", "Docker", "Kubernetes", "Airflow", "Spark", "Dataiku"],
  },
  {
    label: "ML systems",
    skills: ["PyTorch Lightning", "Transformers", "MLflow", "FastAPI", "CI/CD", "Optuna"],
  },
  {
    label: "GenAI",
    skills: ["LangGraph", "LangChain", "RAG", "Pydantic", "Ragas", "LangSmith", "TruLens"],
  },
  {
    label: "Analytics",
    skills: ["Forecasting", "A/B Testing", "Uplift Modeling", "Causal Inference", "SQL"],
  },
];

const projects = [
  {
    type: "Applied ML · Jackson National Life",
    title: "Demand & Capacity Forecasting",
    description:
      "A multi-segment forecasting system combining Temporal Fusion Transformer and SARIMAX across 40+ contract segments.",
    outcome: "$3.5M annual risk reduction",
    metrics: "22% RMSE · 18% MAPE improvement",
    href: null,
  },
  {
    type: "Independent · Agentic AI",
    title: "Multi-Agent GenAI Retrieval Platform",
    description:
      "A grounded operational intelligence system with LangGraph, GPT-4.1, ChromaDB hybrid retrieval, structured tool use, and Pydantic validation.",
    outcome: "Deterministic, grounded outputs",
    metrics: "LangGraph · RAG · Streamlit",
    href: "https://github.com/vaasu202/Agentic-RAG-Postmortem-Reporting",
  },
  {
    type: "Published Research · ICMLANT",
    title: "ECG Anomaly Detection",
    description:
      "A peer-reviewed interpretable autoencoder framework for anomaly detection and pattern recognition on clinical ECG signals.",
    outcome: "Peer-reviewed publication",
    metrics: "Autoencoders · Clinical ML",
    href: "https://ieeexplore.ieee.org/document/10372979",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Vaasu Sohee, home">
          VS<span>.</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
        </nav>
        <a className="nav-cta" href="mailto:soheevaa@msu.edu">
          Let&apos;s talk <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Data scientist · Data engineer</div>
          <h1>
            I turn complex data into
            <span className="gradient-text"> systems that move.</span>
          </h1>
          <p className="hero-lede">
            I build production ML, data platforms, and GenAI systems—from first experiment to reliable deployment—then translate them into outcomes leaders can act on.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#projects">Explore selected work <span aria-hidden="true">↓</span></a>
            <a className="button button-secondary" href="resume.pdf" target="_blank">View résumé <span aria-hidden="true">↗</span></a>
          </div>
          <div className="availability"><span className="pulse" /> Based in Michigan · Open to data & AI roles</div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="data-card data-card-main">
            <span className="card-kicker">Current focus</span>
            <strong>Reliable AI at production scale</strong>
            <div className="signal-row">
              <i /><i /><i /><i /><i /><i />
            </div>
          </div>
          <div className="data-card data-card-float">
            <span>Systems</span>
            <strong>ML × Data × GenAI</strong>
          </div>
          <div className="orbit orbit-one"><span /></div>
          <div className="orbit orbit-two"><span /></div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Career highlights">
        <div><strong>131</strong><span>datasets unified in a governed AI layer</span></div>
        <div><strong>80%+</strong><span>LLM analytics latency reduction</span></div>
        <div><strong>$3.5M</strong><span>annual risk reduction modeled</span></div>
        <div><strong>4.0</strong><span>M.S. Data Science GPA</span></div>
      </section>

      <section className="section work-section" id="work">
        <div className="section-heading">
          <span className="section-number">01</span>
          <div><p className="section-kicker">Experience</p><h2>Systems built.<br />Outcomes delivered.</h2></div>
          <p className="section-intro">Five industry placements across healthcare, insurance, aerospace, and Fortune 500 consulting.</p>
        </div>

        <div className="timeline">
          {experiences.map((experience, index) => (
            <article className="experience" key={`${experience.company}-${experience.role}`}>
              <div className="timeline-marker"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="experience-main">
                <div className="experience-head">
                  <div><h3>{experience.role}</h3><p>{experience.company}</p></div>
                  <time>{experience.period}</time>
                </div>
                <p className="experience-summary">{experience.summary}</p>
                <ul>{experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
                <div className="tag-row">{experience.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section projects-section" id="projects">
        <div className="section-heading compact">
          <span className="section-number">02</span>
          <div><p className="section-kicker">Selected work</p><h2>Where rigor meets<br />real-world value.</h2></div>
        </div>
        <div className="project-grid">
          {projects.map((project, index) => {
            const content = (
              <>
                <div className="project-top"><span>{project.type}</span><span className="project-index">0{index + 1}</span></div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-result"><strong>{project.outcome}</strong><span>{project.metrics}</span></div>
                <span className="project-link">{project.href ? "View project" : "NDA-protected work"} <b aria-hidden="true">↗</b></span>
              </>
            );
            return project.href ? (
              <a className={`project-card project-${index + 1}`} href={project.href} target="_blank" rel="noreferrer" key={project.title}>{content}</a>
            ) : (
              <article className={`project-card project-${index + 1}`} key={project.title}>{content}</article>
            );
          })}
        </div>
      </section>

      <section className="section expertise-section" id="about">
        <div className="section-heading">
          <span className="section-number">03</span>
          <div><p className="section-kicker">Toolkit</p><h2>Built across the<br />whole data stack.</h2></div>
          <p className="section-intro">A systems mindset grounded in statistics, engineering discipline, and clear communication.</p>
        </div>
        <div className="skills-grid">
          {skillGroups.map((group, index) => (
            <article className="skill-card" key={group.label}>
              <span className="skill-index">0{index + 1}</span>
              <h3>{group.label}</h3>
              <div>{group.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
            </article>
          ))}
        </div>

        <div className="about-grid">
          <article className="about-copy">
            <p className="section-kicker">The through-line</p>
            <h3>Technical depth, business clarity.</h3>
            <p>I specialize in building production-grade ML systems end to end—from self-supervised transformer architectures and causal inference pipelines to multi-region inference and GenAI retrieval platforms.</p>
            <p>My best work happens where statistical rigor, reliable engineering, and high-stakes decisions overlap.</p>
          </article>
          <div className="education-stack">
            <article>
              <span>Michigan State University</span>
              <h3>M.S. Data Science</h3>
              <p>4.0 / 4.0 GPA</p>
              <small>Machine Learning · NLP · Foundations of LLMs · Statistics · Optimization</small>
            </article>
            <article>
              <span>NIIT University</span>
              <h3>B.Tech Computer Science</h3>
              <p>3.6 / 4.0 GPA</p>
            </article>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-orbit" aria-hidden="true"><span /><span /><span /></div>
        <p className="section-kicker">Have a hard data problem?</p>
        <h2>Let&apos;s build something<br /><em>that matters.</em></h2>
        <a className="contact-email" href="mailto:soheevaa@msu.edu">soheevaa@msu.edu <span aria-hidden="true">↗</span></a>
        <div className="contact-links">
          <a href="https://www.linkedin.com/in/vaasu-sohee/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
          <a href="https://github.com/vaasu202" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="tel:+15174907865">517-490-7865</a>
        </div>
      </section>

      <footer>
        <a className="wordmark" href="#top">VS<span>.</span></a>
        <p>Designed for signal, built with care.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
