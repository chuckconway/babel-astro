import express, { NextFunction, Request, Response } from "express";
import fs from "fs/promises";
import matter from "gray-matter";
import yaml from "js-yaml";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname when using ES modules + TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PostData {
  frontMatter: string;
  content: string;
}

class PostService {
  private postsDir: string;

  constructor() {
    // Posts live in src/content/posts relative to project root
    this.postsDir = path.resolve(__dirname, "../src/content/posts");
  }

  /** Returns all markdown filenames (descending by name) */
  async listPosts(): Promise<string[]> {
    const entries = await fs.readdir(this.postsDir);
    return entries
      .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
      .sort()
      .reverse();
  }

  /** Load a post and return its front-matter YAML and body */
  async loadPost(filename: string): Promise<PostData> {
    const safeName = path.basename(filename);
    const fullPath = path.join(this.postsDir, safeName);
    const raw = await fs.readFile(fullPath, "utf-8");

    const parsed = matter(raw);
    // Serialize front-matter object back to YAML (clean, without delimiters)
    const frontMatterYaml = yaml.dump(parsed.data, { lineWidth: -1 });

    return { frontMatter: frontMatterYaml.trimEnd(), content: parsed.content.trimStart() };
  }

  /** Overwrite an existing post on disk */
  async savePost(filename: string, frontMatterYaml: string, content: string): Promise<void> {
    const safeName = path.basename(filename);
    const fullPath = path.join(this.postsDir, safeName);
    const fileData = `---\n${frontMatterYaml.trim()}\n---\n\n${content}`;
    await fs.writeFile(fullPath, fileData, "utf-8");
  }

  /** Create a new post file following YYYY-MM-DD-title.md naming */
  async createPost(frontMatterYaml: string, content: string): Promise<string> {
    const parsed = matter(`---\n${frontMatterYaml}\n---`);
    const { title = "untitled", date: rawDate } = parsed.data as {
      title?: string;
      date?: string;
    };

    // Use only the YYYY-MM-DD portion regardless of any time component provided
    const date = (rawDate || new Date().toISOString()).split("T")[0];

    const slug = String(title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const looksLikeMdx = /\bimport\s+|\bexport\s+/.test(content) || /<\w[\w-]*[\s>/]/.test(content);
    const ext = looksLikeMdx ? "mdx" : "md";
    const filename = `${date}-${slug}.${ext}`;
    await this.savePost(filename, frontMatterYaml, content);
    return filename;
  }
}

// ---------- Express setup ----------
const app = express();
const service = new PostService();
const PORT = Number(process.env.PORT) || 3001;

// HTTP request logging
app.use(morgan("dev"));

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/posts", async (_req: Request, res: Response) => {
  try {
    const list = await service.listPosts();
    res.json(list);
  } catch (err: unknown) {
    console.error("Error listing posts", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/posts/:filename", async (req: Request, res: Response) => {
  try {
    const data = await service.loadPost(req.params.filename);
    res.json(data);
  } catch (err: unknown) {
    console.error(`Error loading post ${req.params.filename}`, err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/posts/:filename", async (req: Request, res: Response) => {
  try {
    const { frontMatter, content } = req.body as Partial<PostData>;
    if (!frontMatter || typeof content !== "string") throw new Error("Invalid payload");

    await service.savePost(req.params.filename, frontMatter, content);
    res.json({ success: true });
  } catch (err: unknown) {
    console.error(`Error saving post ${req.params.filename}`, err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/posts", async (req: Request, res: Response) => {
  try {
    const { frontMatter, content } = req.body as Partial<PostData>;
    if (!frontMatter || typeof content !== "string") throw new Error("Invalid payload");

    const filename = await service.createPost(frontMatter, content);
    res.json({ success: true, filename });
  } catch (err: unknown) {
    console.error("Error creating post", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Catch-all error handler (shouldn't normally run)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`📝 Post editor running at http://localhost:${PORT}`);
});
