/**
 * Client-side password hashing utilities
 * NOTE: This is a temporary measure. For production, use server-side hashing with bcrypt/argon2.
 */

/**
 * Hash a password using SHA-256 with a salt
 * This is NOT as secure as bcrypt/argon2 but provides basic protection
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const useSalt = salt || crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + useSalt);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash: hashHex, salt: useSalt };
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}
