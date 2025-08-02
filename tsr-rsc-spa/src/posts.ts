import { createError } from "./framework/error/server";

type PostType = {
  id: string;
  title: string;
  body: string;
};

export const fetchPosts = async () => {
  console.info("Fetching posts...");
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  const data: PostType[] = await res.json();
  return data.slice(0, 10);
};

export const fetchPost = async (postId: string) => {
  console.info(`Fetching post with id ${postId}...`);
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${postId}`,
  );
  if (res.status === 404) {
    throw createError({ type: "not-found" });
  }
  const post: PostType = await res.json();
  return post;
};
