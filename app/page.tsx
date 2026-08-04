"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const zones = [
  { id: "command", key: "1", label: "Start" },
  { id: "missions", key: "2", label: "Career" },
  { id: "projects", key: "3", label: "Work" },
  { id: "armory", key: "4", label: "Skills" },
  { id: "academy", key: "5", label: "About" },
];

const experiences = [
  {
    code: "ACTIVE_05",
    status: "IN PROGRESS",
    role: "Data Scientist Intern (Co-op)",
    company: "Delta Dental Insurance",
    logo: "logos/delta-dental.jpg",
    logoAlt: "Delta Dental logo",
    logoClass: "delta",
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
    logo: "logos/ey.svg",
    logoAlt: "EY logo",
    logoClass: "ey",
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
    logo: "logos/ey.svg",
    logoAlt: "EY logo",
    logoClass: "ey",
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
    logo: "logos/exodrone-systems.png",
    logoAlt: "Exodrone Systems logo",
    logoClass: "exodrone",
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
    logo: "logos/niit-technologies.svg",
    logoAlt: "NIIT Technologies logo",
    logoClass: "niit",
    period: "Jun 2021 - Dec 2021",
    summary: "Developed and deployed a production CNN with real-time inference and automated drift monitoring.",
    highlights: ["Achieved 95%+ accuracy with sub-100ms inference latency."],
    reward: "+95% accuracy",
    tags: ["PyTorch", "CNN", "Model Monitoring"],
  },
];

const projects = [
  {
    encounter: "LEGENDARY / OPEN SOURCE",
    difficulty: "★★★★★",
    name: "AgentGuard",
    title: "Security Gateway for AI Agents",
    client: "Independent Project",
    description: "A runtime security gateway for AI agents that intercepts MCP tool calls, enforces deterministic policy, redacts secrets, pauses risky actions for human approval, and writes a tamper-evident audit trail.",
    reward: "BLOCK",
    rewardLabel: "unsafe tool execution",
    stats: ["4 attack fixtures", "4 agent runtimes", "Tamper-evident audit"],
    tools: ["MCP", "OpenAI Agents", "LangGraph", "Mastra", "PydanticAI", "Qdrant"],
    href: "https://github.com/vaasu202/agentguard",
    image: "projects/agentguard-demo.png",
  },
  {
    encounter: "LEGENDARY / NDA",
    difficulty: "★★★★★",
    name: "Longview",
    title: "Demand & Capacity Forecasting Capstone",
    client: "Jackson National Life",
    description: "A multi-segment forecasting system combining Temporal Fusion Transformer and SARIMAX across 40+ contract segments, validated with walk-forward testing.",
    reward: "$3.5M",
    rewardLabel: "annual risk reduction",
    stats: ["22% RMSE improvement", "18% MAPE improvement", "40+ segments"],
    tools: ["TFT", "SARIMAX", "Time Series", "Python"],
    href: null,
    image: "projects/demand-capacity-forecast.png",
  },
  {
    encounter: "EPIC / OPEN SOURCE",
    difficulty: "★★★★☆",
    name: "Nexus",
    title: "Multi-Agent GenAI Retrieval Platform",
    client: "Independent Project",
    description: "A deterministic operational intelligence system using LangGraph, GPT-4.1, ChromaDB hybrid retrieval, structured tool use, and Pydantic validation.",
    reward: "RAG",
    rewardLabel: "grounded agentic outputs",
    stats: ["Hybrid retrieval", "Structured calling", "Natural-language Q&A"],
    tools: ["LangGraph", "GPT-4.1", "ChromaDB", "Streamlit"],
    href: "https://github.com/vaasu202/Agentic-RAG-Postmortem-Reporting",
    image: "projects/multi-agent-rag.png",
  },
  {
    encounter: "RARE / PUBLISHED",
    difficulty: "★★★★☆",
    name: "ECG Anomaly Detection",
    title: "Published Research",
    client: "ICMLANT / IEEE",
    description: "A peer-reviewed interpretable autoencoder framework for anomaly detection and pattern recognition on clinical ECG signals.",
    reward: "IEEE",
    rewardLabel: "peer-reviewed research",
    stats: ["Clinical ECG", "Interpretable ML", "Anomaly detection"],
    tools: ["Autoencoders", "PyTorch", "Clinical ML"],
    href: "https://ieeexplore.ieee.org/document/10372979",
    image: "projects/ecg-anomaly-detection.png",
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
  { code: "DATA_ARCHITECT", value: "131", label: "datasets governed" },
  { code: "SPEED_RUNNER", value: "80%+", label: "latency eliminated" },
  { code: "RISK_BREAKER", value: "$3.5M", label: "annual risk reduced" },
  { code: "PERFECT_RUN", value: "4.0", label: "graduate GPA" },
];

const proofMoments = [
  {
    step: "01",
    code: "DATA_ARCHITECT",
    value: "131",
    unit: "DATASETS GOVERNED",
    title: "One question. One trusted answer.",
    copy: "Unified a fragmented analytics landscape into a governed AI layer built for reliable, natural-language decisions.",
    signals: ["GOVERNANCE", "GENAI", "PROVIDER INSIGHTS"],
    tone: "lime",
  },
  {
    step: "02",
    code: "SPEED_RUNNER",
    value: "80%+",
    unit: "LATENCY REMOVED",
    title: "From waiting to working.",
    copy: "Re-engineered the retrieval and analytics path so complex healthcare questions return useful answers dramatically faster.",
    signals: ["RETRIEVAL", "PERFORMANCE", "PRODUCTION"],
    tone: "violet",
  },
  {
    step: "03",
    code: "RISK_BREAKER",
    value: "$3.5M",
    unit: "ANNUAL RISK REDUCED",
    title: "Forecasting with consequences.",
    copy: "Combined deep learning and statistical forecasting across more than 40 segments to improve capacity decisions at scale.",
    signals: ["TFT", "SARIMAX", "40+ SEGMENTS"],
    tone: "cyan",
  },
  {
    step: "04",
    code: "PERFECT_RUN",
    value: "4.0",
    unit: "GRADUATE GPA",
    title: "Rigor behind the build.",
    copy: "Graduate work in data science reinforced the mathematical depth behind every model, experiment, and system decision.",
    signals: ["ML", "STATISTICS", "OPTIMIZATION"],
    tone: "gold",
  },
];

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const [activeZone, setActiveZone] = useState("command");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scanMode, setScanMode] = useState(false);

  const jumpTo = useCallback((id: string) => {
    const destination = document.getElementById(id);
    if (!destination) return;
    destination.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const zone = zones.find((item) => item.key === event.key);
      if (zone) jumpTo(zone.id);
      if (event.key === "Escape") {
        setMenuOpen(false);
        setScanMode(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jumpTo]);

  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progressFill = root.current?.querySelector<HTMLElement>(".page-progress-fill");
    const progressLabel = root.current?.querySelector<HTMLElement>(".page-progress-label");

    if (reduceMotion) {
      gsap.set(".boot-screen", { display: "none" });
    } else {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".boot-mark", { autoAlpha: 0, scale: 0.96, duration: 0.34 })
        .from(".boot-copy > *", { autoAlpha: 0, y: 10, stagger: 0.06, duration: 0.28 }, "<0.04")
        .to(".boot-progress span", { scaleX: 1, duration: 0.48, ease: "power2.inOut" }, 0.16)
        .to(".boot-screen", { yPercent: -100, duration: 0.52, ease: "power3.inOut" }, "+=0.04")
        .set(".boot-screen", { display: "none" });
    }

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (progressFill) gsap.set(progressFill, { scaleX: self.progress });
        if (progressLabel) progressLabel.textContent = `${Math.round(self.progress * 100)}%`;
      },
    });

    zones.forEach((zone) => {
      ScrollTrigger.create({
        trigger: `#${zone.id}`,
        start: "top 52%",
        end: "bottom 48%",
        onToggle: (self) => {
          if (self.isActive) setActiveZone(zone.id);
        },
      });
    });

    const mm = gsap.matchMedia();
    mm.add(
      {
        desktop: "(min-width: 900px)",
        finePointer: "(hover: hover) and (pointer: fine)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { desktop, finePointer, reduceMotion: shouldReduce } = context.conditions as {
          desktop: boolean;
          finePointer: boolean;
          reduceMotion: boolean;
        };

        if (shouldReduce) {
          gsap.set(".gsap-reveal, .manifesto-line, .manifesto-word, .hero-message, .proof-slide, .proof-field, .proof-machine", { clearProps: "all" });
          return;
        }

        const intro = gsap.timeline({
          defaults: { duration: 0.58, ease: "power3.out" },
        });
        intro
          .from(".race-nav", { autoAlpha: 0, y: -24 })
          .from(".hero-kicker", { autoAlpha: 0, y: 20 }, "<0.12")
          .from(".hero-name", { autoAlpha: 0, y: 24 }, "<0.05")
          .from(".player-core", { autoAlpha: 0 }, "<0.12")
          .from(".hero-meta > *, .hero-actions > *, .hero-scroll > *", { autoAlpha: 0, y: 12, stagger: 0.05 }, "<0.18");

        if (desktop) {
          gsap.timeline({
            scrollTrigger: {
              trigger: ".hero-scene",
              start: "top top",
              end: "+=85%",
              pin: true,
              scrub: 0.25,
              anticipatePin: 1,
            },
          })
            .to(".hero-name span", { autoAlpha: 0, y: -18, stagger: 0.025, ease: "power2.inOut" }, 0)
            .to(".hero-meta, .hero-actions, .hero-scroll", { autoAlpha: 0, y: 16, ease: "power2.inOut" }, 0)
            .to(".player-core", { scale: 1.12, rotation: 3, ease: "power2.inOut" }, 0)
            .to(".hero-light-layer", { autoAlpha: 0, ease: "power2.inOut" }, 0.2)
            .fromTo(".hero-message", { autoAlpha: 0 }, { autoAlpha: 1, ease: "power2.inOut" }, 0.24)
            .from(".hero-marquee", { autoAlpha: 0, y: 24, stagger: 0.06, ease: "power2.out" }, 0.32)
            .fromTo(".hero-signature", { autoAlpha: 0, scale: 0.94, rotation: -4 }, { autoAlpha: 0.7, scale: 1, rotation: -2, ease: "power2.out" }, 0.38);
        }

        gsap.timeline({
          scrollTrigger: {
            trigger: ".manifesto-zone h2",
            start: "top 80%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
          .from(".manifesto-word", {
            autoAlpha: 0.12,
            yPercent: 24,
            stagger: 0.035,
            duration: 0.56,
          })
          .from(".manifesto-zone > p", { autoAlpha: 0, y: 20, duration: 0.46 }, "-=0.26");

        if (desktop) {
          const proofSlides = gsap.utils.toArray<HTMLElement>(".proof-slide");
          const proofSteps = gsap.utils.toArray<HTMLElement>(".proof-step");
          gsap.set(proofSlides.slice(1), { autoAlpha: 0, y: 24 });
          gsap.set(proofSteps, { opacity: 0.3 });
          gsap.set(proofSteps[0], { opacity: 1 });

          const proofTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: ".proof-scene",
              start: "top top",
              end: `+=${(proofMoments.length - 1) * 72}%`,
              pin: true,
              scrub: 0.25,
              anticipatePin: 1,
            },
          });

          proofTimeline.to(".proof-machine", { rotation: 5, duration: 0.32, ease: "power2.inOut" });
          proofMoments.slice(1).forEach((_, index) => {
            const next = index + 1;
            proofTimeline
              .to(proofSlides[index], { autoAlpha: 0, y: -20, duration: 0.28, ease: "power2.inOut" })
              .fromTo(proofSlides[next], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.34, ease: "power2.out" }, "<0.06")
              .to(".proof-machine", {
                rotation: next % 2 ? -8 : 8,
                duration: 0.34,
                ease: "power2.inOut",
              }, "<")
              .to(proofSteps[index], { opacity: 0.3, duration: 0.18 }, "<")
              .to(proofSteps[next], { opacity: 1, duration: 0.18 }, "<")
              .to({}, { duration: 0.28 });
          });
        }

        gsap.set(".gsap-reveal", { autoAlpha: 0, y: 22 });
        ScrollTrigger.batch(".gsap-reveal", {
          start: "top 90%",
          once: true,
          interval: 0.08,
          batchMax: 4,
          onEnter: (elements) => {
            gsap.to(elements, {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.06,
              ease: "power3.out",
              overwrite: true,
            });
          },
        });

        if (desktop) {
          gsap.utils.toArray<HTMLElement>(".project-card").forEach((card) => {
            const visual = card.querySelector(".project-visual");
            if (!visual) return;
            gsap.fromTo(visual, { yPercent: -3 }, {
              yPercent: 3,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.2,
              },
            });
          });
        }

        gsap.to(".ticker-track", {
          xPercent: -50,
          duration: 32,
          repeat: -1,
          ease: "none",
        });

        if (finePointer) {
          const xTo = gsap.quickTo(".player-core", "x", { duration: 0.35, ease: "power3.out" });
          const yTo = gsap.quickTo(".player-core", "y", { duration: 0.35, ease: "power3.out" });
          const hoverCleanup: Array<() => void> = [];
          const onPointerMove = (event: PointerEvent) => {
            xTo((event.clientX / window.innerWidth - 0.5) * 10);
            yTo((event.clientY / window.innerHeight - 0.5) * 8);
          };

          const bindHoverField = (surfaceSelector: string, targetSelector: string, strength: number) => {
            gsap.utils.toArray<HTMLElement>(surfaceSelector).forEach((surface) => {
              const targets = surface.querySelectorAll<HTMLElement>(targetSelector);
              if (!targets.length) return;

              let bounds: DOMRect | null = null;
              const hoverX = gsap.quickTo(targets, "x", { duration: 0.28, ease: "power3.out" });
              const hoverY = gsap.quickTo(targets, "y", { duration: 0.28, ease: "power3.out" });
              const onEnter = () => {
                bounds = surface.getBoundingClientRect();
              };
              const onMove = (event: PointerEvent) => {
                if (!bounds) return;
                const xRatio = (event.clientX - bounds.left) / bounds.width - 0.5;
                const yRatio = (event.clientY - bounds.top) / bounds.height - 0.5;
                hoverX(xRatio * strength);
                hoverY(yRatio * strength);
              };
              const onLeave = () => {
                bounds = null;
                hoverX(0);
                hoverY(0);
              };

              surface.addEventListener("pointerenter", onEnter, { passive: true });
              surface.addEventListener("pointermove", onMove, { passive: true });
              surface.addEventListener("pointerleave", onLeave, { passive: true });
              hoverCleanup.push(() => {
                surface.removeEventListener("pointerenter", onEnter);
                surface.removeEventListener("pointermove", onMove);
                surface.removeEventListener("pointerleave", onLeave);
              });
            });
          };

          bindHoverField(".project-card", ".project-visual > b", 24);
          bindHoverField(".mode-bridge > button", "small, strong, span", 14);
          bindHoverField(".contact-cta", "span, strong", 10);
          window.addEventListener("pointermove", onPointerMove, { passive: true });
          return () => {
            window.removeEventListener("pointermove", onPointerMove);
            hoverCleanup.forEach((cleanup) => cleanup());
          };
        }
      },
    );

    let mounted = true;
    document.fonts.ready.then(() => {
      if (mounted) ScrollTrigger.refresh();
    });

    return () => {
      mounted = false;
      mm.revert();
    };
  }, { scope: root });

  return (
    <main ref={root} className={`portfolio-shell ${scanMode ? "scan-active" : ""}`}>
      <div className="boot-screen" aria-hidden="true">
        <div className="boot-mark">VS</div>
        <div className="boot-copy">
          <p>VAASU SOHEE</p>
          <span>PORTFOLIO CAMPAIGN // 2026</span>
        </div>
        <div className="boot-progress"><span /></div>
        <small>LOAD PLAYER</small>
      </div>

      <header className="race-nav">
        <a className="brand-lockup" href="#command" aria-label="Return to start">
          <strong>VAASU</strong><span>SOHEE</span>
        </a>
        <span className="nav-glyph" aria-hidden="true">VS</span>
        <div className="nav-actions">
          <a className="nav-chip nav-resume" href="resume.pdf" target="_blank"><span>RESUME ↗</span></a>
          <button className="nav-chip scan-trigger" type="button" aria-pressed={scanMode} onClick={() => setScanMode((value) => !value)}>
            <span>{scanMode ? "SCAN ON" : "SCAN"}</span>
          </button>
          <button className="menu-trigger" type="button" aria-label="Open or close navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            <i /><i />
          </button>
        </div>
      </header>

      <nav className={`menu-panel ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
        <div className="menu-panel-head"><span>WORLD MAP</span><b>KEYBOARD 1-5</b></div>
        {zones.map((zone, index) => (
          <button key={zone.id} type="button" onClick={() => jumpTo(zone.id)}>
            <small>0{index + 1}</small><span>{zone.label}</span><b>{zone.key}</b>
          </button>
        ))}
        <div className="menu-links">
          <a href="https://www.linkedin.com/in/vaasu-sohee/" target="_blank" rel="noreferrer">LINKEDIN ↗</a>
          <a href="https://github.com/vaasu202" target="_blank" rel="noreferrer">GITHUB ↗</a>
          <a href="mailto:soheevaa@msu.edu">EMAIL ↗</a>
        </div>
      </nav>

      <nav className="progress-dock" aria-label="Portfolio world map">
        <span className="page-progress-label">0%</span>
        <div className="page-progress-track"><i className="page-progress-fill" /></div>
        <div className="dock-zones">
          {zones.map((zone, index) => (
            <button
              key={zone.id}
              type="button"
              className={activeZone === zone.id ? "active" : ""}
              onClick={() => jumpTo(zone.id)}
              aria-current={activeZone === zone.id ? "location" : undefined}
              aria-label={`Go to ${zone.label}`}
            >
              <span>0{index + 1}</span>
            </button>
          ))}
        </div>
      </nav>

      <aside className={`scan-panel ${scanMode ? "open" : ""}`} role="status">
        <div><span>SYSTEM SCAN</span><b>4 SIGNALS FOUND</b></div>
        <ul>
          <li><strong>131</strong><span>governed datasets</span></li>
          <li><strong>5M+</strong><span>daily ETL records</span></li>
          <li><strong>3M+</strong><span>healthcare claims</span></li>
          <li><strong>$3.5M</strong><span>risk reduction</span></li>
        </ul>
      </aside>

      <section className="hero-scene" id="command">
        <div className="hero-pin">
          <ContourMap />
          <div className="hero-light-layer">
            <p className="hero-kicker">DATA SCIENTIST · ML SYSTEMS · GENAI</p>
            <h1 className="hero-name">
              <span className="name-a">VAASU</span>
              <span className="name-b">SOHEE</span>
            </h1>

            <div className="player-core" aria-label="Vaasu Sohee data systems player core">
              <span className="core-orbit orbit-a" /><span className="core-orbit orbit-b" />
              <div className="core-slice slice-top"><span>GENAI</span><b>LANGGRAPH · RAG · VLM</b></div>
              <div className="core-slice slice-mid"><span>VS</span><b>DATA / AI</b></div>
              <div className="core-slice slice-bottom"><span>ML</span><b>PRODUCTION SYSTEMS</b></div>
              <i className="core-crosshair cross-a" /><i className="core-crosshair cross-b" />
            </div>

            <div className="hero-meta">
              <span>PLAYER 01</span>
              <p>Turning complex data into production intelligence.</p>
              <b>MICHIGAN, USA</b>
            </div>
            <div className="hero-actions">
              <button type="button" onClick={() => jumpTo("missions")}><span>START CAMPAIGN</span><b>↘</b></button>
              <a href="mailto:soheevaa@msu.edu"><span>OPEN TO DATA & AI ROLES</span><b>+</b></a>
            </div>
            <div className="hero-scroll"><span>SCROLL TO LOAD</span><i /></div>
          </div>

          <div className="hero-message" aria-hidden="true">
            <span className="message-label">PLAYER MANIFESTO // 001</span>
            <div className="hero-marquee marquee-a">BUILD SYSTEMS THAT MATTER</div>
            <div className="hero-marquee marquee-b">SHIP MEASURABLE IMPACT</div>
            <div className="hero-signature">VS</div>
            <p>MODELS · INFRASTRUCTURE · DECISIONS</p>
          </div>
        </div>
      </section>

      <section className="metric-ticker" aria-label="Career highlights">
        <div className="ticker-track">
          {[...achievements, ...achievements].map((item, index) => (
            <div className="ticker-item" key={`${item.code}-${index}`}>
              <small>{item.code}</small><strong>{item.value}</strong><span>{item.label}</span><i>◆</i>
            </div>
          ))}
        </div>
      </section>

      <section className="manifesto-zone" aria-labelledby="manifesto-title">
        <ContourMap />
        <div className="manifesto-top"><span>PLAYER MANIFESTO // 001</span><b>BUILT FOR PRODUCTION</b></div>
        <h2 id="manifesto-title">
          <span className="manifesto-line">
            <span className="manifesto-word">Find</span>{" "}
            <span className="manifesto-word">the</span>{" "}
            <em className="manifesto-word">signal.</em>
          </span>
          <span className="manifesto-line">
            <span className="manifesto-word">Build</span>{" "}
            <span className="manifesto-word">the</span>{" "}
            <b className="manifesto-word">system.</b>
          </span>
          <span className="manifesto-line">
            <span className="manifesto-word">Ship</span>{" "}
            <strong>
              <span className="manifesto-word">measurable</span>{" "}
              <span className="manifesto-word">impact.</span>
            </strong>
          </span>
        </h2>
        <p>From statistical rigor to reliable infrastructure, every layer exists to help a real decision happen faster and with more confidence.</p>
      </section>

      <section className="proof-scene" aria-labelledby="proof-title">
        <div className="proof-pin">
          <div className="proof-fields" aria-hidden="true">
            {proofMoments.map((moment) => <span className={`proof-field proof-field-${moment.tone}`} key={moment.code} />)}
          </div>
          <ContourMap />
          <header className="proof-head">
            <div><span>IMPACT SYSTEM</span><b>VERIFIED OUTPUT</b></div>
            <p id="proof-title">Scroll through the proof</p>
          </header>

          <div className="proof-stage">
            <div className="proof-machine" aria-hidden="true">
              <span className="machine-ring ring-outer" />
              <span className="machine-ring ring-inner" />
              <span className="machine-axis axis-horizontal" />
              <span className="machine-axis axis-vertical" />
              <i>VS</i>
              <b>IMPACT</b>
            </div>

            <div className="proof-slides">
              {proofMoments.map((moment) => (
                <article className={`proof-slide proof-slide-${moment.tone}`} key={moment.code}>
                  <div className="proof-score">
                    <span>{moment.code}</span>
                    <strong>{moment.value}</strong>
                    <small>{moment.unit}</small>
                  </div>
                  <div className="proof-copy">
                    <span>PROOF LOG // {moment.step}</span>
                    <h2>{moment.title}</h2>
                    <p>{moment.copy}</p>
                    <div>{moment.signals.map((signal) => <b key={signal}>{signal}</b>)}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="proof-steps" aria-hidden="true">
            {proofMoments.map((moment) => (
              <div className="proof-step" key={moment.code}><span>{moment.step}</span><i /><b>{moment.code}</b></div>
            ))}
          </div>
          <p className="proof-hint">KEEP SCROLLING <span>↓</span></p>
        </div>
      </section>

      <section className="content-zone missions-zone" id="missions">
        <ZoneIntro number="02" eyebrow="CAREER CAMPAIGN" title="Five missions. One evolving build." copy="Healthcare, consulting, aerospace, and enterprise data. Each role added a new system layer." />

        <article className="featured-mission gsap-reveal">
          <div>
            <span className="status-light" /> ACTIVE MISSION
            <h3>Reliable AI for healthcare decisions.</h3>
          </div>
          <p>Governed analytics and ML systems where accuracy, latency, traceability, and operational resilience all matter.</p>
          <strong>80%+<small>LATENCY REDUCTION</small></strong>
        </article>

        <div className="mission-stack">
          {experiences.map((experience, index) => (
            <article className={`mission-card gsap-reveal ${index === 0 ? "current" : ""}`} key={`${experience.company}-${experience.role}`}>
              <div className="mission-index"><span>0{experiences.length - index}</span><small>{experience.code}</small></div>
              <div className={`company-logo company-logo-${experience.logoClass}`}>
                <Image
                  src={experience.logo}
                  alt={experience.logoAlt}
                  width={220}
                  height={80}
                  priority={index === 0}
                />
              </div>
              <div className="mission-main">
                <div className="mission-meta"><b>{experience.status}</b><time>{experience.period}</time></div>
                <h3>{experience.role}</h3>
                <p className="company-name">{experience.company}</p>
                <p className="mission-summary">{experience.summary}</p>
                <ul>{experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
              </div>
              <div className="mission-reward">
                <strong>{experience.reward}</strong>
                <div>{experience.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-zone projects-zone" id="projects">
        <ZoneIntro number="03" eyebrow="BOSS ENCOUNTERS" title="Selected work. Real stakes." copy="Four challenges where modeling quality, systems thinking, security, and business translation had to work together." />
        <div className="project-stack">
          {projects.map((project, index) => {
            const content = (
              <>
                <div className={`project-visual ${project.image ? "project-visual-image" : ""}`} aria-hidden="true">
                  <span>0{index + 1}</span>
                  {project.image ? <Image src={project.image} alt="" fill sizes="(max-width: 899px) 100vw, 40vw" /> : null}
                  <strong className="project-visual-name">PROJECT // {project.name}</strong>
                  <i /><i /><i />
                  <b>{project.reward}</b>
                </div>
                <div className="project-copy">
                  <div className="project-meta"><span>{project.encounter}</span><b>{project.difficulty}</b></div>
                  <p className="project-client">{project.client}</p>
                  <h3>{project.name}</h3>
                  <p className="project-subtitle">{project.title}</p>
                  <p className="project-description">{project.description}</p>
                  <div className="project-stats">{project.stats.map((stat) => <span key={stat}>◆ {stat}</span>)}</div>
                  <div className="project-footer">
                    <div>{project.tools.map((tool) => <span key={tool}>{tool}</span>)}</div>
                    <b>{project.href ? "OPEN MISSION ↗" : "INTEL CLASSIFIED"}</b>
                  </div>
                </div>
              </>
            );
            return project.href ? (
              <a className={`project-card project-${index + 1} gsap-reveal`} href={project.href} target="_blank" rel="noreferrer" key={project.name}>{content}</a>
            ) : (
              <article className={`project-card project-${index + 1} gsap-reveal`} key={project.name}>{content}</article>
            );
          })}
        </div>
      </section>

      <section className="mode-bridge" aria-label="Portfolio pathways">
        <ContourMap />
        <button type="button" onClick={() => jumpTo("armory")}><small>TECHNICAL MODE</small><strong>BUILD</strong><span>Systems, platforms, and tools ↘</span></button>
        <button type="button" onClick={() => jumpTo("academy")}><small>HUMAN MODE</small><strong>THINK</strong><span>Research, decisions, and context ↘</span></button>
        <div className="mode-core">VS</div>
      </section>

      <section className="content-zone armory-zone" id="armory">
        <ZoneIntro number="04" eyebrow="SKILL ARMORY" title="The right loadout for the mission." copy="A full-stack toolkit for taking data products from raw signals to governed, observable production systems." />
        <div className="loadout-grid">
          {skillGroups.map((group) => (
            <article className="loadout-card gsap-reveal" key={group.label}>
              <div className="loadout-head"><span>{group.icon}</span><b>LVL {group.level}</b></div>
              <h3>{group.label}</h3>
              <div className="ability-meter"><i style={{ width: `${group.level}%` }} /></div>
              <div className="ability-list">{group.skills.map((skill, index) => <span key={skill} className={index < 2 ? "equipped" : ""}>{index < 2 ? "◆" : "◇"} {skill}</span>)}</div>
            </article>
          ))}
        </div>
        <div className="language-strip gsap-reveal"><span>PRIMARY LANGUAGES</span><b>PYTHON</b><b>SQL</b><b>JAVASCRIPT</b><b>C#</b><b>JAVA</b><strong>BUILD READY // 100%</strong></div>
      </section>

      <section className="content-zone academy-zone" id="academy">
        <ZoneIntro number="05" eyebrow="ACADEMY & LORE" title="The thinking behind the build." copy="Formal depth in data science and computer science, reinforced by published research and applied industry missions." />
        <div className="academy-grid">
          <article className="degree-card degree-primary gsap-reveal">
            <div className="degree-mark">MSU</div>
            <div><span>LEGENDARY CREDENTIAL</span><small>Michigan State University</small><h3>M.S. Data Science</h3><p>Machine Learning · Natural Language Processing · Foundations of LLMs · Probability & Statistics · Computational Optimization · Data Mining</p></div>
            <strong>4.0<small>/ 4.0 GPA</small></strong>
          </article>
          <article className="degree-card gsap-reveal">
            <div className="degree-mark">NU</div>
            <div><span>EPIC CREDENTIAL</span><small>NIIT University</small><h3>B.Tech Computer Science</h3><p>Computer science foundations, software engineering, algorithms, and applied machine learning.</p></div>
            <strong>3.6<small>/ 4.0 GPA</small></strong>
          </article>
          <a className="lore-card gsap-reveal" href="https://ieeexplore.ieee.org/document/10372979" target="_blank" rel="noreferrer">
            <span>DISCOVERED LORE // IEEE</span><h3>Interpretable ECG anomaly detection</h3><p>Peer-reviewed research translating autoencoder representations into clinical anomaly signals.</p><b>READ PUBLICATION ↗</b>
          </a>
          <article className="profile-card gsap-reveal"><span>PLAYER PROFILE</span><h3>Technical depth.<br />Business clarity.</h3><p>I do my best work where statistical rigor, reliable engineering, and high-stakes decisions overlap.</p><div><b>5</b><small>industry placements</small><b>3</b><small>domains mastered</small></div></article>
        </div>
      </section>

      <section className="contact-zone" id="contact">
        <ContourMap />
        <p>FINAL PROMPT // NEW CAMPAIGN AVAILABLE</p>
        <h2>LET&apos;S BUILD<br /><em>WHAT&apos;S NEXT.</em></h2>
        <a className="contact-cta" href="mailto:soheevaa@msu.edu"><span>START A CONVERSATION</span><strong>soheevaa@msu.edu ↗</strong></a>
        <div className="contact-links">
          <a href="https://www.linkedin.com/in/vaasu-sohee/" target="_blank" rel="noreferrer"><span>LINKEDIN ↗</span></a>
          <a href="https://github.com/vaasu202" target="_blank" rel="noreferrer"><span>GITHUB ↗</span></a>
          <a href="tel:+15174907865"><span>517-490-7865</span></a>
        </div>
      </section>

      <footer>
        <span>VAASU SOHEE // PORTFOLIO CAMPAIGN</span>
        <p>ALL SYSTEMS OPERATIONAL</p>
        <button type="button" onClick={() => jumpTo("command")}>RETURN TO START ↑</button>
      </footer>
    </main>
  );
}

function ZoneIntro({ number, eyebrow, title, copy }: { number: string; eyebrow: string; title: string; copy: string }) {
  return (
    <header className="zone-intro gsap-reveal">
      <div className="zone-number"><span>ZONE</span><strong>{number}</strong></div>
      <div><p>{eyebrow}</p><h2>{title}</h2></div>
      <p>{copy}</p>
    </header>
  );
}

function ContourMap() {
  return (
    <svg className="contour-map" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M-80 160C94 46 232 38 354 134s211 65 302-12 220-94 388 10 247 37 294-8" />
        <path d="M-70 219C92 104 220 94 330 174s219 75 322 3 226-92 392 8 239 41 289-8" />
        <path d="M-120 346C50 228 176 214 292 286s225 90 342 25 238-83 398 9 232 43 292-16" />
        <path d="M-95 430C72 312 194 302 318 368s228 86 350 20 247-67 398 16 225 46 284-16" />
        <path d="M-126 572C36 452 180 430 306 502s231 80 358 16 257-55 400 24 224 44 290-24" />
        <path d="M-84 670C88 548 222 536 350 602s226 70 348 11 238-41 380 28 221 41 282-30" />
        <path d="M160-90c92 92 103 190 35 270s-72 164-7 250 60 176-15 274-64 175 15 242" />
        <path d="M875-100c-84 106-82 203-3 278s84 163 23 251-49 181 35 267 76 168 2 246" />
      </g>
    </svg>
  );
}
