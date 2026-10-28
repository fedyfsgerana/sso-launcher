const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*";
const ALPHABET = UPPER + LOWER + DIGITS + SYMBOLS;

function randomIndex(max: number) {
  const bytes = new Uint32Array(1);

  crypto.getRandomValues(bytes);

  return bytes[0] % max;
}

function pick(source: string) {
  return source[randomIndex(source.length)];
}

export function generatePassword(length = 16) {
  const characters = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];

  while (characters.length < length) {
    characters.push(pick(ALPHABET));
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1);

    [characters[index], characters[swap]] = [
      characters[swap],
      characters[index],
    ];
  }

  return characters.join("");
}
