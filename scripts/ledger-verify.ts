#!/usr/bin/env node
/**
 * ledger-verify.ts
 *
 * CLI script for verifying the ledger chain integrity.
 * Used via: pnpm ledger:verify
 *
 * Exit codes:
 *   0 — chain is VALID
 *   1 — chain is INVALID or error occurred
 *
 * Output format:
 *   ✅ VALID   — X block(s) checked — <detail>
 *   ❌ INVALID — first invalid block: <index> — <detail>
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'
import { verifyChain } from '../server/services/ledger.service'

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is not set.')
    process.exit(1)
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('🔍 Verifying ledger chain...\n')
    const result = await verifyChain(prisma)

    if (result.valid) {
      console.log(`\x1B[32m✅ VALID\x1B[0m — ${result.checkedBlocks} block(s) checked`)
      if (result.detail) {
        console.log(`   ${result.detail}`)
      }
      process.exit(0)
    }
    else {
      console.error(`\x1B[31m❌ INVALID\x1B[0m — first invalid block: ${result.firstInvalidIndex ?? 'unknown'}`)
      if (result.detail) {
        console.error(`   Reason: ${result.detail}`)
      }
      console.error(`   Checked: ${result.checkedBlocks} block(s) before failure`)
      process.exit(1)
    }
  }
  catch (err) {
    console.error('\x1B[31m❌ ERROR\x1B[0m — failed to connect to database or run verification:')
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
  finally {
    await prisma.$disconnect()
  }
}

main()
