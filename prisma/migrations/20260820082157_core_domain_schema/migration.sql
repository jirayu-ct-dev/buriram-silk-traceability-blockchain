-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WEAVER', 'COOPERATIVE_OFFICER', 'STORE_USER');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('COOPERATIVE', 'STORE');

-- CreateEnum
CREATE TYPE "RevisionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ValidatorAuthorityRole" AS ENUM ('COOPERATIVE_AUTHORITY', 'LOCAL_CERTIFIER_AUTHORITY', 'RETAIL_NETWORK_AUTHORITY');

-- CreateEnum
CREATE TYPE "LedgerEventType" AS ENUM ('GENESIS', 'ISSUE_CERTIFICATE', 'TRANSFER_ACCEPTED', 'CERTIFICATE_SUSPENDED', 'CERTIFICATE_REACTIVATED', 'CERTIFICATE_REVOKED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('REVISION_CREATED', 'EVIDENCE_UPLOADED', 'SUBMITTED_FOR_CERTIFICATION', 'CERTIFICATION_APPROVED', 'CERTIFICATION_REJECTED', 'CERTIFICATE_SUSPENDED', 'CERTIFICATE_REACTIVATED', 'CERTIFICATE_REVOKED', 'TRANSFER_INITIATED', 'TRANSFER_ACCEPTED', 'TRANSFER_REJECTED', 'TRANSFER_CANCELLED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weaver_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weaver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silk_items" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "custodian_org_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "silk_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silk_item_revisions" (
    "id" UUID NOT NULL,
    "silk_item_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "status" "RevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "pattern" TEXT,
    "material" TEXT,
    "technique" TEXT,
    "width_cm" DECIMAL(6,2),
    "length_cm" DECIMAL(6,2),
    "production_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "silk_item_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_files" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_requests" (
    "id" UUID NOT NULL,
    "silk_item_id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_by_user_id" UUID NOT NULL,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason_code" TEXT,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "certificate_code" TEXT NOT NULL,
    "silk_item_id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "issuing_org_id" UUID NOT NULL,
    "issued_by_user_id" UUID NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "status_reason" TEXT,
    "status_changed_at" TIMESTAMP(3),
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custody_transfers" (
    "id" UUID NOT NULL,
    "silk_item_id" UUID NOT NULL,
    "from_org_id" UUID NOT NULL,
    "to_org_id" UUID NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "initiated_by_user_id" UUID NOT NULL,
    "resolved_by_user_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custody_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_validators" (
    "id" UUID NOT NULL,
    "validator_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "authority_role" "ValidatorAuthorityRole" NOT NULL,
    "public_key" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_validators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_blocks" (
    "id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "data_hash" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "previous_hash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "validator_id" UUID NOT NULL,
    "signature" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_events" (
    "id" UUID NOT NULL,
    "event_type" "LedgerEventType" NOT NULL,
    "block_id" UUID NOT NULL,
    "aggregate_id" TEXT,
    "actor_id" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "silk_item_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "weaver_profiles_user_id_key" ON "weaver_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "silk_items_public_id_key" ON "silk_items"("public_id");

-- CreateIndex
CREATE INDEX "silk_items_owner_user_id_idx" ON "silk_items"("owner_user_id");

-- CreateIndex
CREATE INDEX "silk_items_custodian_org_id_idx" ON "silk_items"("custodian_org_id");

-- CreateIndex
CREATE INDEX "silk_item_revisions_silk_item_id_idx" ON "silk_item_revisions"("silk_item_id");

-- CreateIndex
CREATE INDEX "silk_item_revisions_status_idx" ON "silk_item_revisions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "silk_item_revisions_silk_item_id_revision_number_key" ON "silk_item_revisions"("silk_item_id", "revision_number");

-- CreateIndex
CREATE INDEX "evidence_files_revision_id_idx" ON "evidence_files"("revision_id");

-- CreateIndex
CREATE INDEX "evidence_files_uploaded_by_user_id_idx" ON "evidence_files"("uploaded_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "certification_requests_revision_id_key" ON "certification_requests"("revision_id");

-- CreateIndex
CREATE INDEX "certification_requests_silk_item_id_idx" ON "certification_requests"("silk_item_id");

-- CreateIndex
CREATE INDEX "certification_requests_status_idx" ON "certification_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_code_key" ON "certificates"("certificate_code");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_silk_item_id_key" ON "certificates"("silk_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_revision_id_key" ON "certificates"("revision_id");

-- CreateIndex
CREATE INDEX "certificates_issuing_org_id_idx" ON "certificates"("issuing_org_id");

-- CreateIndex
CREATE INDEX "certificates_status_idx" ON "certificates"("status");

-- CreateIndex
CREATE INDEX "custody_transfers_silk_item_id_idx" ON "custody_transfers"("silk_item_id");

-- CreateIndex
CREATE INDEX "custody_transfers_from_org_id_idx" ON "custody_transfers"("from_org_id");

-- CreateIndex
CREATE INDEX "custody_transfers_to_org_id_idx" ON "custody_transfers"("to_org_id");

-- CreateIndex
CREATE INDEX "custody_transfers_status_idx" ON "custody_transfers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_validators_validator_id_key" ON "ledger_validators"("validator_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_blocks_index_key" ON "ledger_blocks"("index");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_blocks_hash_key" ON "ledger_blocks"("hash");

-- CreateIndex
CREATE INDEX "ledger_blocks_validator_id_idx" ON "ledger_blocks"("validator_id");

-- CreateIndex
CREATE INDEX "ledger_events_block_id_idx" ON "ledger_events"("block_id");

-- CreateIndex
CREATE INDEX "ledger_events_aggregate_id_idx" ON "ledger_events"("aggregate_id");

-- CreateIndex
CREATE INDEX "ledger_events_event_type_idx" ON "ledger_events"("event_type");

-- CreateIndex
CREATE INDEX "audit_logs_silk_item_id_idx" ON "audit_logs"("silk_item_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weaver_profiles" ADD CONSTRAINT "weaver_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silk_items" ADD CONSTRAINT "silk_items_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silk_items" ADD CONSTRAINT "silk_items_custodian_org_id_fkey" FOREIGN KEY ("custodian_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silk_item_revisions" ADD CONSTRAINT "silk_item_revisions_silk_item_id_fkey" FOREIGN KEY ("silk_item_id") REFERENCES "silk_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "silk_item_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_requests" ADD CONSTRAINT "certification_requests_silk_item_id_fkey" FOREIGN KEY ("silk_item_id") REFERENCES "silk_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_requests" ADD CONSTRAINT "certification_requests_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "silk_item_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_requests" ADD CONSTRAINT "certification_requests_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_requests" ADD CONSTRAINT "certification_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_silk_item_id_fkey" FOREIGN KEY ("silk_item_id") REFERENCES "silk_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "silk_item_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issuing_org_id_fkey" FOREIGN KEY ("issuing_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_silk_item_id_fkey" FOREIGN KEY ("silk_item_id") REFERENCES "silk_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_from_org_id_fkey" FOREIGN KEY ("from_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_to_org_id_fkey" FOREIGN KEY ("to_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_blocks" ADD CONSTRAINT "ledger_blocks_validator_id_fkey" FOREIGN KEY ("validator_id") REFERENCES "ledger_validators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_events" ADD CONSTRAINT "ledger_events_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "ledger_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_silk_item_id_fkey" FOREIGN KEY ("silk_item_id") REFERENCES "silk_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Custom database rules that Prisma PSL cannot express
-- (system-design.md section 10.6)
-- ---------------------------------------------------------------------------

-- One PENDING custody transfer per silk item
CREATE UNIQUE INDEX "custody_transfers_silk_item_id_pending_key"
  ON "custody_transfers"("silk_item_id")
  WHERE "status" = 'PENDING';

-- Append-only ledger: reject UPDATE and DELETE from the application
CREATE OR REPLACE FUNCTION "reject_ledger_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger tables are append-only: % on % is not allowed', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ledger_blocks_append_only"
  BEFORE UPDATE OR DELETE ON "ledger_blocks"
  FOR EACH ROW EXECUTE FUNCTION "reject_ledger_mutation"();

CREATE TRIGGER "ledger_events_append_only"
  BEFORE UPDATE OR DELETE ON "ledger_events"
  FOR EACH ROW EXECUTE FUNCTION "reject_ledger_mutation"();
