export function repeat(text: string, times: number): string {
  const arr: string[] = [];
  while (times) {
    arr.push(text);
    times -= 1;
  }
  return arr.join("");
}
