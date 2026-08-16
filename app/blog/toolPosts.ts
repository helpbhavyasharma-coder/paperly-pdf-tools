import toolPostData from "./tool-posts.generated.json";
import ecosystemPostData from "./ecosystem-posts.generated.json";

export type ToolPost = (typeof toolPostData)[number] | (typeof ecosystemPostData)[number];
export const toolPosts = [...toolPostData, ...ecosystemPostData] as ToolPost[];
export function getToolPost(slug: string) { return toolPosts.find((post) => post.slug === slug); }
