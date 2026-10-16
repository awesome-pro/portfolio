#!/usr/bin/env node
// Checks that every published artifact actually ships the SEO/AEO surface it
// claims: structured data, social images, deep-linkable sections, and the
// plain-text indexes.
//
// The one assertion worth keeping permanently is the section contract:
// `hasPart` lists fragment ids that `lib/heading-anchors.ts` predicts, and the
// page renders them with rehype-slug. If those two ever disagree, the page
// advertises anchors that do not exist — worse than advertising none, because
// an answer engine will cite a link that lands nowhere.
//
// Usage: node scripts/check-artifact-seo.mjs [baseUrl]
//   pnpm seo:check                      # against http://localhost:3000
//   pnpm seo:check https://abhinandan.one

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const failures = [];
let checks = 0;

function check(name, ok, detail = "") {
  checks += 1;
  if (!ok) failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  return {
    status: res.status,
    headers: res.headers,
    body: await res.text(),
  };
};

function graphNodes(html) {
  const nodes = [];
  const blocks = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while ((match = blocks.exec(html))) {
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch (error) {
      nodes.push({ parseError: String(error) });
      continue;
    }
    if (parsed["@graph"]) nodes.push(...parsed["@graph"]);
    else nodes.push(parsed);
  }
  return nodes;
}

const hasType = (node, type) =>
  Array.isArray(node?.["@type"])
    ? node["@type"].includes(type)
    : node?.["@type"] === type;

const sitemap = await get("/sitemap.xml");
const slugs = [
  ...sitemap.body.matchAll(/<loc>(\S+)\/artifacts\/([^<]+)<\/loc>/g),
].map((match) => match[2]);
console.log(`checking ${slugs.length} artifacts on ${BASE}\n`);

check("sitemap declares the image namespace", sitemap.body.includes("xmlns:image="));
check("sitemap carries image entries", sitemap.body.includes("<image:image>"));

const artifactPage = await get(`/artifacts/${slugs[0]}`);
check(
  "content signals travel as headers, not only in robots.txt",
  Boolean(artifactPage.headers.get("content-usage")) &&
    Boolean(artifactPage.headers.get("content-signal")),
  `${artifactPage.headers.get("content-usage")} | ${artifactPage.headers.get("content-signal")}`
);

let sectionsChecked = 0;
let tocChecked = 0;
let codeNodes = 0;
let videosChecked = 0;

for (const slug of slugs) {
  const page = await get(`/artifacts/${slug}`);
  // strip React's text-node separator comments before matching text
  const html = page.body.replace(/<!--\s*-->/g, "");
  const problems = [];

  if (page.status !== 200) {
    check(slug, false, `status ${page.status}`);
    continue;
  }

  const nodes = graphNodes(html);
  if (nodes.some((node) => node.parseError)) {
    check(slug, false, nodes.find((node) => node.parseError).parseError);
    continue;
  }

  const article = nodes.find((node) => hasType(node, "TechArticle"));
  const webPage = nodes.find((node) => hasType(node, "WebPage"));
  const canonical = `https://abhinandan.one/artifacts/${slug}`;

  if (!article) problems.push("no TechArticle node");
  else {
    if (!hasType(article, "Article")) problems.push("not dual-typed with Article");
    if (article["@id"] !== `${canonical}#article`) problems.push("wrong @id");
    if (article.author?.["@id"] !== "https://abhinandan.one/#person") problems.push("author is not an @id reference");
    if (article.publisher?.["@id"] !== "https://abhinandan.one/#person") problems.push("no publisher");
    if (!(article.wordCount > 0)) problems.push("no wordCount");
    if (!/^PT\d+M$/.test(article.timeRequired ?? "")) problems.push("no timeRequired");
    if (!article.dateModified) problems.push("no dateModified");
    if (!article.image?.length) problems.push("no image");

    // Images must be nodes with attribution, and the primary one resolvable.
    const images = article.image ?? [];
    if (!images.every((image) => hasType(image, "ImageObject"))) problems.push("images are not ImageObjects");
    if (!images.every((image) => image.creator?.["@id"] === "https://abhinandan.one/#person")) {
      problems.push("image creator not an @id reference");
    }
    const primary = images.find((image) => image["@id"] === `${canonical}#primaryimage`);
    if (!primary) problems.push("no primaryImageOfPage image in the graph");
    if (webPage?.primaryImageOfPage?.["@id"] !== `${canonical}#primaryimage`) {
      problems.push("WebPage does not point at the primary image");
    }

    // Section contract: every listed fragment must exist in the HTML.
    const renderedIds = new Set(
      [...html.matchAll(/<h[1-6][^>]*\sid="([^"]+)"/g)].map((match) => match[1])
    );
    const listed = (article.hasPart ?? []).map((part) => part["@id"].split("#")[1]);
    const missing = listed.filter((id) => !renderedIds.has(id));
    if (missing.length > 0) problems.push(`hasPart points at unrendered ids: ${missing.join(", ")}`);
    if (listed.length > 0) sectionsChecked += 1;

    // A section list with no links to it is decoration, not navigation.
    if (listed.length >= 3) {
      const linked = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
      const unlinked = listed.filter((id) => !linked.includes(id));
      if (unlinked.length > 0) problems.push(`sections with no visible link: ${unlinked.join(", ")}`);
      else tocChecked += 1;
    }

    // Code companion, when the artifact links a repository.
    const code = nodes.find((node) => hasType(node, "SoftwareSourceCode"));
    if (code) {
      codeNodes += 1;
      if (article.about?.["@id"] !== code["@id"]) problems.push("article does not reference its code node");
      if (!code.codeRepository) problems.push("code node has no codeRepository");
    }
  }

  const crumbs = nodes.find((node) => hasType(node, "BreadcrumbList"));
  if (crumbs?.itemListElement?.length !== 3) problems.push("breadcrumb trail incomplete");

  // Social tags, canonical, and the visible metadata.
  const ogImage = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
  const twitterImage = /<meta name="twitter:image" content="([^"]+)"/.exec(html)?.[1];
  const canonicalTag = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  if (!ogImage) problems.push("no og:image");
  if (ogImage !== twitterImage) problems.push("og/twitter image mismatch");
  if (canonicalTag !== canonical) problems.push(`canonical is ${canonicalTag}`);
  if (!/<time[^>]*\sdateTime="([^"]+)"/i.test(html)) problems.push("no <time datetime>");
  if (!/\d+ min read/.test(html)) problems.push("no visible reading time");
  if (!/rel="author"/.test(html)) problems.push("no visible author byline");
  if (!html.includes('aria-label="Breadcrumb"')) problems.push("no visible breadcrumb");

  // The generated card has to be a real PNG when it is the one being used.
  if (ogImage?.includes("/og/artifacts/")) {
    const card = await fetch(ogImage.replace("https://abhinandan.one", BASE));
    const bytes = Buffer.from(await card.arrayBuffer());
    if (bytes.subarray(0, 4).toString("hex") !== "89504e47") problems.push("fallback card is not a PNG");
  }

  // A demo video has to be both present and attached: a VideoObject node the
  // article never references is a claim with nothing pointing at it.
  const video = nodes.find((node) => hasType(node, "VideoObject"));
  if (video) {
    videosChecked += 1;
    if (article?.video?.["@id"] !== video["@id"]) problems.push("article does not reference its VideoObject");
    if (!video.thumbnailUrl?.startsWith("https://")) problems.push("VideoObject thumbnail missing");
    if (!video.uploadDate) problems.push("VideoObject uploadDate missing");
    if (!video.embedUrl) problems.push("VideoObject embedUrl missing");
    if (!video.contentUrl) problems.push("VideoObject contentUrl missing");
    if (!video.description) problems.push("VideoObject description missing");
  }

  check(slug, problems.length === 0, problems.join("; "));
}

check("artifacts with headings publish a matched section list", sectionsChecked > 0, `${sectionsChecked}`);
check("long artifacts link every section", tocChecked > 0, `${tocChecked} with a table of contents`);
check("artifacts linking code publish a SoftwareSourceCode node", codeNodes > 0, `${codeNodes}`);
check("demo videos are attached to their article", videosChecked > 0, `${videosChecked}`);

// The index, the homepage, and the plain-text surfaces.
const index = await get("/artifacts");
const indexNodes = graphNodes(index.body);
const list = indexNodes.find((node) => hasType(node, "ItemList"));
check("index publishes a CollectionPage", Boolean(indexNodes.find((node) => hasType(node, "CollectionPage"))));
check(
  "index ItemList covers every artifact",
  list?.itemListElement?.length === slugs.length,
  `${list?.itemListElement?.length}/${slugs.length}`
);
check("index has breadcrumbs", Boolean(indexNodes.find((node) => hasType(node, "BreadcrumbList"))));

const home = graphNodes((await get("/")).body);
check("homepage publishes selected artifacts", Boolean(home.find((node) => hasType(node, "ItemList"))));
check("homepage still declares the person entity", Boolean(home.find((node) => hasType(node, "Person"))));

const llms = await get("/llms.txt");
check("llms.txt lists artifacts with reading time", /\d+ min read/.test(llms.body));
check("llms.txt FAQ section is a file list", /^- \[.+\]\(https:\/\/\S+\): /m.test(llms.body));
check("llms.txt links the resume as text", llms.body.includes("/resume.txt"));
const llmsFull = await get("/llms-full.txt");
check("llms-full.txt carries per-artifact keywords", llmsFull.body.includes("- keywords:"));

// The resume has one source — data/resume.tex — and reads out in three places:
// the PDF a human opens at /resume, /resume.txt, and the two llms files. These
// assert the text forms agree with each other and carry no LaTeX, because the
// failure that matters is an agent quoting a resume the human cannot find in
// the PDF. Nothing is compared against a copied sentence: the surfaces are
// compared against each other, so there is no fourth copy to fall out of date.
const resumeText = await get("/resume.txt");
check(
  "resume.txt is served as plain text",
  resumeText.status === 200 &&
    (resumeText.headers.get("content-type") ?? "").includes("text/plain"),
  `status ${resumeText.status}`
);
check(
  "resume.txt carries no LaTeX",
  !/\\[a-zA-Z]+/.test(resumeText.body),
  (resumeText.body.match(/\\[a-zA-Z]+/) ?? [""])[0]
);
check(
  "resume.txt names the PDF it mirrors",
  resumeText.body.includes("/resume.pdf")
);

const resumePdf = await get("/resume.pdf");
check(
  "the resume PDF it mirrors is served",
  resumePdf.status === 200 &&
    (resumePdf.headers.get("content-type") ?? "").includes("pdf"),
  `status ${resumePdf.status}`
);

const resumeBlock =
  llmsFull.body.split("\n# Resume\n")[1]?.split("\n# Projects")[0] ?? "";
const bulletsIn = (body) => body.split("\n").filter((line) => line.startsWith("- "));
const fullBullets = bulletsIn(resumeBlock);
const textBullets = bulletsIn(resumeText.body);
check(
  "llms-full.txt and resume.txt carry the same resume bullets",
  fullBullets.length > 0 &&
    fullBullets.every((line) => textBullets.includes(line)),
  `${fullBullets.length} in llms-full, ${textBullets.length} in resume.txt`
);

const keyFile = await get("/indexnow-key.txt");
check(
  "IndexNow key is served from the host root",
  keyFile.status === 200 && /^[0-9a-f]{8,128}$/.test(keyFile.body.trim()),
  keyFile.body.trim()
);

console.log(`\n${checks - failures.length}/${checks} checks passed`);
if (failures.length > 0) {
  console.log("\nFAILURES:");
  for (const failure of failures) console.log(` - ${failure}`);
}
process.exit(failures.length === 0 ? 0 : 1);
