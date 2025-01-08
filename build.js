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
    // Create css directory
    await fs.ensureDir("public/css");

    // Copy CSS files
    await fs.copy("src/css/style.css", "public/css/style.css");
    await fs.copy("src/css/blog.css", "public/css/blog.css");
    await fs.copy("src/css/about.css", "public/css/about.css");

    // Copy JavaScript files
    await fs.copy("src/js", "public/js");

    // Copy index.html
    await fs.copy("src/index.html", "public/index.html");
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

async function buildPages() {
  const pagesDir = "src/content/pages";
  const files = await fs.readdir(pagesDir);

  for (const file of files) {
    if (path.extname(file) === ".md") {
      const content = await fs.readFile(path.join(pagesDir, file), "utf8");
      const { data, content: markdown } = matter(content);

      // Choose template based on frontmatter or default to page template
      const templateName = data.template || "page";
      const templatePath = `src/templates/${templateName}.html`;

      try {
        const templateContent = await fs.readFile(templatePath, "utf8");
        const template = Handlebars.compile(templateContent);

        const html = template({
          ...data,
          content: marked(markdown),
        });

        const outputPath = `public/${path.basename(file, ".md")}.html`;
        await fs.outputFile(outputPath, html);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }
}

async function build() {
  try {
    await fs.ensureDir("public");
    await copyStaticAssets();
    await buildBlog();
    await buildPages();
    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    throw error;
  }
}

build();
