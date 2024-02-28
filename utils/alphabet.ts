function getIndexToLetter(index: number): string {
  if (index > 25) throw new Error('Index is too high');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  if (index < alphabet.length) {
    return alphabet[index];
  } else {
    const firstLetter = alphabet[Math.floor(index / alphabet.length) - 1];
    const secondLetter = alphabet[index % alphabet.length];
    return firstLetter + secondLetter;
  }
}

export { getIndexToLetter };
