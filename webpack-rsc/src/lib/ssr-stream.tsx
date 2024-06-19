import React from "react";

// based on https://github.com/remix-run/react-router/blob/09b52e491e3927e30e707abe67abdd8e9b9de946/packages/react-router/lib/dom/ssr/single-fetch.tsx#L49
export function StreamTransfer(props: { stream: ReadableStream<Uint8Array> }) {
	const textStream = props.stream.pipeThrough(new TextDecoderStream());
	const reader = textStream.getReader();

	const results = new Array<Promise<ReadableStreamReadResult<string>>>();

	function toScript(code: string) {
		return <script dangerouslySetInnerHTML={{ __html: code }} />;
	}

	function Recurse(props: { depth: number }) {
		const result = React.use((results[props.depth] ??= reader.read()));
		if (result.done) {
			return toScript(`self.__flightStreamController.close()`);
		}
		// TODO: escape
		const data = JSON.stringify(result.value);
		return (
			<>
				{toScript(`self.__flightStreamController.enqueue(${data})`)}
				<React.Suspense>
					<Recurse depth={props.depth + 1} />
				</React.Suspense>
			</>
		);
	}

	return (
		<>
			{toScript(`
self.__flightStream = new ReadableStream({
	start(c) {
		self.__flightStreamController = c;
	}
}).pipeThrough(new TextEncoderStream())
`)}
			<React.Suspense>
				<Recurse depth={0} />
			</React.Suspense>
		</>
	);
}
