import { proxyToBackend } from "@/app/api/omniclaw/_proxy"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return proxyToBackend("/withdraw", "POST", body)
}