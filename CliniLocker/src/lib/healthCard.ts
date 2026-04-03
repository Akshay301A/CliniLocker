export function formatHealthIdFromNumber(n: number): string {
  const part1 = Math.floor(n / 10000).toString().padStart(4, "0");
  const part2 = (n % 10000).toString().padStart(4, "0");
  return `CL-${part1}-${part2}`;
}
