const fs = require("fs-extra");
const path = require("path");
const { marked } = require("marked");
const matter = require("gray-matter");

// Configure marked for security
marked.setOptions({
  headerIds: false,
  mangle: false,
});

async function copyStaticAssets() {
  // Copy CSS files
  await fs.copy("src/css", "public/css", { overwrite: true });

  // Copy JavaScript files
  await fs.copy("src/js", "public/js", { overwrite: true });
}

async function build() {
  // Create public directory
  await fs.ensureDir("public");

  // Copy static assets first
  await copyStaticAssets();

  // Build pages
  const pagesDir = path.join(__dirname, "src/content/pages");
  const pages = await fs.readdir(pagesDir);

  for (const page of pages) {
    const content = await fs.readFile(path.join(pagesDir, page), "utf-8");
    const { data, content: markdown } = matter(content);
    const html = marked(markdown);

    // Read template
    const template = await fs.readFile("templates/page.html", "utf-8");

    // Replace placeholders
    const final = template
      .replace("{{title}}", data.title || "")
      .replace("{{content}}", html);

    // Write file
    const outPath = path.join("public", page.replace(".md", ".html"));
    await fs.writeFile(outPath, final);
  }

  // Build blog posts (similar process)
  // ...
}

build().catch(console.error);
