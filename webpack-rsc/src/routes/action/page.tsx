import { count } from "./_action";
import { ServerCounter } from "./_client";
import { Menu } from "./_menu";

export default function Page() {
	return (
		<div>
			<Menu />
			<h3>Server Action</h3>
			<ServerCounter value={count} />
		</div>
	);
}
