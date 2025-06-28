export type ROLE = keyof typeof ROLES

const ROLES = {
  admin: [
    'view:catalogue',
    'create:catalogue',
    'update:catalogue',
    'delete:catalogue',
    'invite:user',
    'remove:user',
  ] as const,
  editor: ['view:catalogue', 'create:catalogue', 'update:catalogue'] as const,
  viewer: ['view:catalogue'] as const,
} as const

export type Permission = (typeof ROLES)[keyof typeof ROLES][number]

export function hasPermission(
  user: { id: string; role: ROLE },
  permission: Permission,
) {
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-ignore
  return ROLES[user.role].includes(permission)
}
