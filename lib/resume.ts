/**
 * The resume, read from the LaTeX that typesets the PDF humans read.
 *
 * There is one resume. `data/resume.tex` is its source, `public/resume.pdf` is
 * the typeset copy served at `/resume`, and `/resume.txt` is the same words as
 * text so an agent does not have to extract them from a PDF.
 *
 * Nothing here paraphrases. The parser walks the document body and reduces
 * LaTeX to the words it typesets — macros that carry no text (`\Huge`,
 * `\vspace`) disappear, macros that wrap text keep it, and maths turns back
 * into the character it prints (`$\sim$` → `~`, `$\times$` → `×`). If a line
 * changes in `data/resume.tex`, every surface changes with it, and there is no
 * second copy to fall out of date. That is the whole point: an agent quoting
 * the resume and a human reading the PDF must never be able to disagree.
 *
 * Only the document body is read, so the preamble (`\usepackage`, page
 * geometry, the `\resumeItem` definitions) never reaches the output.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

/** The single source. Both the PDF and every text view are built from this. */
export const RESUME_TEX = "data/resume.tex";

/** Where each form of the same document is published. */
export const RESUME_PAGE = "/resume";
export const RESUME_PDF = "/resume.pdf";
export const RESUME_TEXT = "/resume.txt";

/**
 * The framing the /resume page carries, exported so the page and the text view
 * cannot describe the same document two different ways.
 */
export const RESUME_TITLE = "Abhinandan";
export const RESUME_SUBTITLE = "Agentic AI Engineer & ML Engineer";
export const RESUME_DESCRIPTION =
  "Abhinandan's resume for agentic AI, machine learning engineering, and production AI infrastructure roles.";

export type ResumeEntry = {
  /** `role` is a job, `heading` is a project or a degree. */
  kind: "role" | "heading";
  title: string;
  organization: string;
  location: string;
  dates: string;
  bullets: string[];
};

export type ResumeSection = {
  title: string;
  entries: ResumeEntry[];
  /** Lines that are not bullets — the skills rows and the recognition line. */
  lines: string[];
};

export type Resume = {
  name: string;
  contact: string[];
  sections: ResumeSection[];
};

/**
 * Macros whose argument is formatting, never text, so the argument is dropped
 * along with the macro. Everything else keeps whatever it wraps.
 */
const DROP_ARGUMENT = new Set([
  "addtolength",
  "begin",
  "documentclass",
  "end",
  "fancyhf",
  "hspace",
  "input",
  "label",
  "newcommand",
  "pagestyle",
  "renewcommand",
  "setlength",
  "titleformat",
  "urlstyle",
  "usepackage",
  "vspace",
]);

/** What LaTeX prints for the maths the resume actually uses. */
const MATH: [RegExp, string][] = [
  [/\\leftrightarrow/g, "↔"],
  [/\\rightarrow/g, "→"],
  [/\\leftarrow/g, "←"],
  [/\\times/g, "×"],
  [/\\leq/g, "≤"],
  [/\\geq/g, "≥"],
  [/\\sim/g, "~"],
  [/\\%/g, "%"],
  [/\\[,;:]/g, " "],
];

function skipSpace(src: string, start: number): number {
  let i = start;
  while (i < src.length && /\s/.test(src[i] ?? "")) i += 1;
  return i;
}

/** Reads the brace-balanced group at `start`, where `src[start] === "{"`. */
function readGroup(src: string, start: number): { body: string; end: number } {
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    // A backslash escapes the next character, including `\{` and `\}`.
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return { body: src.slice(start + 1, i), end: i + 1 };
    }
  }
  return { body: src.slice(start + 1), end: src.length };
}

/** Skips `[ ... ]`, the optional argument of `\begin{itemize}` and friends. */
function skipOptional(src: string, start: number): number {
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === "[") depth += 1;
    else if (src[i] === "]") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return src.length;
}

/** Reads up to `count` consecutive `{ ... }` arguments, whitespace between them. */
function readGroups(
  src: string,
  start: number,
  count: number
): { bodies: string[]; end: number } {
  const bodies: string[] = [];
  let i = start;
  for (let n = 0; n < count; n += 1) {
    i = skipSpace(src, i);
    if (src[i] !== "{") break;
    const group = readGroup(src, i);
    bodies.push(group.body);
    i = group.end;
  }
  return { bodies, end: i };
}

/**
 * Consumes the arguments of a macro that carries no text. Used both when
 * reducing a fragment and when walking the document, so a `\begin{itemize}`
 * never leaves a stray `itemize` behind in either pass.
 */
function skipArguments(src: string, start: number): number {
  let i = skipSpace(src, start);
  if (src[i] === "[") i = skipSpace(src, skipOptional(src, i));
  if (src[i] === "{") i = skipSpace(src, readGroup(src, i).end);
  if (src[i] === "[") i = skipOptional(src, i);
  return i;
}

/** `\%` is a printed percent sign, and a URL is not allowed to keep the slash. */
function unescapeLatex(text: string): string {
  return text
    .replace(/\\([%#&_${}])/g, "$1")
    .replace(/\\[,;: ]/g, " ")
    .trim();
}

function mathToText(body: string): string {
  let out = body;
  for (const [pattern, replacement] of MATH) out = out.replace(pattern, replacement);
  return out.replace(/[{}\\]/g, "").trim();
}

/** Collapses the newlines and indentation LaTeX uses to lay source out. */
function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Reduces a fragment of LaTeX to the text it prints, keeping emphasis as
 * markdown and links as their label plus target.
 */
function convert(src: string): string {
  let out = "";
  let i = 0;

  while (i < src.length) {
    const ch = src[i] ?? "";

    if (ch === "\\") {
      const word = /^[a-zA-Z]+\*?/.exec(src.slice(i + 1));
      if (word) {
        const name = word[0].replace(/\*$/, "");
        const after = i + 1 + word[0].length;

        if (name === "href") {
          const groups = readGroups(src, after, 2);
          const [url = "", label = ""] = groups.bodies;
          out += `[${convert(label)}](${unescapeLatex(url)})`;
          i = groups.end;
          continue;
        }

        if (name === "textbf") {
          const group = readGroups(src, after, 1);
          out += `**${convert(group.bodies[0] ?? "")}**`;
          i = group.end;
          continue;
        }

        if (name === "emph" || name === "textit" || name === "textsl") {
          const group = readGroups(src, after, 1);
          out += `*${convert(group.bodies[0] ?? "")}*`;
          i = group.end;
          continue;
        }

        if (DROP_ARGUMENT.has(name)) {
          i = skipArguments(src, after);
          continue;
        }

        // A macro that only switches a font or opens a list. Its argument, if
        // any, is read by the loop below as a plain group and kept.
        i = after;
        continue;
      }

      const next = src[i + 1] ?? "";
      if (next === "\\") {
        out += "\n";
        i += 2;
        continue;
      }
      if ("%#&_${}".includes(next)) {
        out += next;
        i += 2;
        continue;
      }
      if (next === " " || next === ",") {
        out += " ";
        i += 2;
        continue;
      }
      out += next;
      i += 2;
      continue;
    }

    if (ch === "$") {
      const close = src.indexOf("$", i + 1);
      if (close === -1) {
        out += ch;
        i += 1;
        continue;
      }
      out += mathToText(src.slice(i + 1, close));
      i = close + 1;
      continue;
    }

    // A newline in LaTeX source is a space, not a line break: the source wraps
    // where it is convenient, and only `\\` starts a new line. Honouring the
    // source wrapping would invent line breaks the PDF does not print.
    if (ch === "\n" || ch === "\r") {
      out += " ";
      i += 1;
      continue;
    }

    // `%` opens a comment that runs to the end of the line. A printed percent
    // sign is written `\%` and never reaches here.
    if (ch === "%") {
      const newline = src.indexOf("\n", i);
      i = newline === -1 ? src.length : newline + 1;
      continue;
    }

    // Bare braces only group text; the text itself stays.
    if (ch === "{" || ch === "}") {
      i += 1;
      continue;
    }

    if (ch === "~") {
      out += " ";
      i += 1;
      continue;
    }

    if (src.startsWith("---", i)) {
      out += "—";
      i += 3;
      continue;
    }

    if (src.startsWith("--", i)) {
      out += "–";
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

function parse(body: string): Resume {
  const sections: ResumeSection[] = [];
  let section: ResumeSection | null = null;
  let entry: ResumeEntry | null = null;
  let header = "";
  /** Text outside any structural command: the skills rows, the recognition line. */
  let pending = "";

  const flush = () => {
    const text = convert(pending);
    pending = "";
    if (!section) return;
    for (const raw of text.split("\n")) {
      const line = collapse(raw);
      if (line) section.lines.push(line);
    }
  };

  let i = 0;
  while (i < body.length) {
    const rest = body.slice(i);

    if (rest.startsWith("\\begin{center}")) {
      const open = "\\begin{center}".length;
      const close = body.indexOf("\\end{center}", i);
      header = body.slice(i + open, close === -1 ? body.length : close);
      i = close === -1 ? body.length : close + "\\end{center}".length;
      continue;
    }

    const word = /^\\([a-zA-Z]+)/.exec(rest);
    if (word) {
      const name = word[1] ?? "";
      const after = i + word[0].length;

      if (name === "section") {
        flush();
        const groups = readGroups(body, after, 1);
        section = {
          title: collapse(convert(groups.bodies[0] ?? "")),
          entries: [],
          lines: [],
        };
        sections.push(section);
        entry = null;
        i = groups.end;
        continue;
      }

      if (name === "resumeSubheading") {
        flush();
        const groups = readGroups(body, after, 4);
        const [title = "", dates = "", organization = "", location = ""] =
          groups.bodies;
        entry = {
          kind: "role",
          title: collapse(convert(title)),
          dates: collapse(convert(dates)),
          organization: collapse(convert(organization)),
          location: collapse(convert(location)),
          bullets: [],
        };
        section?.entries.push(entry);
        i = groups.end;
        continue;
      }

      if (name === "resumeProjectHeading") {
        flush();
        const groups = readGroups(body, after, 2);
        const [title = "", dates = ""] = groups.bodies;
        entry = {
          kind: "heading",
          title: collapse(convert(title)),
          dates: collapse(convert(dates)),
          organization: "",
          location: "",
          bullets: [],
        };
        section?.entries.push(entry);
        i = groups.end;
        continue;
      }

      if (name === "resumeItem") {
        const groups = readGroups(body, after, 1);
        const bullet = collapse(convert(groups.bodies[0] ?? ""));
        if (bullet) {
          if (entry) entry.bullets.push(bullet);
          else section?.lines.push(bullet);
        }
        i = groups.end;
        continue;
      }

      // List markers and page geometry: the command carries no text, and its
      // arguments are formatting rather than content.
      i = DROP_ARGUMENT.has(name) ? skipArguments(body, after) : after;
      continue;
    }

    pending += body[i];
    i += 1;
  }

  flush();

  const headerText = convert(header);
  const headerLines = headerText
    .split("\n")
    .map(collapse)
    .filter(Boolean);
  const name = (headerLines[0] ?? "").replace(/\*+/g, "").trim();
  const contact = headerLines
    .slice(1)
    .flatMap((line) => line.split("|"))
    .map(collapse)
    .filter(Boolean);

  return { name, contact, sections };
}

/** Reads and parses the one resume source. */
export async function loadResume(): Promise<Resume> {
  const source = await readFile(path.join(process.cwd(), RESUME_TEX), "utf8");
  const open = "\\begin{document}";
  const start = source.indexOf(open);
  const end = source.indexOf("\\end{document}");
  const body = source.slice(
    start === -1 ? 0 : start + open.length,
    end === -1 ? source.length : end
  );
  return parse(body);
}

/**
 * The resume as markdown, without the name heading: contact details, then every
 * section. `/llms-full.txt` uses this, because that file already opens with the
 * name and would otherwise print it twice.
 */
export function resumeBody(resume: Resume): string {
  const out: string[] = [];

  if (resume.contact.length > 0) out.push(resume.contact.join(" | "), "");

  for (const section of resume.sections) {
    out.push(`## ${section.title}`, "");

    for (const item of section.entries) {
      const heading = item.organization
        ? `${item.title} — ${item.organization}`
        : item.title;
      out.push(`### ${heading}`, "");

      const meta = [item.location, item.dates].filter(Boolean).join(" | ");
      if (meta) out.push(meta, "");

      for (const bullet of item.bullets) out.push(`- ${bullet}`);
      if (item.bullets.length > 0) out.push("");
    }

    if (section.lines.length > 0) out.push(...section.lines, "");
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** The complete resume as markdown: the name, then the body. */
export function resumeMarkdown(resume: Resume): string {
  return `# ${resume.name}\n\n${resumeBody(resume)}\n`;
}

/**
 * The resume as it is published at `/resume.txt` — the document with one line
 * naming the artifact it is identical to, so a reader can tell at a glance that
 * this is the resume and not a summary of it.
 */
export function resumeDocument(resume: Resume): string {
  return `${resumeMarkdown(resume).trimEnd()}\n\n---\n\n${RESUME_SUBTITLE}. ${resumeProvenance()}\n`;
}

/**
 * The one-liner every agent surface uses to say what this document is.
 * Pass the origin when the text is read off-site, so the paths resolve.
 */
export function resumeProvenance(site = ""): string {
  return `Same document as ${site}${RESUME_PAGE} (PDF: ${site}${RESUME_PDF}), extracted from ${RESUME_TEX} — the single source both are built from.`;
}
