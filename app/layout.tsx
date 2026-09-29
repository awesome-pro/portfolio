import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  ALUMNI_OF,
  AWARDS,
  CURRENT_ROLE,
  EMAIL,
  JOB_TITLES,
  KNOWS_ABOUT,
  PERSON_ID,
  PERSON_NAME,
  SAME_AS,
  SUMMARY,
  WEBSITE_ID,
} from "@/lib/identity";
import "./globals.css";

const siteUrl = "https://abhinandan.one";
const siteName = "abhinandan";
const siteTitle = `${PERSON_NAME} | inference & RL engineer`;
/** The same sentence agents get from the schema and /llms.txt. */
const siteDescription = SUMMARY;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-reading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "technology",
  keywords: [
    "Abhinandan",
    "inference engineer",
    "LLM inference",
    "vLLM",
    "SGLang",
    "TensorRT-LLM",
    "KV cache",
    "quantization",
    "speculative decoding",
    "reinforcement learning",
    "RL post-training",
    "reasoning models",
    "model serving",
    "ML engineer",
    "agentic AI",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: PERSON_NAME,
      givenName: "Abhinandan",
      // Handles an agent may have seen before it ever reached this site.
      alternateName: ["abhinandan", "awesome-pro", "abhibuilds", "0xAbhinandan"],
      url: siteUrl,
      image: `${siteUrl}/hero-photo.jpg`,
      email: `mailto:${EMAIL}`,
      jobTitle: JOB_TITLES,
      description: SUMMARY,
      // The identity backbone: without this an agent cannot tell that the
      // GitHub account behind a merged vLLM PR is the person on this page.
      sameAs: SAME_AS,
      knowsAbout: KNOWS_ABOUT,
      worksFor: {
        "@type": "Organization",
        name: CURRENT_ROLE.organization,
      },
      hasOccupation: {
        "@type": "Occupation",
        name: JOB_TITLES[0],
        occupationLocation: { "@type": "Country", name: "India" },
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: ALUMNI_OF,
      },
      hasCredential: {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "degree",
        educationalLevel: "Bachelor of Technology",
        about: "Computer Science",
        dateCreated: "2026",
        recognizedBy: { "@type": "CollegeOrUniversity", name: ALUMNI_OF },
      },
      award: AWARDS,
      address: { "@type": "PostalAddress", addressCountry: "IN" },
      // What he is asking for. `availability: InStock` is the schema.org way of
      // saying "can start now" — the same claim the hero makes on hover.
      seeks: {
        "@type": "Demand",
        name: "Full-time inference and ML engineering roles",
        description:
          "LLM serving and runtime work, KV cache and quantization, RL post-training for reasoning models. Available immediately.",
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      inLanguage: "en-US",
      publisher: { "@id": PERSON_ID },
      // Tells an agent where the machine-readable versions live, from inside
      // the graph rather than only from robots.txt.
      subjectOf: [
        { "@type": "CreativeWork", name: "llms.txt", url: `${siteUrl}/llms.txt` },
        {
          "@type": "CreativeWork",
          name: "llms-full.txt",
          url: `${siteUrl}/llms-full.txt`,
        },
      ],
    },
    {
      "@type": "ProfilePage",
      "@id": `${siteUrl}/#profile`,
      url: siteUrl,
      name: siteTitle,
      description: siteDescription,
      inLanguage: "en-US",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      mainEntity: { "@id": PERSON_ID },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${sourceSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Restores the stored reading view before first paint so the agent
            view never flashes the human layout. Runs before hydration; the
            <html> element already carries suppressHydrationWarning. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("view")==="agent")document.documentElement.dataset.view="agent"}catch(e){}',
          }}
        />
        {/* llms.txt v2's discovery relation. Nothing hunts for /llms.txt; a
            crawler only reaches it by being linked to it, so this is the link. */}
        <link rel="describedby" href="/llms.txt" type="text/plain" />
      </head>
      <body className="min-h-screen bg-background text-ink font-serif">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics gaId="G-F68MYYBRLW" />
      </body>
    </html>
  );
}
