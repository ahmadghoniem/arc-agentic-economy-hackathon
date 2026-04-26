import { proxyToBackend } from "@/app/api/omniclaw/_proxy"

export async function GET() {
  return proxyToBackend("/balance", "GET")
}