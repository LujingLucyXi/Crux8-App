/**
 * Barrel export for all CruxMate seed data.
 *
 * In the Lovable-generated project, copy this whole `Seed/` folder to
 * `src/seed/` and import via:
 *
 *     import { SEED_GYMS, SEED_ROUTES, SEED_SESSIONS,
 *              SEED_EVENTS, SEED_GROUPS, SEED_USERS,
 *              SEED_CRUXMATES } from '@/seed';
 *
 * The Zustand store's initializer should check `store.seededAt === null`
 * and, if so, populate every list from these exports in one pass.
 */
export * from './types';
export * from './gyms';
export * from './routes';
export * from './users';
export * from './sessions';
export * from './events';
export * from './groups';
