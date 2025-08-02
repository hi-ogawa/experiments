import axios from "redaxios";
import { createError } from "./framework/error/server";

type PostType = {
  id: string;
  title: string;
  body: string;
};

export const fetchPosts = async () => {
  console.info("Fetching posts...");
  return axios
    .get<Array<PostType>>("https://jsonplaceholder.typicode.com/posts")
    .then((r) => r.data.slice(0, 10));
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
