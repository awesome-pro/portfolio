import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The interview prep checklist, parsed from markdown into tickable sections.
 *
 * The markdown is the source of truth: items are added by editing
 * data/inference-interview-prep.md, not by writing to a database. That keeps
 * "add an item" as cheap as it is in Notion, with no schema and no migration,
 * and it means the checklist is versioned alongside everything else.
 *
 * Which leaves one hard problem — what a tick is attached to. Ticks live in the
 * browser (see lib/prep-progress-store.ts) and are keyed by a hash of the item's
 * text within its module, deliberately *not* by its position. Insert a topic at
 * the top of a section and every tick below it stays where it belongs; only
 * editing an item's own words loses its tick, which is the safe direction to
 * fail.
 */

const SOURCE = "data/inference-interview-prep.md";

export interface PrepItem {
  key: string;
  text: string;
}

export interface PrepSection {
  id: string;
  title: string;
  /** True for a module with no `###` headings: its items have no subheading. */
  implicit: boolean;
  prose: string[];
  items: PrepItem[];
}

export interface PrepModule {
  id: string;
  title: string;
  prose: string[];
  sections: PrepSection[];
}

export interface PrepChecklist {
  title: string;
  /** Prose before the first `##`, i.e. how to use this page. */
  intro: string[];
  modules: PrepModule[];
  itemCount: number;
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "section"
  );
}

/**
 * Text-addressed, not position-addressed. The module title is part of the hash
 * so that the same sentence in two modules stays two independent ticks.
 */
function keyFor(moduleTitle: string, text: string): string {
  return createHash("sha1")
    .update(`${moduleTitle}\u0000${text}`)
    .digest("hex")
    .slice(0, 12);
}

export function parseChecklist(markdown: string): PrepChecklist {
  const modules: PrepModule[] = [];
  const intro: string[] = [];
  const usedKeys = new Set<string>();

  let title = "Checklist";
  let activeModule: PrepModule | null = null;
  let section: PrepSection | null = null;
  let paragraph: string[] = [];

  /** Consecutive non-blank lines stay one chunk so markdown lists survive. */
  function flushParagraph() {
    const chunk = paragraph.join("\n").trim();
    paragraph = [];
    if (!chunk) return;
    (section ?? activeModule)?.prose.push(chunk);
    if (!section && !activeModule) intro.push(chunk);
  }

  function addItem(text: string) {
    const owner = ensureModule();
    const target = ensureSection();
    let key = keyFor(owner.title, text);
    // Identical wording twice in one module still needs two independent ticks.
    let suffix = 2;
    while (usedKeys.has(key)) key = `${keyFor(owner.title, text)}-${suffix++}`;
    usedKeys.add(key);
    target.items.push({ key, text });
  }

  function ensureModule(): PrepModule {
    if (activeModule) return activeModule;
    activeModule = { id: "general", title: "General", prose: [], sections: [] };
    modules.push(activeModule);
    return activeModule;
  }

  function ensureSection(): PrepSection {
    const owner = ensureModule();
    if (section) return section;
    section = {
      id: `${owner.id}--body`,
      title: owner.title,
      implicit: true,
      prose: [],
      items: [],
    };
    owner.sections.push(section);
    return section;
  }

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line === "---") {
      flushParagraph();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      const [, hashes, text] = heading;
      const clean = text.trim();

      if (hashes === "#") {
        title = clean;
      } else if (hashes === "##") {
        activeModule = {
          id: slug(clean),
          title: clean,
          prose: [],
          sections: [],
        };
        modules.push(activeModule);
        section = null;
      } else {
        const owner = ensureModule();
        section = {
          id: `${owner.id}--${slug(clean)}`,
          title: clean,
          implicit: false,
          prose: [],
          items: [],
        };
        owner.sections.push(section);
      }
      continue;
    }

    const item = /^[-*]\s+\[[ xX]\]\s*(.*)$/.exec(line);
    if (item) {
      flushParagraph();
      addItem(item[1].trim());
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();

  const itemCount = modules.reduce(
    (total, m) =>
      total + m.sections.reduce((count, s) => count + s.items.length, 0),
    0
  );

  return { title, intro, modules, itemCount };
}

export async function loadChecklist(): Promise<PrepChecklist> {
  const file = path.join(process.cwd(), SOURCE);
  return parseChecklist(await readFile(file, "utf8"));
}

export const CHECKLIST_SOURCE = SOURCE;
