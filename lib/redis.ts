import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

type RedisClient = Redis | null;

declare global {
  var _travelsPortalRedis: RedisClient | undefined;
}

/**
 * Returns a serverless Redis client when Upstash credentials are configured.
 * The portal remains available when Redis is intentionally not configured or
 * temporarily unavailable.
 */
function redisClient(): RedisClient {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;

  if (global._travelsPortalRedis === undefined) {
    global._travelsPortalRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return global._travelsPortalRedis;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Create a short, tenant-scoped key without putting request input into Redis keys. */
export function storefrontCacheKey(businessSlug: string, operation: string, args: unknown[]) {
  const fingerprint = createHash("sha256").update(stableJson(args)).digest("hex");
  return `travel-portal:storefront:v1:${businessSlug}:${operation}:${fingerprint}`;
}

export function publicCacheTtlSeconds() {
  const configured = Number(process.env.REDIS_PUBLIC_CACHE_TTL_SECONDS);
  return Number.isFinite(configured) && configured > 0 ? Math.min(Math.floor(configured), 3600) : 120;
}

export async function readPublicCache<T>(key: string): Promise<{ hit: boolean; value?: T }> {
  const redis = redisClient();
  if (!redis) return { hit: false };

  try {
    const value = await redis.get<T>(key);
    return value === null ? { hit: false } : { hit: true, value };
  } catch {
    return { hit: false };
  }
}

export async function writePublicCache(key: string, value: unknown, ttlSeconds = publicCacheTtlSeconds()) {
  const redis = redisClient();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Redis is an optimisation. Public requests must still succeed without it.
  }
}
