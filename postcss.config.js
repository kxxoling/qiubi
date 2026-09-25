/**
 * PostCSS pipeline — Tailwind v4 for the Vite web build.
 *
 * The Plasmo extension build never processes CSS through Parcel (the app is
 * bundled by Vite into public/app and packaged as static files; see
 * scripts/ext-post.mjs), so this config does not affect it.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};

export default config;
