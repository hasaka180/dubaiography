/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  // The project ships its own global reset + editorial CSS, so Tailwind's
  // preflight stays off to avoid fighting the design system.
  corePlugins: { preflight: false },
  plugins: [],
}
