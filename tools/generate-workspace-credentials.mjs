// Generate a new, high-entropy single-owner sign-in password and server keys.
// Store the password privately. Do not commit or share the printed values.
import { randomBytes, scryptSync } from 'node:crypto';

const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32).toString('hex');
const sessionSecret = randomBytes(32).toString('base64url');

console.log('Workspace password (save this securely):', password);
console.log(`FINSIGHT_PASSWORD_HASH=scrypt:${salt.toString('hex')}:${hash}`);
console.log(`FINSIGHT_SESSION_SECRET=${sessionSecret}`);
