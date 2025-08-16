import { visit } from 'unist-util-visit';

/**
 * Remark plugin: transform fenced vega/vega-lite code blocks into
 * <VegaChart spec={...} caption="..." /> MDX elements.
 *
 * Notes:
 * - Only applies to .mdx files to avoid injecting MDX JSX into .md.
 * - Automatically injects: import VegaChart from '/src/components/VegaChart';
 */
export default function remarkVegaToComponent() {
  return (tree, file) => {
    const filePath = (file && file.path) || '';
    if (!/\.mdx$/i.test(filePath)) return; // MDX only

    let transformed = false;
    let hasImport = false;

    // Detect existing import for VegaChart to avoid duplicates
    visit(tree, 'mdxjsEsm', (node) => {
      try {
        const val = String(node.value || '');
        if (/\bVegaChart\b\s+from\s+['\"]\/src\/components\/VegaChart['\"]/i.test(val)) {
          hasImport = true;
        }
      } catch {
        /* ignore */
      }
    });

    visit(tree, 'code', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      const lang = (node.lang || '').toLowerCase();
      if (lang !== 'vega' && lang !== 'vega-lite') return;

      const specJson = String(node.value || '').trim();
      if (!specJson) return;

      // Basic meta parsing: caption="..." aria="..."
      const meta = String(node.meta || '');
      const getMetaValue = (key) => {
        const re = new RegExp(`${key}="([\s\S]*?)"`);
        const m = meta.match(re);
        return m ? m[1] : '';
      };
      const caption = getMetaValue('caption');
      const aria = getMetaValue('aria');

      let valueString = specJson;
      try {
        const parsed = JSON.parse(specJson);
        valueString = JSON.stringify(parsed);
      } catch {
        // leave as-is if not valid JSON
      }

      /** @type {import('mdast').Nodes} */
      const mdxEl = {
        type: 'mdxJsxFlowElement',
        name: 'VegaChart',
        attributes: [
          // Hydrate on client so react-vega runs in browser
          { type: 'mdxJsxAttribute', name: 'client:load' },
          // Pass as a JSON string attribute; component will JSON.parse
          { type: 'mdxJsxAttribute', name: 'specJson', value: valueString },
          ...(caption
            ? [{ type: 'mdxJsxAttribute', name: 'caption', value: caption }]
            : []),
          ...(aria
            ? [{ type: 'mdxJsxAttribute', name: 'ariaLabel', value: aria }]
            : []),
        ],
        children: [],
      };

      parent.children.splice(index, 1, mdxEl);
      transformed = true;
    });

    // Auto-inject import if we transformed at least one block and import is missing
    if (transformed && !hasImport) {
      const importNode = {
        type: 'mdxjsEsm',
        value: "import VegaChart from '/src/components/VegaChart';",
      };
      tree.children.unshift(importNode);
    }
  };
}


