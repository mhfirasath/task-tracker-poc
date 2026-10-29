// ADMIN tokens are only issued from the `admins` table; `users` always get USER.
export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
