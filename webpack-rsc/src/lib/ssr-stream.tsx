const INIT_SCRIPT = `
self.__flightStream = new ReadableStream({
	start(controller) {
		self.__f_push = (c) => controller.enqueue(c);
		self.__f_close = () => controller.close();
	}
}).pipeThrough(new TextEncoderStream());
`;

export function injectFlightStream(stream: ReadableStream<Uint8Array>) {
	return new TransformStream<string, string>({
		async transform(chunk, controller) {
			if (chunk.includes("</head>")) {
				controller.enqueue(
					chunk.replace(
						"</head>",
						() => `<script>${INIT_SCRIPT}</script></head>`,
					),
				);
			} else if (chunk.includes("</body>")) {
				const i = chunk.indexOf("</body>");
				controller.enqueue(chunk.slice(0, i));
				await stream.pipeThrough(new TextDecoderStream()).pipeTo(
					new WritableStream({
						write(chunk) {
							controller.enqueue(
								`<script>__f_push(${JSON.stringify(chunk)})</script>`,
							);
						},
						close() {
							controller.enqueue(`<script>__f_close()</script>`);
						},
					}),
				);
				controller.enqueue(chunk.slice(i));
			} else {
				controller.enqueue(chunk);
			}
		},
	});
}
