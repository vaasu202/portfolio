import type { Metadata } from "next";
import localFont from "next/font/local";

const glametrix = localFont({
  src: [
    { path: "../../public/fonts/glametrix-light.otf", weight: "300", style: "normal" },
    { path: "../../public/fonts/glametrix-regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/glametrix-bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--ng-display",
  display: "swap",
});
const onest = localFont({ src: "../../public/fonts/onest-variable.ttf", variable: "--ng-body", weight: "100 900", display: "swap" });
const plexMono = localFont({
  src: [
    { path: "../../public/fonts/ibm-plex-mono-regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/ibm-plex-mono-medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/ibm-plex-mono-semibold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--ng-data",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vaasu Sohee - Night Gallery",
  description: "An interactive gallery of machine learning, data systems and GenAI work by Vaasu Sohee.",
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${glametrix.variable} ${onest.variable} ${plexMono.variable}`}>{children}</div>;
}
