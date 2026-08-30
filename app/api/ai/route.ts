import { createAiHandler, getConfiguredProviders } from "../../lib/server/ai-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handleAiRequest = createAiHandler({ env: process.env, fetch: globalThis.fetch });

export async function GET(): Promise<Response> {
  const providers = getConfiguredProviders(process.env);
  return Response.json(
    { configured: providers.length > 0, providers },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request): Promise<Response> {
  return handleAiRequest(request);
}
