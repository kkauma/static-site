const fs = require("fs-extra");
const path = require("path");
const { marked } = require("marked");
const matter = require("gray-matter");
const Handlebars = require("handlebars");

// Configure marked for security
marked.setOptions({
  headerIds: false,
  mangle: false,
});

async function copyStaticAssets() {
  try {
    // Copy CSS files
    await fs.copy("src/css/style.css", "public/css/style.css", {
      overwrite: true,
    });

    // Copy JavaScript files
    await fs.copy("src/js", "public/js", { overwrite: true });

    // Copy index.html directly
    await fs.copy("src/index.html", "public/index.html", { overwrite: true });
  } catch (error) {
    console.error("Error copying static assets:", error);
    throw error;
  }
}

async function buildBlog() {
  // Read blog post template
  const postTemplate = Handlebars.compile(
    await fs.readFile("src/templates/blog-post.html", "utf8")
  );

  // Read blog list template
  const listTemplate = Handlebars.compile(
    await fs.readFile("src/templates/blog-list.html", "utf8")
  );

  // Get all markdown files
  const blogDir = "src/content/blog";
  const posts = [];

  const files = await fs.readdir(blogDir);

  for (const file of files) {
    if (path.extname(file) === ".md") {
      const content = await fs.readFile(path.join(blogDir, file), "utf8");
      const { data, content: markdown } = matter(content);

      const post = {
        ...data,
        content: marked(markdown),
        slug: path.basename(file, ".md"),
      };

      posts.push(post);

      // Create individual blog post page
      const html = postTemplate(post);
      await fs.outputFile(`public/blog/${post.slug}/index.html`, html);
    }
  }

  // Sort posts by date
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Create blog listing page
  const listHtml = listTemplate({ posts });
  await fs.outputFile("public/blog/index.html", listHtml);
}

async function build() {
  try {
    await fs.ensureDir("public");
    await copyStaticAssets();

    // Build pages
    const pagesDir = path.join(__dirname, "src/content/pages");
    const pages = await fs.readdir(pagesDir);

    for (const page of pages) {
      const content = await fs.readFile(path.join(pagesDir, page), "utf-8");
      const { data, content: markdown } = matter(content);
      const html = marked(markdown);

      // Read template
      const template = await fs.readFile("src/templates/page.html", "utf-8");

      // Replace placeholders
      const final = template
        .replace("{{title}}", data.title || "")
        .replace("{{content}}", html);

      // Write file
      const outPath = path.join("public", page.replace(".md", ".html"));
      await fs.writeFile(outPath, final);
    }

    // Build blog posts
    const blogDir = path.join(__dirname, "src/content/blog");
    if (await fs.pathExists(blogDir)) {
      const posts = await fs.readdir(blogDir);
      await fs.ensureDir(path.join("public", "blog"));

      for (const post of posts) {
        const content = await fs.readFile(path.join(blogDir, post), "utf-8");
        const { data, content: markdown } = matter(content);
        const html = marked(markdown);

        // Read blog template (you might want to create a separate blog template)
        const template = await fs.readFile("src/templates/page.html", "utf-8");

        // Replace placeholders
        const final = template
          .replace("{{title}}", data.title || "")
          .replace("{{content}}", html);

        // Write file
        const outPath = path.join(
          "public",
          "blog",
          post.replace(".md", ".html")
        );
        await fs.writeFile(outPath, final);
      }
    }

    await buildBlog();
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build().catch(console.error);
