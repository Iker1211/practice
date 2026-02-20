const config = require("@repo/tailwind-config/native");

module.exports = {
  ...config,
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  theme: {
    ...config.theme,
    extend: {
      ...config.theme.extend,
    },
  },
};
