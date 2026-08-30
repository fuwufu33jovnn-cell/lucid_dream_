import { createAiHandler } from "../../lib/server/ai-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handleAiRequest = createAiHandler({ env: process.env, fetch: globalThis.fetch });

export async function POST(request: Request): Promise<Response> {
  return handleAiRequest(request);
}
