import { sleep } from "@hiogawa/utils";
import { defineComponent } from "vue";

export default defineComponent(async () => {
	await sleep(1000);
	return () => <div>Slow Page</div>;
});
