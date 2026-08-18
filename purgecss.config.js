module.exports = {
  content: ["_site/**/*.html", "_site/**/*.js"],
  css: ["_site/assets/css/*.css"],
  output: "_site/assets/css/",
  skippedContentGlobs: ["_site/assets/**/*.html"],
  // Nomad Mode changes attributes and component states at runtime. Keep the
  // corresponding selectors even when the production HTML initially says off.
  safelist: {
    standard: [
      "nomad-mode-entering",
      "active",
      "dark",
      "table-dark",
    ],
    deep: [
      /nomad/,
      /lab-/,
      /route-/,
      /research-/,
      /project-/,
      /person-/,
      /home-/,
      /site-/,
      /status-/,
      /tag-/,
      /publication-/,
      /opportunity-/,
      /application-/,
      /contact-/,
      /principle-/,
      /page-intro/,
    ],
  },
};
