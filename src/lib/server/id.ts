// Tanpa karakter yang mudah tertukar (0/O, 1/l/I).
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateId(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < length; i++) id += ALPHABET[bytes[i] % ALPHABET.length];
  return id;
}

export function isValidId(id: string): boolean {
  return /^[2-9a-km-zA-HJ-NP-Z]{6,16}$/.test(id);
}
