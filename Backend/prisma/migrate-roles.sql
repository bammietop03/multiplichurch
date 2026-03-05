-- Migrate existing userRoles to direct roleId on users table
UPDATE users u
SET "roleId" = (
  SELECT ur."roleId" 
  FROM user_roles ur 
  WHERE ur."userId" = u.id 
  LIMIT 1
)
WHERE u."roleId" IS NULL;
