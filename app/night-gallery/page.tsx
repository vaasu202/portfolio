"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import { experiences, projects, skillGroups } from "./content";
import type { Exhibit } from "./GalleryModel";
import GalleryDock from "./GalleryDock";
import GalleryCursor from "./GalleryCursor";
import { MetalButton, MetalLink } from "./MetalControl";
import "./gallery.css";
import "./celestial.css";

const GalleryModel = dynamic(() => import("./GalleryModel"), { ssr: false, loading: () => <div className="ng-model-placeholder">Preparing exhibit…</div> });
const GalleryWorld = dynamic(() => import("./GalleryWorld"), { ssr: false });
const BlackHoleBackground = dynamic(() => import("./black-hole"), { ssr: false });
const cinematicQuery = "(min-width: 1060px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)";
const subscribeViewport = (notify: () => void) => {
  const query = matchMedia(cinematicQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

function RevealTitle({ text, italic = false }: { text: string; italic?: boolean }) {
  return <span className={italic ? "ng-title-line ng-italic" : "ng-title-line"} aria-label={text}>{text.split(" ").map((word, i) => <span className="ng-word-mask" aria-hidden="true" key={i}><span className="ng-word">{word}</span>{" "}</span>)}</span>;
}

function HeroTypeLine({ text, accent = false, caret = false }: { text: string; accent?: boolean; caret?: boolean }) {
  return <span className={`ng-type-line${accent ? " ng-italic" : ""}`} aria-hidden="true">
    {[...text].map((character, index) => <span className="ng-type-char" key={`${character}-${index}`}>{character === " " ? "\u00a0" : character}</span>)}
    {caret && <span className="ng-type-caret" />}
  </span>;
}

function ProjectStat({ text }: { text: string }) {
  const metric = text.match(/^(\d[\d+%.]*)(.*)$/);
  return <span>{metric ? <><strong>{metric[1]}</strong><small>{metric[2].trim()}</small></> : <b>{text}</b>}</span>;
}

export default function NightGallery() {
  const root = useRef<HTMLElement>(null);
  const [worldFailed, setWorldFailed] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [worldReady, setWorldReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const cinematic = useSyncExternalStore(subscribeViewport, () => matchMedia(cinematicQuery).matches, () => false) && !worldFailed;
  const introReady = fontsReady && backgroundReady && (!cinematic || worldReady || worldFailed);
  const markBackgroundReady = useCallback(() => setBackgroundReady(true), []);
  const markWorldReady = useCallback(() => setWorldReady(true), []);
  const markWorldUnavailable = useCallback((failed: boolean) => setWorldFailed(failed), []);
  const preview = useRef<HTMLDialogElement>(null);
  const sceneProgress = useRef<Record<Exhibit, number>>({ lucy: 0, guard: 0.5, forecast: 0.5, agents: 0.5, ecg: 0.5, mouse: 0.5, trooper: 0.5 });
  const [paused, setPaused] = useState(false);
  const [interfaceId, setInterfaceId] = useState<string | null>(null);
  const selectedProject = projects.find(project => project.id === interfaceId);
  useEffect(() => {
    let active = true;
    void document.fonts.ready.then(() => { if (active) setFontsReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (interfaceId) preview.current?.showModal();
    else preview.current?.close();
  }, [interfaceId]);

  useEffect(() => {
    const page = root.current;
    if (!page) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let journey: gsap.core.Tween | undefined;
    let releaseFocus = () => {};
    const cancel = () => { journey?.kill(); journey = undefined; };
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Escape", "Tab"].includes(event.key)) cancel();
    };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      let id: string;
      try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
      const destination = document.getElementById(id);
      if (!destination || !page.contains(destination)) return;
      event.preventDefault();
      cancel();
      const offset = parseFloat(getComputedStyle(destination).scrollMarginTop) || 0;
      const y = Math.max(0, Math.min(destination.getBoundingClientRect().top + window.scrollY - offset, document.documentElement.scrollHeight - innerHeight));
      const arrive = () => {
        if (location.hash !== url.hash) history.pushState(null, "", url.hash);
        releaseFocus();
        const temporaryTabStop = !destination.hasAttribute("tabindex");
        if (temporaryTabStop) {
          destination.setAttribute("tabindex", "-1");
          releaseFocus = () => { destination.removeAttribute("tabindex"); destination.removeEventListener("blur", releaseFocus); };
          destination.addEventListener("blur", releaseFocus, { once: true });
        }
        destination.focus({ preventScroll: true });
        journey = undefined;
      };
      if (paused || reduced.matches) { window.scrollTo({ top: y, behavior: "instant" }); arrive(); return; }
      journey = gsap.to(window, {
        scrollTo: { y, autoKill: true },
        duration: gsap.utils.clamp(0.75, 4.8, Math.sqrt(Math.abs(y - window.scrollY)) / 26),
        ease: "power2.inOut", onComplete: arrive,
      });
    };
    page.addEventListener("click", navigate);
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", cancel);
    reduced.addEventListener("change", cancel);
    return () => {
      cancel(); releaseFocus(); page.removeEventListener("click", navigate);
      window.removeEventListener("wheel", cancel); window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", onKey); window.removeEventListener("popstate", cancel);
      reduced.removeEventListener("change", cancel);
    };
  }, [paused]);

  useGSAP(() => {
    // Adapted from the supplied Kage source: masked word reveals, 72ms word
    // staggering, staggered hero exit and damped chapter-based scene progression.
    // Its temple, shaders, typography and background are intentionally not used.
    const mm = gsap.matchMedia();
    let refreshTimer: ReturnType<typeof setTimeout>;
    const resize = new ResizeObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
    });
    if (root.current) resize.observe(root.current);
    const sections = gsap.utils.toArray<HTMLElement>("[data-ng-chapter]");
    sections.forEach(section => ScrollTrigger.create({
      trigger: section, start: "top 48%", end: "bottom 48%",
      onToggle: self => {
        if (self.isActive && root.current) root.current.dataset.activeSection = section.id;
        if (self.isActive) root.current?.querySelectorAll(".ng-nav a[data-target]").forEach(a => {
          if (a.getAttribute("data-target") === section.id) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        });
      },
    }));
    if (!cinematic) gsap.utils.toArray<HTMLElement>(".ng-project").forEach((article, index) => ScrollTrigger.create({
      trigger: article, start: "top center", end: "bottom center",
      onToggle: self => {
        if (!self.isActive || !root.current) return;
        const variant = projects[index].artifact;
        root.current.dataset.activeExhibit = variant;
        root.current.querySelectorAll<HTMLAnchorElement>(".ng-work-nav a").forEach(a => {
          if (a.dataset.exhibit === variant) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
        });
      },
    }));
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (paused || !introReady) return;
      const typedCharacters = gsap.utils.toArray<HTMLElement>(".ng-hero-type .ng-type-char");
      const typeCaret = root.current?.querySelector<HTMLElement>(".ng-type-caret");
      gsap.set(typedCharacters, { autoAlpha: 0, yPercent: 22 });
      if (typeCaret) gsap.set(typeCaret, { autoAlpha: 0, scaleY: 0.25 });
      const typing = gsap.timeline({ delay: 0.12 });
      if (typeCaret) typing.to(typeCaret, { autoAlpha: 1, scaleY: 1, duration: 0.22, ease: "power2.out" });
      typing.to(typedCharacters, {
        autoAlpha: 1, yPercent: 0, duration: 0.13,
        stagger: 0.034, ease: "power2.out",
      }, typeCaret ? "<0.05" : 0);
      if (typeCaret) typing
        .to(typeCaret, { opacity: 0.18, duration: 0.3, repeat: 5, yoyo: true, ease: "steps(1)" }, ">-0.02")
        .to(typeCaret, { autoAlpha: 0, duration: 0.22, ease: "power2.out" });
      const opening = gsap.timeline({ scrollTrigger: {
        trigger: ".ng-hero", start: "top top", end: "bottom 15%", scrub: 0.35,
      } });
      opening.to(".ng-hero-type .ng-type-line:first-child", { xPercent: -14, yPercent: -45, opacity: 0, ease: "power1.in" }, 0)
        .to(".ng-hero-type .ng-type-line:last-child", { xPercent: 10, yPercent: -25, opacity: 0, ease: "power1.in" }, 0.08)
        .to(".ng-hero-intro, .ng-hero-context, .ng-hero-copy .ng-text-link, .ng-hero-copy .ng-eyebrow", { y: -45, opacity: 0, stagger: 0.04 }, 0);
      gsap.utils.toArray<HTMLElement>(".ng-title-line").forEach(line => {
        gsap.fromTo(line.querySelectorAll(".ng-word"), { yPercent: 112, rotateX: -35, opacity: 0 }, {
          yPercent: 0, rotateX: 0, opacity: 1, duration: 1.05, stagger: 0.072, ease: "expo.out",
          scrollTrigger: { trigger: line, start: "top 92%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".ng-project").forEach((article, index) => {
        const copy = article.querySelector(".ng-project-copy");
        const text = gsap.timeline({ scrollTrigger: { trigger: article, start: "top 88%", end: "bottom 12%", scrub: 0.35 } });
        text.fromTo(copy, { x: cinematic ? (index % 2 ? 75 : -75) : 0, y: 60, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.25, ease: "power2.out" })
          .to(copy, { y: -12, duration: 0.5, ease: "none" })
          .to(copy, { y: -70, opacity: 0, duration: 0.25, ease: "power2.in" });
        const rig = { progress: 0 };
        gsap.to(rig, { progress: 1, ease: "none", scrollTrigger: { trigger: article, start: "top bottom", end: "bottom top", scrub: 0.55 }, onUpdate: () => { sceneProgress.current[projects[index].artifact] = rig.progress; } });
      });
      gsap.utils.toArray<HTMLElement>("[data-ng-reveal]").forEach(element => {
        gsap.fromTo(element, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: element, start: "top 92%", once: true } });
      });
      gsap.fromTo(".ng-proof > span", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".ng-proof", start: "top 88%", once: true } });
      gsap.utils.toArray<HTMLElement>(".ng-career .mission-card, .ng-skills > div").forEach(row => {
        gsap.fromTo(row, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: "power3.out", scrollTrigger: { trigger: row, start: "top 93%", once: true } });
      });
      if (cinematic) {
        gsap.fromTo(".ng-introduction h2", { xPercent: -4 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: ".ng-introduction", start: "top bottom", end: "bottom top", scrub: 0.5 } });
      }
    });
    return () => { clearTimeout(refreshTimer); resize.disconnect(); mm.revert(); };
  }, { scope: root, dependencies: [paused, cinematic, introReady], revertOnUpdate: true });

  return <main ref={root} className={`night-gallery ${cinematic ? "ng-cinematic" : ""}`} id="gallery-top" data-motion={paused ? "paused" : "running"} data-intro={introReady ? "ready" : "waiting"}>
    <BlackHoleBackground paused={paused} onReady={markBackgroundReady} />
    {cinematic && <GalleryWorld root={root} paused={paused} onUnavailable={markWorldUnavailable} onReady={markWorldReady} />}
    <a className="ng-skip" href="#projects">Skip to selected work</a>
    <GalleryDock paused={paused} onPause={() => setPaused(p => !p)} />
    <GalleryCursor paused={paused} />

    <section className="ng-hero" data-ng-chapter id="entrance">
      <div className="ng-hero-copy">
        <p className="ng-eyebrow">DATA SCIENCE & APPLIED AI</p>
        <h1 className="ng-hero-type" aria-label="Intelligence, with intention."><HeroTypeLine text="Intelligence," /><HeroTypeLine text="with intention." accent caret /></h1>
        <p className="ng-hero-intro">I turn complex data into reliable systems.<br />Built to be understood. Designed to make a difference.</p>
        <div className="ng-hero-context"><span>Michigan, USA</span><span>Open to data &amp; AI roles</span></div>
        <MetalLink className="ng-text-link" href="#projects">Explore selected work <span aria-hidden="true">↘</span></MetalLink>
      </div>
      <div className="ng-hero-art"><GalleryModel variant="lucy" paused={paused} progress={sceneProgress} cinematic={cinematic} key={String(cinematic)} /></div>
    </section>

    <section className="ng-introduction ng-wrap">
      <h2><RevealTitle text="Find the signal." /><RevealTitle text="Make it matter." italic /></h2>
      <div className="ng-intro-bottom" data-ng-reveal><p>From healthcare intelligence to secure AI agents, I work where statistical rigor meets the realities of production.</p><div className="ng-proof"><span><b>131</b>datasets governed</span><span><b>80%+</b>less analytics latency</span><span><b>3M+</b>healthcare claims</span><span><b>$3.5M</b>annual risk reduced</span></div></div>
    </section>

    <section className="ng-career ng-wrap" data-ng-chapter id="career">
      <div className="ng-section-head"><p className="ng-eyebrow">PROFESSIONAL EXPERIENCE</p><h2><RevealTitle text="Built in the" /><RevealTitle text="real world." italic /></h2><p data-ng-reveal>Healthcare. Consulting. Aerospace. Enterprise data.</p></div>
      <div className="mission-stack ng-career-list">{experiences.map((role, i) => <article key={`${role.company}-${i}`} className={`mission-card ${i === 0 ? "current" : ""}`}>
        <div className="mission-index"><span>0{experiences.length - i}</span><small>{role.code}</small></div>
        <div className={`company-logo company-logo-${role.logoClass}`}><Image src={`../${role.logo}`} alt={role.logoAlt} width={220} height={110} /></div>
        <div className="mission-main"><div className="mission-meta"><b>{role.status}</b><time>{role.period}</time></div><h3>{role.role}</h3><p className="company-name">{role.company}</p><p className="mission-summary">{role.summary}</p><ul>{role.highlights.map(item => <li key={item}>{item}</li>)}</ul></div>
        <div className="mission-reward"><strong>{role.reward}</strong><div>{role.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
      </article>)}</div>

    </section>

    <section className="ng-work ng-wrap" data-ng-chapter id="projects">
      <div className="ng-section-head"><p className="ng-eyebrow">SELECTED WORK</p><h2><RevealTitle text="Ideas, in practice." italic /></h2><p data-ng-reveal>Explore the models. See the systems behind them.</p></div>
      <nav className="ng-work-nav" aria-label="Selected projects">{projects.map(project => <a href={`#exhibit-${project.id}`} key={project.id} aria-label={project.name} data-exhibit={project.artifact}><span className="ng-tab-label"><strong>{project.artifact === "ecg" ? "ECG research" : project.name}</strong><small>{project.artifact === "ecg" ? "Clinical machine learning" : project.artifact === "forecast" ? "Forecasting & decision science" : project.artifact === "guard" ? "Agent security" : "Multi-agent retrieval"}</small></span><span className="ng-tab-arrow" aria-hidden="true">↗</span></a>)}</nav>
      <div className="ng-work-stage">{projects.map((project, index) => <article className={`ng-project ${index % 2 ? "ng-project-reverse" : ""}`} key={project.id}>
        <div className="ng-project-label" id={`exhibit-${project.id}`}><div className="ng-project-copy">
          <div className="ng-project-topline"><span className="ng-project-index">{project.name}</span><span>{project.artifact === "ecg" ? "Research" : project.artifact === "forecast" ? "Applied ML" : "AI systems"}</span></div>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div className="ng-outcome"><span>Outcome</span><p>{project.outcome}</p></div>
          <div className="ng-project-stats">{project.stats.map(stat => <ProjectStat text={stat} key={stat} />)}</div>
          <ul className="ng-tech" aria-label={`${project.name} technology stack`}>{project.tools.map(tool => <li key={tool}>{tool}</li>)}</ul>
          <MetalButton className="ng-preview-card" aria-haspopup="dialog" aria-controls="ng-project-dialog" onClick={() => setInterfaceId(project.id)}><Image src={`../${project.image}`} alt="" width={320} height={210} /><span>Project preview<small>Take a closer look</small></span><span aria-hidden="true">↗</span></MetalButton>
          <div className="ng-project-links">
            {project.href ? <MetalLink href={project.href} target="_blank" rel="noreferrer">{project.id === "ecg-anomaly-detection" ? "Read publication" : "Explore the code"} ↗</MetalLink> : <span>Private industry work</span>}
          </div>
        </div></div>
        <div className="ng-project-art"><GalleryModel variant={project.artifact} paused={paused} progress={sceneProgress} cinematic={cinematic} key={String(cinematic)} /></div>
      </article>)}</div>
    </section>

    <section className="ng-toolkit ng-wrap" aria-label="Technology stack">
      <div className="ng-capabilities"><h3 className="ng-toolkit-heading">Tools of the trade.</h3><div className="ng-skills">{skillGroups.map(group => <div key={group.label}><h3>{group.label}</h3><p>{group.focus}</p><ul>{group.skills.map(skill => <li key={skill}>{skill}</li>)}</ul></div>)}</div><div className="ng-language-strip"><span>Primary languages</span><div><b>Python</b><b>SQL</b><b>JavaScript</b><b>C#</b><b>Java</b></div><strong>Production toolkit</strong></div></div>
    </section>

    <section className="ng-about ng-wrap" id="about" data-ng-chapter>
      <div className="ng-about-copy"><h2><RevealTitle text="Technical depth." /><RevealTitle text="Human curiosity." italic /></h2><p data-ng-reveal>I am at my best on teams that treat accuracy, traceability, and usability as one problem. I like turning ambiguous questions into systems people can inspect, challenge, and improve.</p><p data-ng-reveal>Clear assumptions. Direct feedback. Small experiments before expensive commitments. And always a little room to explore.</p><div className="ng-focus-grid" data-ng-reveal><article><span>Current focus</span><p>Trustworthy agent behavior, interpretable healthcare ML, and evaluation methods grounded in real workflows.</p></article><article><span>Growing toward</span><p>Technical leadership across applied AI and data platforms where regulation and human judgment matter.</p></article></div><div className="ng-education"><div><span>Michigan State University</span><h3>M.S. Data Science</h3><p><b>3.92 / 4.0 GPA</b> · ML, NLP, LLM foundations, statistics, optimization</p></div><div><span>NIIT University</span><h3>B.Tech Computer Science</h3><p><b>3.6 / 4.0 GPA</b> · Algorithms, software engineering, applied machine learning</p></div></div></div>
      <div className="ng-about-art"><GalleryModel variant="mouse" paused={paused} progress={sceneProgress} cinematic={cinematic} key={String(cinematic)} /><p className="ng-aside-note">A resourceful companion for the journey.</p></div>
    </section>

    <section className="ng-contact ng-wrap" id="contact" data-ng-chapter>
      <div className="ng-contact-copy"><h2><RevealTitle text="Serious about" /><RevealTitle text="the work." /><RevealTitle text="Room for play." italic /></h2><MetalLink className="ng-contact-link" href="mailto:vsohee@gmail.com">Let’s build something ↗</MetalLink><p>Open to data science, ML, and applied AI opportunities.</p><div className="ng-social"><a href="mailto:vsohee@gmail.com">vsohee@gmail.com ↗</a><a href="https://www.linkedin.com/in/vaasu-sohee/" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://github.com/vaasu202" target="_blank" rel="noreferrer">GitHub ↗</a><a href="tel:+15174907865">517-490-7865</a></div></div>
      <div className="ng-contact-art"><GalleryModel variant="trooper" paused={paused} progress={sceneProgress} cinematic={cinematic} key={String(cinematic)} /></div>
    </section>

    <footer className="ng-footer ng-wrap"><div><a href="#gallery-top">Vaasu Sohee ↑</a></div><details><summary>Exhibit credits</summary><p>Lucy sculpture from the <a href="https://threejs.org/examples/webgl_lights_spotlight.html" target="_blank" rel="noreferrer">Three.js spotlight example</a>. Dancing Stormtrooper by <a href="https://sketchfab.com/strykerdoesgames" target="_blank" rel="noreferrer">StrykerDoesAnimation</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, via Three.js. Adapted staging, lighting and playback. Existing procedural models and project previews retained from this portfolio. Model interactions are illustrative simulations. Scroll choreography adapted from the supplied Kage reference.</p></details></footer>
    <dialog ref={preview} id="ng-project-dialog" className="ng-preview-dialog" aria-labelledby="ng-preview-title" onClose={() => setInterfaceId(null)} onClick={event => { if (event.target === event.currentTarget) setInterfaceId(null); }}>
      {selectedProject && <div className="ng-preview-inner"><div className="ng-preview-header"><h2 id="ng-preview-title">{selectedProject.name}</h2><MetalButton onClick={() => setInterfaceId(null)} aria-label="Close project preview">Close ×</MetalButton></div><Image src={`../${selectedProject.image}`} alt={selectedProject.imageAlt} width={1400} height={800} /><p>{selectedProject.imageAlt}</p></div>}
    </dialog>
  </main>;
}

