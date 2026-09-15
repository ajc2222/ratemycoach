import "server-only";

import { JsonFileDriver } from "./json-driver";
import { PostgresDriver } from "./postgres-driver";
import type { Repository } from "./types";

export * from "./types";

/**
 * One repository per process. `DATABASE_URL` decides which driver: unset means
 * the local JSON driver so a fresh clone works with no setup at all.
 */
let instance: Repository | null = null;
let initPromise: Promise<Repository> | null = null;

export function createRepository(): Repository {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return new PostgresDriver(url);
  return new JsonFileDriver();
}

export async function getDb(): Promise<Repository> {
  if (instance) return instance;
  if (!initPromise) {
    initPromise = (async () => {
      const repo = createRepository();
      await repo.init();
      instance = repo;
      return repo;
    })().catch((error) => {
      // Allow a later request to retry rather than poisoning the module.
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

/** Test seam: lets unit tests inject an in-memory repository. */
export function __setRepositoryForTests(repo: Repository | null): void {
  instance = repo;
  initPromise = repo ? Promise.resolve(repo) : null;
}
