import { proxyToBackend } from "@/app/api/omniclaw/_proxy"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get("transaction_id") || ""
  return proxyToBackend(`/resolve-tx?transaction_id=${encodeURIComponent(transactionId)}`, "GET")
}
