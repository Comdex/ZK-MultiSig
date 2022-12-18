// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

export default defineNuxtConfig({
  typescript: {
    shim: false,
    strict: true,
  },

  runtimeConfig: {
    dbPath: "./db.sqlite",
  },

  vite: {
    build: { target: "esnext" },
    optimizeDeps: {
      esbuildOptions: { target: "esnext" },

      include:
        process.env.NODE_ENV === "development"
          ? ["naive-ui", "vueuc", "date-fns-tz/esm/formatInTimeZone"]
          : [],
    },

    plugins: [
      Components({
        resolvers: [NaiveUiResolver()],
      }),
    ],

    server: {
      headers: {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
    },
  },

  build: {
    transpile:
      process.env.NODE_ENV === "production"
        ? [
            "naive-ui",
            "vueuc",
            "@css-render/vue3-ssr",
            "@juggle/resize-observer",
          ]
        : ["@juggle/resize-observer"],
  },

  ssr: false,
});
