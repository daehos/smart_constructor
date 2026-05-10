// Root ESLint flat config.
// Enforces that api/ and whatsapp/ cannot import from each other's source trees.
// Shared code must live in packages/contracts.

export default [
  {
    files: ["api/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../whatsapp/*", "../../whatsapp/*"],
              message: "Import shared code from @smart-constructor/contracts instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["whatsapp/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../api/*", "../../api/*"],
              message: "Import shared code from @smart-constructor/contracts instead.",
            },
          ],
        },
      ],
    },
  },
];
