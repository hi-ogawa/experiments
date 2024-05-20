export async function streamToString(stream: ReadableStream<Uint8Array>) {
	let s = "";
	await stream.pipeThrough(new TextDecoderStream()).pipeTo(
		new WritableStream({
			write(c) {
				s += c;
			},
		}),
	);
	return s;
}

export function stringToStream(s: string) {
	return new ReadableStream<string>({
		start(controller) {
			controller.enqueue(s);
			controller.close();
		},
	}).pipeThrough(new TextEncoderStream());
}
