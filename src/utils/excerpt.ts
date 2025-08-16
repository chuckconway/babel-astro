import remarkParse from "remark-parse";
import { unified } from "unified";

import { EXCERPT_LENGTH } from "../config";

/**
 * Generate a robust plain-text excerpt from Markdown or plain text.
 * Uses a Markdown parser to extract readable text while skipping code, tables, and footnotes.
 */
export function excerpt(content: string, length: number = EXCERPT_LENGTH): string {
  try {
    const tree = unified().use(remarkParse).parse(content) as {
      type: string;
      children?: Array<{
        type: string;
        value?: string;
        alt?: string;
        children?: unknown[];
      }>;
    };

    const parts: string[] = [];

    const EXCLUDED_TYPES = new Set([
      "code",
      "inlineCode",
      "table",
      "tableRow",
      "tableCell",
      "footnote",
      "footnoteDefinition",
      "definition",
    ]);

    function walk(
      node: { type: string; value?: string; alt?: string; children?: unknown[] },
      skip: boolean,
    ): void {
      const nodeType: string = node?.type || "";
      const shouldSkip = skip || EXCLUDED_TYPES.has(nodeType);

      switch (nodeType) {
        case "text":
          if (!shouldSkip && typeof node.value === "string" && node.value.trim().length > 0) {
            parts.push(node.value);
          }
          break;
        case "image":
          if (!shouldSkip && typeof node.alt === "string" && node.alt.trim().length > 0) {
            parts.push(node.alt);
          }
          break;
        default:
          if (Array.isArray(node.children)) {
            for (const child of node.children as Array<{
              type: string;
              value?: string;
              alt?: string;
              children?: unknown[];
            }>) {
              walk(child, shouldSkip);
            }
          }
          break;
      }
    }

    walk(tree, false);

    const stripped = parts.join(" ").replace(/\s+/g, " ").trim();

    if (stripped.length <= length) return stripped;
    return stripped.slice(0, length).trimEnd() + "…";
  } catch {
    // Fallback to previous simple stripper on parse failure
    const fallback = content
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*#>_]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    if (fallback.length <= length) return fallback;
    return fallback.slice(0, length).trimEnd() + "…";
  }
}
