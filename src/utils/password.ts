import crypto from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2 = promisify(crypto.pbkdf2);

const ALGORITHM = 'pbkdf2-sha256';
const VERSION = 'v1';
const DIGEST = 'sha256';
const ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const MAX_PASSWORD_BYTES = 1024;

function assertValidPassword(password: string): void {
  if (typeof password !== 'string') {
    throw new TypeError('Password must be a string');
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new RangeError('Password is too long');
  }
}

function decodeBase64Url(value: string, expectedLength: number): Buffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  const decoded = Buffer.from(value, 'base64url');
  return decoded.length === expectedLength ? decoded : null;
}

export async function hashPassword(password: string): Promise<string> {
  assertValidPassword(password);

  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

  return [
    ALGORITHM,
    VERSION,
    ITERATIONS,
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(
  password: string,
  storedHash: unknown,
): Promise<boolean> {
  try {
    assertValidPassword(password);

    if (typeof storedHash !== 'string') {
      return false;
    }

    const parts = storedHash.split('$');
    if (parts.length !== 5) {
      return false;
    }

    const [algorithm, version, iterationsText, encodedSalt, encodedHash] = parts;
    const iterations = Number(iterationsText);

    if (
      algorithm !== ALGORITHM ||
      version !== VERSION ||
      iterations !== ITERATIONS ||
      encodedSalt === undefined ||
      encodedHash === undefined
    ) {
      return false;
    }

    const salt = decodeBase64Url(encodedSalt, SALT_LENGTH);
    const expectedHash = decodeBase64Url(encodedHash, KEY_LENGTH);

    if (!salt || !expectedHash) {
      return false;
    }

    const actualHash = await pbkdf2(
      password,
      salt,
      iterations,
      KEY_LENGTH,
      DIGEST,
    );

    return crypto.timingSafeEqual(expectedHash, actualHash);
  } catch {
    return false;
  }
}
