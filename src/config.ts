// Site-wide configuration
// Require PUBLIC_SITE_URL so it is safely available in both server and client code
const PUBLIC_SITE_URL = import.meta.env.PUBLIC_SITE_URL as string | undefined;
if (!PUBLIC_SITE_URL) {
  throw new Error(
    "Missing PUBLIC_SITE_URL. Define it in your environment (.env) so canonical and absolute URLs can be generated.",
  );
}

export const SITE = {
  site: PUBLIC_SITE_URL,
  // Path under /public to your favicon file (e.g. svg, png, or ico)
  // Example: "/logo/site-logo.svg" or "/images/favicon.png"
  favicon: "/logo/site-logo.svg",
};

// Default excerpt length (in characters) used when posts lack a description.
export const EXCERPT_LENGTH = 200;

// Number of posts per page for pagination.
export const PAGE_SIZE = 10;

export const DEFAULT_THEME = "default";
