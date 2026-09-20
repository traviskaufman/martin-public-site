export const onRequestGet: PagesFunction = async ({ request, env, next }) => {
  const prefersMarkdown = request.headers
    .get("Accept")
    ?.includes("text/markdown");
  if (!prefersMarkdown) return next();

  const instructionsForAgents = await env.ASSETS.fetch(
    new URL("/llms.txt", request.url),
  );
  return new Response(instructionsForAgents.body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
};
