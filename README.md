# English to Kana

英単語をカタカナ読みに変換する JavaScript/TypeScript ライブラリです。

## Install

```bash
npm install english-to-kana
pnpm install english-to-kana
bun install english-to-kana
```

## Usage

```ts
import { hasKana, listKanaCandidates, toKana } from "english-to-kana";

console.log(toKana("hello")); // "ハロー"
console.log(toKana("O’Reilly")); // "オーライリー"
console.log(hasKana("unknown")); // false

console.log(listKanaCandidates("hel"));
// 例: ["ハロー", "ヘル", ...]
```
