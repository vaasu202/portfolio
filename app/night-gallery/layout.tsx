import type { Metadata } from "next";
import localFont from "next/font/local";

const migha = localFont({
  src: "../../public/fonts/migha-variable.ttf",
  variable: "--ng-display",
  weight: "100 900",
  display: "swap",
});
const onest = localFont({ src: "../../public/fonts/onest-variable.ttf", variable: "--ng-body", weight: "100 900", display: "swap" });
const syne = localFont({
  src: "../../public/fonts/syne-variable.ttf",
  variable: "--ng-geometry",
  weight: "400 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vaasu Sohee - Night Gallery",
  description: "An interactive gallery of machine learning, data systems and GenAI work by Vaasu Sohee.",
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${migha.variable} ${syne.variable} ${onest.variable}`}>{children}</div>;
}
