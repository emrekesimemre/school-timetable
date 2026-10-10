import { Request } from 'express';

/**
 * Express v5 types `req.params[key]` as `string | string[]`.
 * Prisma's where.id only accepts `string`.
 * This helper safely extracts a guaranteed string from params.
 */
export function param(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}
