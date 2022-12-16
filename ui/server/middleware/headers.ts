export default defineEventHandler((event) => {
  console.log("New request: " + event.node.req.url);
  event.node.res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  event.node.res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  if (process.env.NODE_ENV === "development") {
    event.node.res.setHeader("Access-Control-Allow-Origin", "*");
  }
});
