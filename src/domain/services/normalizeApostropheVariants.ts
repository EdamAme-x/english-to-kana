const APOSTROPHE_VARIANTS_PATTERN = /[\u2018\u2019\u02BC\uFF07]/g;
const ASCII_APOSTROPHE = "'";

export function normalizeApostropheVariants(value: string): string {
  return value.replace(APOSTROPHE_VARIANTS_PATTERN, ASCII_APOSTROPHE);
}
