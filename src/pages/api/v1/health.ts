import type { APIRoute } from "astro";

import { ok } from "../../../lib/http/response";

export const GET: APIRoute = () => {
  return ok({ ok: true, ts: new Date().toISOString() });
};
