export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_LOCK: 'users.lock',
  USERS_UNLOCK: 'users.unlock',
  USERS_DELETE: 'users.delete',
  ROLES_MANAGE: 'roles.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_VALUES: Permission[] = Object.values(PERMISSIONS);
