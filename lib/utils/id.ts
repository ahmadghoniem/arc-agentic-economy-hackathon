/**
 * Generate a non-cryptographic id with a short prefix. Sufficient for
 * client-side React keys and chat message ids; not for security purposes.
 */
export const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
