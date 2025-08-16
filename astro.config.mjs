import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import fs from 'node:fs';
import path from 'node:path';
import rehypeImgSize from 'rehype-img-size';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mdx from '@astrojs/mdx';
import remarkMermaid from 'remark-mermaidjs';
import remarkVegaToComponent from './src/remark/remarkVegaToComponent.mjs';

// Custom Vite plugin – make /images/posts/* work in dev & prod
function ogImageStaticPlugin() {
  const srcDir = path.resolve('src/images/posts');
  return {
    name: 'og-image-static',
    // During dev, alias the directory so Vite serves files directly
    config() {
      return {
        resolve: {
          alias: {
            '/images/posts': srcDir,
          },
        },
      };
    },
    // During build, copy images into the final dist/images/posts folder
    generateBundle(_, bundle) {
      if (!fs.existsSync(srcDir)) return;
      const copyRecursive = (src, dest) => {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const s = path.join(src, entry.name);
          const d = path.join(dest, entry.name);
          if (entry.isDirectory()) copyRecursive(s, d);
          else {
            const relativePath = path.relative(process.cwd(), d);
            bundle[relativePath] = {
              type: 'asset',
              fileName: relativePath, // Rollup expects a fileName property
              source: fs.readFileSync(s),
            };
          }
        }
      };
      const outDir = path.resolve('dist/images/posts');
      copyRecursive(srcDir, outDir);
    },
  };
}

if (!process.env.PUBLIC_SITE_URL) {
  throw new Error(
    'Missing PUBLIC_SITE_URL. Define it in your environment (.env) to configure Astro\'s canonical site URL.'
  );
}

export default defineConfig({
  // Require PUBLIC_SITE_URL with no fallback
  site: process.env.PUBLIC_SITE_URL,
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
          de: 'de',
          fr: 'fr',
        },
      },
    }),
    react(),
    mdx(),
  ],
  markdown: {
    // Enable math (KaTeX) and Mermaid diagrams in Markdown, and MDX vega blocks
    remarkPlugins: [[remarkMath, { singleDollar: false }], remarkMermaid, remarkVegaToComponent],
    // Temporarily disable rehype-img-size until path issues are resolved
    // rehypePlugins: [[rehypeImgSize, { dir: path.resolve('.') }]],
    rehypePlugins: [[rehypeKatex, { strict: "ignore" }]],
  },
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    plugins: [tailwindcss(), ogImageStaticPlugin()],
    resolve: {
      // Ensure a single React instance to avoid "Invalid hook call" in dev
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      // Proactively pre-bundle to stabilize dev
      include: ['fuse.js', 'react', 'react-dom', 'react-vega'],
      force: true,
    },
  },
}); 