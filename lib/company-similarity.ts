export function comparableCompanyName(name: string): string {
  return name
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/股份有限公司|有限责任公司|有限公司|集团|公司/g, '')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

export function companyNameSimilarity(left: string, right: string): number {
  const a = comparableCompanyName(left);
  const b = comparableCompanyName(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  }
  const bigrams = (value: string) =>
    value.length < 2
      ? [value]
      : Array.from({ length: value.length - 1 }, (_, index) =>
          value.slice(index, index + 2)
        );
  const leftBigrams = bigrams(a);
  const rightBigrams = bigrams(b);
  const remaining = [...rightBigrams];
  let matches = 0;
  for (const pair of leftBigrams) {
    const index = remaining.indexOf(pair);
    if (index >= 0) {
      matches += 1;
      remaining.splice(index, 1);
    }
  }
  return (2 * matches) / (leftBigrams.length + rightBigrams.length);
}
