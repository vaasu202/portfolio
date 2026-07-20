"use client";

import { useCallback, useEffect, useState } from "react";

const zones = [
  { id: "command", key: "1", label: "Command" },
  { id: "missions", key: "2", label: "Campaign" },
  { id: "projects", key: "3", label: "Encounters" },
  { id: "armory", key: "4", label: "Loadout" },
  { id: "academy", key: "5", label: "Academy" },
];

const experiences = [
  {
    code: "ACTIVE_05",
    status: "IN PROGRESS",
    role: "Data Scientist Intern (Co-op)",
    company: "Delta Dental Insurance",
    period: "Jun 2025 - Present",
    summary: "Building governed GenAI analytics, document intelligence, and healthcare ML systems across the full production stack.",
    highlights: [
      "Unified 131 datasets in a governed Provider Insights AI platform and cut LLM analytics latency by 80%+.",
      "Built a vision-language invoice pipeline for handwritten and non-standard formats, eliminating hundreds of manual hours.",
      "Led self-supervised transformer learning across 3M+ claims, improving recall 40%+ over baselines.",
      "Engineered partition-aware Oracle SQL and Dataiku pipelines for multimillion-row actuarial workloads.",
      "Designed backup, recovery, and version-controlled ML lifecycle infrastructure with MLflow.",
    ],
    reward: "+4 major systems",
    tags: ["GenAI", "Dataiku", "Snowflake", "Azure OpenAI", "PyTorch", "MLflow"],
  },
  {
    code: "MISSION_04",
    status: "COMPLETE",
    role: "Data Scientist",
    company: "Ernst & Young (EY)",
    period: "Jan 2023 - Jun 2024",
    summary: "Advised Fortune 500 teams on cloud ML architecture, experimentation, data modernization, and production inference.",
    highlights: [
      "Cut ETL latency from 4+ hours to under 30 minutes across 5M+ daily records.",
      "Reduced retraining time 30% and improved inference accuracy 15% through AWS SageMaker modernization.",
      "Designed A/B tests and uplift models that drove a 30% revenue KPI lift.",
      "Deployed multi-region FastAPI services with zero-downtime rollouts and 25% faster delivery.",
    ],
    reward: "+30% revenue KPI",
    tags: ["AWS", "SageMaker", "Airflow", "FastAPI", "Causal ML", "Docker"],
  },
  {
    code: "MISSION_03",
    status: "COMPLETE",
    role: "Data Science Intern",
    company: "Ernst & Young (EY)",
    period: "Jun 2022 - Aug 2022",
    summary: "Built cross-validated models and controlled experiments across 10+ client engagements.",
    highlights: ["Improved submission rates 20% and decision quality 25% for Operations and Marketing teams."],
    reward: "+10 engagements",
    tags: ["Experimentation", "Regression", "Uplift Modeling"],
  },
  {
    code: "MISSION_02",
    status: "COMPLETE",
    role: "Software Engineering Intern",
    company: "Exodrone Systems",
    period: "Dec 2021 - Jun 2022",
    summary: "Extended Mission Planner across frontend and backend systems using C#, .NET, and REST APIs.",
    highlights: ["Improved operator efficiency 35% and cut mission configuration load time 60%."],
    reward: "+60% load speed",
    tags: ["C#", ".NET", "REST APIs"],
  },
  {
    code: "MISSION_01",
    status: "COMPLETE",
    role: "Data Science Intern",
    company: "NIIT Technologies",
    period: "Jun 2021 - Dec 2021",
    summary: "Developed and deployed a production CNN with real-time inference and automated drift monitoring.",
    highlights: ["Achieved 95%+ accuracy with sub-100ms inference latency."],
    reward: "+95% accuracy",
    tags: ["PyTorch", "CNN", "Model Monitoring"],
  },
];

const projects = [
  {
    encounter: "LEGENDARY / NDA",
    difficulty: "★★★★★",
    title: "Demand & Capacity Forecasting",
    client: "Jackson National Life",
    description: "A multi-segment forecasting system combining Temporal Fusion Transformer and SARIMAX across 40+ contract segments, validated with walk-forward testing.",
    reward: "$3.5M",
    rewardLabel: "annual risk reduction",
    stats: ["22% RMSE improvement", "18% MAPE improvement", "40+ segments"],
    tools: ["TFT", "SARIMAX", "Time Series", "Python"],
    href: null,
  },
  {
    encounter: "EPIC / OPEN SOURCE",
    difficulty: "★★★★☆",
    title: "Multi-Agent GenAI Retrieval Platform",
    client: "Independent Project",
    description: "A deterministic operational intelligence system using LangGraph, GPT-4.1, ChromaDB hybrid retrieval, structured tool use, and Pydantic validation.",
    reward: "RAG",
    rewardLabel: "grounded agentic outputs",
    stats: ["Hybrid retrieval", "Structured calling", "Natural-language Q&A"],
    tools: ["LangGraph", "GPT-4.1", "ChromaDB", "Streamlit"],
    href: "https://github.com/vaasu202/Agentic-RAG-Postmortem-Reporting",
  },
  {
    encounter: "RARE / PUBLISHED",
    difficulty: "★★★★☆",
    title: "ECG Anomaly Detection",
    client: "ICMLANT / IEEE",
    description: "A peer-reviewed interpretable autoencoder framework for anomaly detection and pattern recognition on clinical ECG signals.",
    reward: "IEEE",
    rewardLabel: "peer-reviewed research",
    stats: ["Clinical ECG", "Interpretable ML", "Anomaly detection"],
    tools: ["Autoencoders", "PyTorch", "Clinical ML"],
    href: "https://ieeexplore.ieee.org/document/10372979",
  },
];

const skillGroups = [
  { icon: "01", label: "Cloud Infrastructure", level: 88, skills: ["AWS S3", "SageMaker", "Athena", "Bedrock", "Snowflake", "Docker", "Kubernetes"] },
  { icon: "02", label: "Data Engineering", level: 92, skills: ["ETL / ELT", "Airflow", "Spark", "Dataiku", "Oracle SQL", "PostgreSQL", "Optimization"] },
  { icon: "03", label: "ML Systems", level: 94, skills: ["PyTorch Lightning", "Transformers", "MLflow", "FastAPI", "Optuna", "CI/CD"] },
  { icon: "04", label: "GenAI Systems", level: 91, skills: ["LangGraph", "LangChain", "RAG", "Prompt Engineering", "Pydantic", "Azure OpenAI"] },
  { icon: "05", label: "Evaluation", level: 86, skills: ["LLM-as-a-Judge", "Ragas", "LangSmith", "TruLens", "MLflow Evaluate", "Observability"] },
  { icon: "06", label: "Decision Science", level: 89, skills: ["Forecasting", "A/B Testing", "Uplift Modeling", "Causal Inference", "Predictive Analytics"] },
];

const achievements = [
  { code: "DATA_ARCHITECT", value: "131", label: "Datasets governed", tone: "lime" },
  { code: "SPEED_RUNNER", value: "80%+", label: "Latency eliminated", tone: "violet" },
  { code: "RISK_BREAKER", value: "$3.5M", label: "Annual risk reduced", tone: "gold" },
  { code: "PERFECT_RUN", value: "4.0", label: "Graduate GPA", tone: "cyan" },
];

export default function Home() {
  const [activeZone, setActiveZone] = useState("command");
  const [progress, setProgress] = useState(0);
  const [visited, setVisited] = useState<string[]>(["command"]);
  const [scanMode, setScanMode] = useState(false);
  const [warping, setWarping] = useState(false);

  const jumpTo = useCallback((id: string) => {
    const destination = document.getElementById(id);
    if (!destination) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      destination.scrollIntoView({ behavior: "auto" });
      return;
    }

    setWarping(true);
    window.setTimeout(() => destination.scrollIntoView({ behavior: "smooth" }), 180);
    window.setTimeout(() => setWarping(false), 760);
  }, []);

  useEffect(() => {
    let scrollFrame = 0;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));

    const syncScrollMotion = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.round((window.scrollY / total) * 100)) : 0);

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const commandZone = document.querySelector<HTMLElement>(".command-zone");
      const manifesto = document.querySelector<HTMLElement>(".manifesto-zone");

      if (!reducedMotion && commandZone) {
        const rect = commandZone.getBoundingClientRect();
        const sceneProgress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
        commandZone.style.setProperty("--command-shift", `${(sceneProgress - 0.5) * 62}px`);
      }

      if (!reducedMotion && manifesto) {
        const rect = manifesto.getBoundingClientRect();
        const sceneProgress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
        manifesto.style.setProperty("--manifesto-shift-a", `${(0.5 - sceneProgress) * 118}px`);
        manifesto.style.setProperty("--manifesto-shift-b", `${(sceneProgress - 0.5) * 92}px`);
        manifesto.style.setProperty("--manifesto-shift-c", `${(0.5 - sceneProgress) * 64}px`);
      }

    };

    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        syncScrollMotion();
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveZone(visible.target.id);
          setVisited((current) => current.includes(visible.target.id) ? current : [...current, visible.target.id]);
        }
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.15, 0.4] },
    );

    zones.forEach((zone) => {
      const node = document.getElementById(zone.id);
      if (node) observer.observe(node);
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const zone = zones.find((item) => item.key === event.key);
      if (zone) jumpTo(zone.id);
      if (event.key === "Escape") setScanMode(false);
    };

    const onPointerMove = (event: PointerEvent) => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    };

    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(
      ".manifesto-zone, .zone-heading, .active-quest, .mission-card, .encounter-card, .loadout-card, .academy-card, .lore-card, .profile-card, .achievement",
    ));
    document.documentElement.classList.add("motion-ready");
    revealTargets.forEach((target, index) => {
      target.classList.add("reveal-target");
      target.style.setProperty("--reveal-delay", `${(index % 3) * 85}ms`);
    });

    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    revealTargets.forEach((target) => revealObserver.observe(target));

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      observer.disconnect();
      revealObserver.disconnect();
      document.documentElement.classList.remove("motion-ready");
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [jumpTo]);

  return (
    <main className={scanMode ? "game-shell scan-active" : "game-shell"}>
      <div className="boot-screen" aria-hidden="true">
        <div className="boot-emblem"><span>VS</span><i /><i /></div>
        <p>VAASU_OS // PORTFOLIO CAMPAIGN</p>
        <div className="boot-status"><span>LOADING PLAYER PROFILE</span><b>READY</b></div>
        <div className="boot-progress"><span /></div>
        <small>ML SYSTEMS · DATA ENGINEERING · GENAI</small>
      </div>
      <div className={`warp-transition ${warping ? "active" : ""}`} aria-hidden="true">
        <span className="warp-line warp-line-a" /><span className="warp-line warp-line-b" /><span className="warp-core">WARPING</span>
      </div>
      <div className="ambient-grid" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      <header className="hud">
        <a className="player-id" href="#command" aria-label="Return to command center">
          <span className="player-avatar">VS</span>
          <span className="player-copy"><small>PLAYER_01</small><strong>VAASU SOHEE</strong></span>
        </a>
        <div className="level-meter" aria-label={`Portfolio exploration ${progress}% complete`}>
          <div className="level-label"><span>LVL 05 · DATA SYSTEMS</span><b>{progress}% XP</b></div>
          <div className="level-track"><span style={{ width: `${Math.max(4, progress)}%` }} /></div>
        </div>
        <div className="hud-actions">
          <button className="scan-button" type="button" aria-pressed={scanMode} onClick={() => setScanMode((value) => !value)}>
            <span className="scan-icon" /> {scanMode ? "SCAN ACTIVE" : "SYSTEM SCAN"}
          </button>
          <a className="hud-contact" href="mailto:soheevaa@msu.edu">CO-OP +</a>
        </div>
      </header>

      <nav className="world-nav" aria-label="Portfolio world map">
        <span className="world-nav-title">WORLD MAP</span>
        {zones.map((zone, index) => (
          <button
            key={zone.id}
            type="button"
            className={`${activeZone === zone.id ? "active" : ""} ${visited.includes(zone.id) ? "visited" : ""}`}
            onClick={() => jumpTo(zone.id)}
            aria-current={activeZone === zone.id ? "location" : undefined}
          >
            <span className="map-node">{visited.includes(zone.id) ? "◆" : "◇"}</span>
            <span><small>ZONE 0{index + 1}</small>{zone.label}</span>
            <kbd>{zone.key}</kbd>
          </button>
        ))}
        <div className="world-nav-line"><span style={{ height: `${progress}%` }} /></div>
      </nav>

      {scanMode && (
        <aside className="scan-console" role="status">
          <div className="console-head"><span>SYSTEM SCAN // COMPLETE</span><button type="button" onClick={() => setScanMode(false)} aria-label="Close system scan">ESC</button></div>
          <p>High-value signals detected across the campaign.</p>
          <ul><li>131 governed datasets</li><li>5M+ daily ETL records</li><li>3M+ healthcare claims</li><li>$3.5M modeled risk reduction</li></ul>
        </aside>
      )}

      <div className="game-content">
        <section className="zone command-zone" id="command">
          <div className="mission-breadcrumb"><span className="live-dot" /> CAMPAIGN ONLINE <b>/</b> MICHIGAN, USA <b>/</b> OPEN TO DATA & AI ROLES</div>
          <div className="command-layout">
            <div className="command-copy">
              <p className="quest-label">MAIN QUEST // BUILD SYSTEMS THAT MATTER</p>
              <h1>Turning complex data into <em>production intelligence.</em></h1>
              <p className="hero-copy">Data scientist and data engineer building production ML, modern data platforms, and GenAI systems from first experiment to reliable deployment and executive decision.</p>
              <div className="command-actions">
                <button className="game-button primary" type="button" onClick={() => jumpTo("missions")}><span>START CAMPAIGN</span><b>ENTER ↵</b></button>
                <a className="game-button secondary" href="resume.pdf" target="_blank"><span>OPEN INVENTORY</span><b>RESUME ↗</b></a>
              </div>
              <div className="party-links"><span>PARTY CHANNELS</span><a href="https://www.linkedin.com/in/vaasu-sohee/" target="_blank" rel="noreferrer">LINKEDIN ↗</a><a href="https://github.com/vaasu202" target="_blank" rel="noreferrer">GITHUB ↗</a></div>
            </div>

            <div className="command-console">
              <div className="panel-head"><span>PLAYER BUILD // V5.0</span><b>ONLINE</b></div>
              <div className="radar-map" aria-hidden="true">
                <div className="radar-ring ring-a" /><div className="radar-ring ring-b" /><div className="radar-ring ring-c" />
                <div className="radar-axis axis-a" /><div className="radar-axis axis-b" />
                <div className="radar-core"><span>VS</span><small>DATA / AI</small></div>
                <span className="radar-point p1">ML</span><span className="radar-point p2">DE</span><span className="radar-point p3">AI</span><span className="radar-point p4">DS</span>
              </div>
              <div className="attribute-grid">
                <div><span>ML SYSTEMS</span><strong>94</strong></div><div><span>DATA ENG.</span><strong>92</strong></div><div><span>GENAI</span><strong>91</strong></div><div><span>STRATEGY</span><strong>89</strong></div>
              </div>
            </div>
          </div>

          <div className="achievement-ribbon">
            {achievements.map((item) => (
              <article className={`achievement ${item.tone}`} key={item.code}>
                <span className="achievement-gem">◆</span><div><small>ACHIEVEMENT // {item.code}</small><strong>{item.value}</strong><p>{item.label}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="manifesto-zone" aria-labelledby="manifesto-title">
          <div className="manifesto-topline"><span>PLAYER MANIFESTO // 001</span><b>BUILT FOR PRODUCTION</b></div>
          <h2 className="manifesto-title" id="manifesto-title">
            <span>Find the signal.</span>
            <span>Build the <em>system.</em></span>
            <span>Ship <strong>measurable impact.</strong></span>
          </h2>
          <div className="manifesto-bottom"><span>MODELS</span><i /><span>INFRASTRUCTURE</span><i /><span>DECISIONS</span><b>ALL SYSTEMS CONNECTED</b></div>
          <div className="manifesto-wipes" aria-hidden="true"><i /><i /><i /></div>
        </section>

        <section className="zone missions-zone" id="missions">
          <ZoneHeading number="02" eyebrow="CAREER CAMPAIGN" title="Five missions. One evolving build." copy="Explore the systems, decisions, and measurable outcomes unlocked across healthcare, consulting, aerospace, and enterprise data." />
          <div className="active-quest">
            <div className="active-quest-main">
              <div className="quest-state"><span className="live-dot" /> ACTIVE MISSION <b>DELTA DENTAL INSURANCE</b></div>
              <h3>Build reliable AI for healthcare decisions.</h3>
              <p>Architecting governed analytics and ML systems where accuracy, latency, traceability, and operational resilience all matter.</p>
            </div>
            <div className="quest-objectives">
              <span>PRIMARY OBJECTIVES</span>
              <p><i>✓</i> Govern natural-language analytics across 131 datasets</p>
              <p><i>✓</i> Extract non-standard invoice data with VLMs</p>
              <p><i>✓</i> Improve representation learning across 3M+ claims</p>
              <p><i>↻</i> Scale reliable healthcare intelligence</p>
            </div>
            <div className="quest-reward"><small>BEST RUN</small><strong>80%+</strong><span>latency reduction</span><div className="reward-bar"><i /></div></div>
          </div>

          <div className="mission-list">
            {experiences.map((experience, index) => (
              <article className={`mission-card ${index === 0 ? "current" : ""}`} key={`${experience.company}-${experience.role}`}>
                <div className="mission-rail"><span>{String(experiences.length - index).padStart(2, "0")}</span><i /></div>
                <div className="mission-body">
                  <div className="mission-meta"><span>{experience.code}</span><b>{experience.status}</b><time>{experience.period}</time></div>
                  <div className="mission-title"><div><h3>{experience.role}</h3><p>{experience.company}</p></div><strong>{experience.reward}</strong></div>
                  <p className="mission-summary">{experience.summary}</p>
                  <div className="mission-detail-grid">
                    <ul>{experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
                    <div className="mission-loadout"><span>LOADOUT</span>{experience.tags.map((tag) => <b key={tag}>{tag}</b>)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="zone encounters-zone" id="projects">
          <ZoneHeading number="03" eyebrow="BOSS ENCOUNTERS" title="Selected work with real stakes." copy="Three challenges that combine statistical rigor, systems thinking, and business translation." />
          <div className="encounter-grid">
            {projects.map((project, index) => {
              const body = (
                <>
                  <div className="encounter-head"><span>{project.encounter}</span><b>{project.difficulty}</b></div>
                  <div className="encounter-art" aria-hidden="true"><span className="art-orbit" /><span className="art-core">0{index + 1}</span><i /><i /><i /></div>
                  <p className="encounter-client">{project.client}</p>
                  <h3>{project.title}</h3>
                  <p className="encounter-description">{project.description}</p>
                  <div className="encounter-reward"><div><small>REWARD UNLOCKED</small><strong>{project.reward}</strong><span>{project.rewardLabel}</span></div><b>{project.href ? "OPEN MISSION ↗" : "INTEL CLASSIFIED"}</b></div>
                  <div className="encounter-stats">{project.stats.map((stat) => <span key={stat}>◆ {stat}</span>)}</div>
                  <div className="encounter-tools">{project.tools.map((tool) => <span key={tool}>{tool}</span>)}</div>
                </>
              );
              return project.href ? <a className={`encounter-card encounter-${index + 1}`} href={project.href} target="_blank" rel="noreferrer" key={project.title}>{body}</a> : <article className={`encounter-card encounter-${index + 1}`} key={project.title}>{body}</article>;
            })}
          </div>
        </section>

        <section className="zone armory-zone" id="armory">
          <ZoneHeading number="04" eyebrow="SKILL ARMORY" title="Choose the right loadout." copy="A full-stack toolkit for taking data products from raw signals to governed, observable production systems." />
          <div className="loadout-grid">
            {skillGroups.map((group) => (
              <article className="loadout-card" key={group.label}>
                <div className="loadout-head"><span>{group.icon}</span><div><small>ABILITY TREE</small><h3>{group.label}</h3></div><b>LVL {group.level}</b></div>
                <div className="ability-meter"><span style={{ width: `${group.level}%` }} /></div>
                <div className="ability-list">{group.skills.map((skill, index) => <span key={skill} className={index < 2 ? "equipped" : ""}><i>{index < 2 ? "◆" : "◇"}</i>{skill}</span>)}</div>
              </article>
            ))}
          </div>
          <div className="code-strip"><span>PRIMARY LANGUAGES</span><strong>PYTHON</strong><strong>SQL</strong><strong>JAVASCRIPT</strong><strong>C#</strong><strong>JAVA</strong><b>BUILD READY // 100%</b></div>
        </section>

        <section className="zone academy-zone" id="academy">
          <ZoneHeading number="05" eyebrow="ACADEMY & LORE" title="The training behind the build." copy="Formal depth in data science and computer science, reinforced by published research and applied industry missions." />
          <div className="academy-grid">
            <article className="academy-card msu-card">
              <div className="academy-seal"><span>MSU</span><i /></div>
              <div><span className="rarity-tag">LEGENDARY CREDENTIAL</span><small>Michigan State University</small><h3>M.S. Data Science</h3><p>Machine Learning · Natural Language Processing · Foundations of LLMs · Probability & Statistics · Computational Optimization · Data Mining</p></div>
              <div className="academy-score"><strong>4.0</strong><span>/ 4.0 GPA</span><b>PERFECT RUN</b></div>
            </article>
            <article className="academy-card niit-card">
              <div className="academy-seal"><span>NU</span><i /></div>
              <div><span className="rarity-tag">EPIC CREDENTIAL</span><small>NIIT University</small><h3>B.Tech Computer Science</h3><p>Computer science foundations, software engineering, algorithms, and applied machine learning.</p></div>
              <div className="academy-score"><strong>3.6</strong><span>/ 4.0 GPA</span><b>CORE BUILD</b></div>
            </article>
            <a className="lore-card" href="https://ieeexplore.ieee.org/document/10372979" target="_blank" rel="noreferrer">
              <span>DISCOVERED LORE // IEEE</span><h3>Interpretable ECG anomaly detection</h3><p>Peer-reviewed research translating autoencoder representations into clinical anomaly signals.</p><b>READ PUBLICATION ↗</b>
            </a>
            <article className="profile-card"><span>PLAYER PROFILE</span><h3>Technical depth.<br />Business clarity.</h3><p>I do my best work where statistical rigor, reliable engineering, and high-stakes decisions overlap.</p><div><b>5</b><small>industry placements</small><b>3</b><small>domains mastered</small></div></article>
          </div>
        </section>

        <section className="final-zone" id="contact">
          <div className="final-grid" aria-hidden="true" />
          <p className="quest-label">FINAL PROMPT // NEW CAMPAIGN AVAILABLE</p>
          <h2>Have a hard data problem?</h2>
          <p>Invite a data scientist who can move between models, infrastructure, and the room where decisions happen.</p>
          <a className="final-cta" href="mailto:soheevaa@msu.edu"><span>START A CONVERSATION</span><b>soheevaa@msu.edu ↗</b></a>
          <div className="final-links"><a href="https://www.linkedin.com/in/vaasu-sohee/" target="_blank" rel="noreferrer">LINKEDIN ↗</a><a href="https://github.com/vaasu202" target="_blank" rel="noreferrer">GITHUB ↗</a><a href="tel:+15174907865">517-490-7865</a></div>
        </section>

        <footer><span>VAASU SOHEE // PORTFOLIO CAMPAIGN</span><p>ALL SYSTEMS OPERATIONAL</p><button type="button" onClick={() => jumpTo("command")}>RETURN TO SPAWN ↑</button></footer>
      </div>
    </main>
  );
}

function ZoneHeading({ number, eyebrow, title, copy }: { number: string; eyebrow: string; title: string; copy: string }) {
  return (
    <div className="zone-heading">
      <div className="zone-code"><span>ZONE</span><strong>{number}</strong></div>
      <div><p className="quest-label">{eyebrow}</p><h2>{title.split(" ").map((word, index) => <span key={`${word}-${index}`} style={{ transitionDelay: `${index * 55}ms` }}>{word} </span>)}</h2></div>
      <p>{copy}</p>
    </div>
  );
}
