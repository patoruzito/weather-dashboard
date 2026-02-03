import type { APIRoute } from "astro";

import { cities } from "../../../lib/data/cities";
import { ok } from "../../../lib/http/response";

export const GET: APIRoute = () => {
  return ok({ cities });
};
