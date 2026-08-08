import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodSchema } from "zod";
import { apiError, apiValidationError, apiFromError } from "./api-response";
import { ApiError } from "./api-error";
import { handlePrismaError } from "./api-error";
import { auth } from "@/lib/auth/config";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { Session } from "next-auth";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface ApiHandlerOptions {
  method?: HttpMethod | HttpMethod[];
  requireAuth?: boolean;
  requiredRole?: string[];
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;
}

export interface HandlerContext {
  params?: Record<string, string>;
  searchParams?: URLSearchParams;
  session?: Session | null;
  body?: unknown;
  query?: Record<string, unknown>;
}

type HandlerFn = (
  request: NextRequest,
  context: HandlerContext
) => Promise<NextResponse>;

function parseSearchParams(
  searchParams: URLSearchParams,
  schema?: ZodSchema
): Record<string, unknown> {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  if (schema) {
    const result = schema.safeParse(raw);
    if (result.success) {
      return result.data as Record<string, unknown>;
    }
  }

  return raw;
}

export function createApiHandler(
  handlers: Partial<Record<HttpMethod, HandlerFn>>,
  options: ApiHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    routeContext?: { params?: Promise<Record<string, string>> }
  ) => {
    const method = request.method as HttpMethod;

    if (options.method) {
      const allowedMethods = Array.isArray(options.method)
        ? options.method
        : [options.method];
      if (!allowedMethods.includes(method)) {
        return apiError("Method not allowed", 405);
      }
    }

    const handler = handlers[method];
    if (!handler) {
      return apiError("Method not allowed", 405);
    }

    let session: Session | null = null;

    if (options.requireAuth) {
      // 1. Try NextAuth session (Google OAuth & NextAuth Credentials)
      session = (await auth()) as Session | null;

      // 2. Fallback: Try HttpOnly access_token cookie or Authorization header
      if (!session?.user) {
        const cookieStore = await cookies();
        const token =
          cookieStore.get("access_token")?.value ||
          request.headers.get("authorization")?.replace("Bearer ", "");

        if (token) {
          try {
            const payload = verifyAccessToken(token);
            session = {
              user: {
                id: String(payload.userId),
                email: payload.email,
                phone: payload.phone,
                role: "CUSTOMER",
                status: "active",
              },
              expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            } as unknown as Session;
          } catch {
            return apiError("Session expired. Please log in again.", 401);
          }
        }
      }

      if (!session?.user) {
        return apiError("You must be logged in", 401);
      }

      if (options.requiredRole && options.requiredRole.length > 0) {
        const userRole = (session.user as { role?: string }).role;
        if (!userRole || !options.requiredRole.includes(userRole)) {
          return apiError("You don't have permission", 403);
        }
      }
    }

    const resolvedParams = routeContext?.params
      ? await routeContext.params
      : undefined;
    const searchParams = new URL(request.url).searchParams;

    const context: HandlerContext = {
      params: resolvedParams,
      searchParams,
      session,
    };

    if (options.querySchema) {
      context.query = parseSearchParams(searchParams, options.querySchema);
    }

    if (
      options.bodySchema &&
      (method === "POST" || method === "PUT" || method === "PATCH")
    ) {
      try {
        const body = await request.json();
        const validation = options.bodySchema.safeParse(body);
        if (!validation.success) {
          const errors = validation.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          );
          return apiValidationError(errors);
        }
        context.body = validation.data;
      } catch {
        return apiError("Invalid request body", 400);
      }
    }

    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return apiFromError(error);
      }

      const prismaResult = handlePrismaError(error);
      if (prismaResult && prismaResult.message !== "A database error occurred") {
        return apiFromError(prismaResult);
      }

      console.error(`Unhandled API Error [${method}]:`, error);
      return apiError("Something went wrong", 500);
    }
  };
}
