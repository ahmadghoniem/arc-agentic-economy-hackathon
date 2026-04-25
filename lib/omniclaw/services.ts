import type { ApiTemplate } from "@/lib/omniclaw/client"

export const API_TEMPLATES: ApiTemplate[] = [
  {
    id: "twitter-user-info",
    name: "Twitter User Info",
    method: "GET",
    url: "https://api.aisa.one/apis/v2/twitter/user/info?userName=jack",
  },
  {
    id: "multi-search",
    name: "Multi Search",
    method: "POST",
    url: "https://api.aisa.one/apis/v2/scholar/search/web?query=ai+agents&max_num_results=5",
  },
  {
    id: "youtube-search",
    name: "YouTube Search",
    method: "GET",
    url: "https://api.aisa.one/apis/v2/youtube/search?engine=youtube&q=ai+agents&gl=us&hl=en",
  },
]

export function getApiTemplate(apiId: string) {
  return API_TEMPLATES.find((template) => template.id === apiId) ?? null
}
