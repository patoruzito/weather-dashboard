export type OkPayload = Record<string, unknown>;

export type OkResponse<T extends OkPayload> = T & {
  ok: true;
  requestId: string;
};

export type ErrorInfo = {
  message: string;
  code?: string;
};

export type FailResponse = {
  ok: false;
  requestId: string;
  error: ErrorInfo;
};

export type ApiResponse<T extends OkPayload> = OkResponse<T> | FailResponse;

const CONTENT_TYPE = "application/json; charset=utf-8";

const makeRequestId = (): string => {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand}`;
};

const jsonResponse = (
  body: unknown,
  init: ResponseInit,
  defaultStatus: number
): Response => {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", CONTENT_TYPE);
  }
  const status = init.status ?? defaultStatus;
  return new Response(JSON.stringify(body), { ...init, status, headers });
};

export const ok = <T extends OkPayload>(
  payload: T,
  init: ResponseInit = {}
): Response => {
  const body: OkResponse<T> = {
    ...payload,
    ok: true,
    requestId: makeRequestId(),
  };
  return jsonResponse(body, init, 200);
};

export const fail = (error: ErrorInfo, init: ResponseInit = {}): Response => {
  const body: FailResponse = {
    ok: false,
    requestId: makeRequestId(),
    error,
  };
  return jsonResponse(body, init, 400);
};
