const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const destination = `${basePath}/night-gallery/`;

/** The Night Gallery is the canonical portfolio; keep the existing Pages URL useful. */
export default function Home() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#08090c", color: "#f3f0eb", fontFamily: "system-ui, sans-serif" }}>
    <meta httpEquiv="refresh" content={`0; url=${destination}`} />
    <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(destination)})` }} />
    <a href={destination} style={{ color: "inherit" }}>Enter Vaasu Sohee’s portfolio</a>
  </main>;
}
