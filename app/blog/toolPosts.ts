import posts from "./tool-posts.generated.json";

export type ToolPost = (typeof posts)[number];
export const toolPosts = posts as ToolPost[];
export function getToolPost(slug: string) { return toolPosts.find((post) => post.slug === slug); }
