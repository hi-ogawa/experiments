import { renderToReadableStream } from "react-dom/server.edge";

export async function renderHtml() {
  const bootstrapScriptContent =
    await import.meta.viteRsc.loadBootstrapScriptContent("index");
  const htmlStream = renderToReadableStream(<Root />, {
    bootstrapScriptContent,
  });
  return htmlStream;
}

function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite App</title>
      </head>
      <body>
        <div id="app"></div>
      </body>
    </html>
  );
}
