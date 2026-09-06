export function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function fromLines(lines: string[]): string {
  return lines.join("\n");
}
