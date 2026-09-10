import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "https://vaasu202.github.io/Portfolio";
const basePath = process.env.BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Vaasu Sohee — Data Science & Applied AI",
  description: "Explore Vaasu Sohee's interactive portfolio of production ML systems, data platforms, GenAI, and clinical research.",
  keywords: ["Vaasu Sohee", "Data Scientist", "Data Engineer", "Machine Learning", "GenAI", "MLOps"],
  authors: [{ name: "Vaasu Sohee" }],
  openGraph: {
    title: "Vaasu Sohee — Data Science & Applied AI",
    description: "Explore production ML, data engineering, GenAI, and clinical research in an interactive 3D portfolio.",
    type: "website",
    url: siteUrl,
    images: [{ url: `${siteUrl.replace(/\/$/, "")}/og.png`, width: 1200, height: 630, alt: "Vaasu Sohee portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaasu Sohee — Data Science & Applied AI",
    description: "Explore production ML, data engineering, GenAI, and clinical research in an interactive 3D portfolio.",
    images: [`${siteUrl.replace(/\/$/, "")}/og.png`],
  },
  icons: { icon: `${basePath}/teddy-bear.svg`, shortcut: `${basePath}/teddy-bear.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
