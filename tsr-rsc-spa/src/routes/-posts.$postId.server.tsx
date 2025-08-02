import { fetchPost } from "../posts";

// TODO: loader type?
export default async function PostComponent({ params: { postId } }: any) {
  const post = await fetchPost(postId);

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{post.title}</h4>
      <div className="text-sm">{post.body}</div>
    </div>
  );
}
