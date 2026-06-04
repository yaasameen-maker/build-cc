-- Remove duplicate account rows per (userId, provider, providerAccountId),
-- keeping only the most recently inserted row (highest id).
DELETE FROM accounts a
USING accounts b
WHERE a.id < b.id
  AND a."userId" = b."userId"
  AND a.provider = b.provider
  AND a."providerAccountId" = b."providerAccountId";

-- Prevent future duplicates.
ALTER TABLE accounts
  ADD CONSTRAINT accounts_provider_unique
  UNIQUE ("userId", provider, "providerAccountId");
