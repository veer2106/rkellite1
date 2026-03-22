-- Migration to add state timestamp fields to Orders table

-- Add timestamp columns for each order state
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "pendingAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "servedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "completedAtTimestamp" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP WITH TIME ZONE;

-- Update existing orders to set pendingAt to their createdAt timestamp
UPDATE "Orders" SET "pendingAt" = "createdAt" WHERE "pendingAt" IS NULL;

-- For completed orders, set completedAtTimestamp from completedAt
UPDATE "Orders" SET "completedAtTimestamp" = "completedAt" WHERE status = 'completed' AND "completedAt" IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_pending_at ON "Orders"("pendingAt");
CREATE INDEX IF NOT EXISTS idx_orders_completed_at_timestamp ON "Orders"("completedAtTimestamp");

COMMENT ON COLUMN "Orders"."pendingAt" IS 'Timestamp when order was placed/created';
COMMENT ON COLUMN "Orders"."confirmedAt" IS 'Timestamp when order was confirmed';
COMMENT ON COLUMN "Orders"."preparingAt" IS 'Timestamp when order preparation started';
COMMENT ON COLUMN "Orders"."readyAt" IS 'Timestamp when order was ready for serving';
COMMENT ON COLUMN "Orders"."servedAt" IS 'Timestamp when order was served to customer';
COMMENT ON COLUMN "Orders"."completedAtTimestamp" IS 'Timestamp when order was marked as completed';
COMMENT ON COLUMN "Orders"."cancelledAt" IS 'Timestamp when order was cancelled';
