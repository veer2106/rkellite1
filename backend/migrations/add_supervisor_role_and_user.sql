-- Add supervisor role to the User role enum
ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'supervisor';

-- Create supervisor user
-- Password: supervisor123 (hashed with bcrypt)
INSERT INTO "Users" (
  id,
  "firstName",
  "lastName",
  email,
  password,
  phone,
  role,
  section,
  "isActive",
  department,
  "hireDate",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Supervisor',
  'User',
  'supervisor@cafedelicacy.com',
  '$2a$10$YourHashedPasswordHere',  -- Will be replaced with actual hash
  '+1234567890',
  'supervisor',
  NULL,
  true,
  'Operations',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

COMMENT ON COLUMN "Users"."role" IS 'User role: admin, manager, cashier, waiter, chef, delivery, captain, supervisor';
