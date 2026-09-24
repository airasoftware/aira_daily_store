import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const reader = createInterface({ input: process.stdin, output: process.stdout });
const password = await reader.question('Password admin (minimal 12 karakter): ');
reader.close();
if (password.length < 12) {
  console.error('Password harus minimal 12 karakter.');
  process.exit(1);
}
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
console.log(`ADMIN_PASSWORD_HASH=${salt}:${hash}`);
