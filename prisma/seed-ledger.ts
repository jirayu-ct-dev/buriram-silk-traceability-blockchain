/**
 * seed-ledger.ts
 *
 * Ledger seed module owned by Blockchain Engineer (Person 4).
 * Exports seedLedger() for prisma/seed.ts (Person 3) to import and call.
 *
 * Usage (from prisma/seed.ts):
 *   import { seedLedger } from './seed-ledger'
 *   await prisma.$transaction(async (tx) => {
 *     await seedLedger(tx)
 *   })
 */
export { seedLedger } from '../server/services/ledger.service'
