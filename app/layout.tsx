import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "https://vaasu202.github.io/Portfolio";
const basePath = process.env.BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Vaasu Sohee // Portfolio Campaign",
  description: "Explore Vaasu Sohee's interactive data and AI portfolio campaign: production ML systems, data platforms, GenAI, research, and measurable impact.",
  keywords: ["Vaasu Sohee", "Data Scientist", "Data Engineer", "Machine Learning", "GenAI", "MLOps"],
  authors: [{ name: "Vaasu Sohee" }],
  openGraph: {
    title: "Vaasu Sohee // Portfolio Campaign",
    description: "Explore production ML, data engineering, and GenAI work through an interactive portfolio campaign.",
    type: "website",
    url: siteUrl,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vaasu Sohee portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaasu Sohee // Portfolio Campaign",
    description: "Explore production ML, data engineering, and GenAI work through an interactive portfolio campaign.",
    images: ["/og.png"],
  },
  icons: { icon: `${basePath}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
