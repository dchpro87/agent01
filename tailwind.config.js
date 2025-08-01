import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "inherit",
            p: {
              marginTop: "1.25em",
              marginBottom: "1.25em",
            },
            h1: {
              marginTop: "0",
              marginBottom: "0.8888889em",
              fontWeight: "800",
            },
            h2: {
              marginTop: "2em",
              marginBottom: "1em",
              fontWeight: "700",
            },
            h3: {
              marginTop: "1.6em",
              marginBottom: "0.6em",
              fontWeight: "600",
            },
            h4: {
              marginTop: "1.5em",
              marginBottom: "0.5em",
              fontWeight: "600",
            },
            "ul, ol": {
              marginTop: "1.25em",
              marginBottom: "1.25em",
            },
            li: {
              marginTop: "0.5em",
              marginBottom: "0.5em",
            },
            blockquote: {
              marginTop: "1.6em",
              marginBottom: "1.6em",
            },
            strong: {
              fontWeight: "600",
            },
            code: {
              fontSize: "0.875em",
              fontWeight: "600",
              backgroundColor: "#f3f4f6",
              padding: "0.125rem 0.25rem",
              borderRadius: "0.25rem",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              backgroundColor: "#374151",
              color: "#e5e7eb",
              fontSize: "0.875em",
              marginTop: "1.7142857em",
              marginBottom: "1.7142857em",
              borderRadius: "0.375rem",
              padding: "0.8571429em 1.1428571em",
            },
          },
        },
        sm: {
          css: {
            fontSize: "0.875rem",
            lineHeight: "1.7142857",
            p: {
              marginTop: "1.1428571em",
              marginBottom: "1.1428571em",
            },
            h1: {
              fontSize: "2.1428571em",
              marginTop: "0",
              marginBottom: "0.8em",
              lineHeight: "1.2",
            },
            h2: {
              fontSize: "1.4285714em",
              marginTop: "1.6em",
              marginBottom: "0.8em",
              lineHeight: "1.4",
            },
            h3: {
              fontSize: "1.2857143em",
              marginTop: "1.5555556em",
              marginBottom: "0.4444444em",
              lineHeight: "1.5555556",
            },
            "ul, ol": {
              marginTop: "1.1428571em",
              marginBottom: "1.1428571em",
            },
            li: {
              marginTop: "0.2857143em",
              marginBottom: "0.2857143em",
            },
            blockquote: {
              marginTop: "1.3333333em",
              marginBottom: "1.3333333em",
            },
          },
        },
        invert: {
          css: {
            "--tw-prose-body": "#e5e7eb",
            "--tw-prose-headings": "#f9fafb",
            "--tw-prose-bold": "#f9fafb",
            "--tw-prose-code": "#f9fafb",
            "--tw-prose-pre-code": "#e5e7eb",
            "--tw-prose-pre-bg": "#374151",
            "--tw-prose-quotes": "#f3f4f6",
            color: "#e5e7eb",
            h1: { color: "#f9fafb" },
            h2: { color: "#f9fafb" },
            h3: { color: "#f9fafb" },
            h4: { color: "#f9fafb" },
            strong: { color: "#f9fafb" },
            code: {
              color: "#f9fafb",
              backgroundColor: "#374151",
            },
            blockquote: {
              color: "#f9fafb",
            },
          },
        },
      },
    },
  },
  plugins: [typography],
  darkMode: "class",
};

export default config;
