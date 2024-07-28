import { getCount } from "./_action";
import { ServerCounter } from "./_client";

export default function Page() {
	return (
		<div>
			<h3>Server Action</h3>
			<ServerCounter value={getCount()} />
		</div>
	);
}
