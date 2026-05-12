// Storage abstraction: Upstash Redis on Vercel, filesystem locally
import { readSolution, writeSolution, patchSolution, getAllSolutions as getAllSolutionsFS } from './parseSolution.js';

const KV_KEY = 'solutions';
const USE_KV = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

async function getRedis() {
  const { Redis } = await import('@upstash/redis');
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function getAllSolutionsAsync() {
  if (!USE_KV) return getAllSolutionsFS();
  const redis = await getRedis();
  const kvData = (await redis.get(KV_KEY)) || {};
  const fsData = getAllSolutionsFS();
  return { ...fsData, ...kvData };
}

export async function getSolutionAsync(id) {
  if (!USE_KV) return readSolution(id);
  const redis = await getRedis();
  const all = (await redis.get(KV_KEY)) || {};
  return all[id] ?? readSolution(id);
}

export async function saveSolutionAsync(id, title, fields) {
  if (!USE_KV) {
    writeSolution(id, title, fields);
    return readSolution(id);
  }
  const redis = await getRedis();
  const all = (await redis.get(KV_KEY)) || {};
  const existing = all[id] || readSolution(id) || {};
  all[id] = { ...existing, id, solved: true, title, ...fields };
  await redis.set(KV_KEY, all);
  return all[id];
}

export async function patchSolutionAsync(id, fields) {
  if (!USE_KV) return patchSolution(id, fields);
  const redis = await getRedis();
  const all = (await redis.get(KV_KEY)) || {};
  const existing = all[id] || readSolution(id) || {};
  all[id] = { ...existing, ...fields };
  await redis.set(KV_KEY, all);
  return all[id];
}
