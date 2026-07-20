import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "https://vaasu202.github.io/Portfolio";
const basePath = process.env.BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Vaasu Sohee — Data Scientist & Data Engineer",
  description: "Portfolio of Vaasu Sohee: production ML systems, data engineering, GenAI platforms, applied research, and measurable business impact.",
  keywords: ["Vaasu Sohee", "Data Scientist", "Data Engineer", "Machine Learning", "GenAI", "MLOps"],
  authors: [{ name: "Vaasu Sohee" }],
  openGraph: {
    title: "Vaasu Sohee — Data Scientist & Data Engineer",
    description: "Production ML, data platforms, and GenAI systems built for measurable impact.",
    type: "website",
    url: siteUrl,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vaasu Sohee portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaasu Sohee — Data Scientist & Data Engineer",
    description: "Production ML, data platforms, and GenAI systems built for measurable impact.",
    images: ["/og.png"],
  },
  icons: { icon: `${basePath}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
