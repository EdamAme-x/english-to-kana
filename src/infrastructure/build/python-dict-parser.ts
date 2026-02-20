export type DictionaryEntry = {
  readonly key: string;
  readonly kana: string;
};

export type NormalizedDictionaryDataset = {
  readonly entries: readonly DictionaryEntry[];
  readonly duplicateKeys: readonly string[];
  readonly conflictingKeys: readonly string[];
};

const ENTRY_LINE_PATTERN = /^"((?:\\.|[^"\\])*)"\s*:\s*'((?:\\.|[^'\\])*)',?\s*$/;

function decodeHexEscape(
  raw: string,
  start: number,
  length: number,
): { value: string; next: number } {
  const hex = raw.slice(start, start + length);
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(`Invalid hexadecimal escape: \\${raw[start - 1]}${hex}`);
  }

  const codePoint = Number.parseInt(hex, 16);
  return {
    value: String.fromCodePoint(codePoint),
    next: start + length - 1,
  };
}

function decodePythonEscapes(raw: string): string {
  let decoded = "";

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (char !== "\\") {
      decoded += char;
      continue;
    }

    index += 1;
    if (index >= raw.length) {
      throw new Error("Invalid trailing escape in Python string literal.");
    }

    const escaped = raw[index];
    switch (escaped) {
      case "\\":
      case "'":
      case '"':
        decoded += escaped;
        break;
      case "n":
        decoded += "\n";
        break;
      case "r":
        decoded += "\r";
        break;
      case "t":
        decoded += "\t";
        break;
      case "b":
        decoded += "\b";
        break;
      case "f":
        decoded += "\f";
        break;
      case "v":
        decoded += "\v";
        break;
      case "a":
        decoded += "\u0007";
        break;
      case "x": {
        const { value, next } = decodeHexEscape(raw, index + 1, 2);
        decoded += value;
        index = next;
        break;
      }
      case "u": {
        const { value, next } = decodeHexEscape(raw, index + 1, 4);
        decoded += value;
        index = next;
        break;
      }
      case "U": {
        const { value, next } = decodeHexEscape(raw, index + 1, 8);
        decoded += value;
        index = next;
        break;
      }
      default:
        // Preserve unknown escapes as-is to avoid silent data loss.
        decoded += escaped;
        break;
    }
  }

  return decoded;
}

export function parsePythonDictionarySource(content: string): readonly DictionaryEntry[] {
  const anchor = content.indexOf("data =");
  if (anchor < 0) {
    throw new Error("`data = { ... }` block was not found in source data.");
  }

  const openingBrace = content.indexOf("{", anchor);
  const closingBrace = content.lastIndexOf("}");
  if (openingBrace < 0 || closingBrace <= openingBrace) {
    throw new Error("Malformed Python dictionary block.");
  }

  const lineOffset = content.slice(0, openingBrace + 1).split(/\r?\n/).length;
  const body = content.slice(openingBrace + 1, closingBrace);
  const lines = body.split(/\r?\n/);
  const parsed: DictionaryEntry[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const entry = ENTRY_LINE_PATTERN.exec(trimmed);
    if (entry === null) {
      const lineNumber = lineOffset + index + 1;
      throw new Error(`Unsupported dictionary line format at ${lineNumber}: ${trimmed}`);
    }

    const rawKey = entry[1];
    const rawKana = entry[2];
    if (rawKey === undefined || rawKana === undefined) {
      const lineNumber = lineOffset + index + 1;
      throw new Error(`Malformed dictionary entry at ${lineNumber}: ${trimmed}`);
    }

    parsed.push({
      key: decodePythonEscapes(rawKey),
      kana: decodePythonEscapes(rawKana),
    });
  }

  if (parsed.length === 0) {
    throw new Error("No entries were parsed from source data.");
  }

  return parsed;
}

export function normalizeDictionaryEntries(
  entries: readonly DictionaryEntry[],
): NormalizedDictionaryDataset {
  const normalizedMap = new Map<string, string>();
  const duplicateKeys = new Set<string>();
  const conflictingKeys = new Set<string>();

  for (const entry of entries) {
    const key = entry.key.trim().toLowerCase();
    const kana = entry.kana.trim();

    if (key.length === 0 || kana.length === 0) {
      continue;
    }

    const existing = normalizedMap.get(key);
    if (existing !== undefined) {
      duplicateKeys.add(key);
      if (existing !== kana) {
        conflictingKeys.add(key);
      }
    }

    normalizedMap.set(key, kana);
  }

  const sortedEntries = [...normalizedMap.entries()]
    .toSorted((left, right) => {
      if (left[0] < right[0]) {
        return -1;
      }
      if (left[0] > right[0]) {
        return 1;
      }
      if (left[1] < right[1]) {
        return -1;
      }
      if (left[1] > right[1]) {
        return 1;
      }
      return 0;
    })
    .map(([key, kana]) => ({ key, kana }));

  return {
    entries: sortedEntries,
    duplicateKeys: [...duplicateKeys].toSorted(),
    conflictingKeys: [...conflictingKeys].toSorted(),
  };
}

export function validateEntryCount(entries: readonly DictionaryEntry[], minCount = 1000): void {
  if (entries.length < minCount) {
    throw new Error(`Parsed entry count is suspiciously low (${entries.length}).`);
  }
}

export function toStableDictionaryObject(
  entries: readonly DictionaryEntry[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of entries) {
    result[entry.key] = entry.kana;
  }
  return result;
}
