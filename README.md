# English to Kana
英単語をカタカナ読みに変換する Bun ファーストな JavaScript/TypeScript ライブラリです。  
辞書検索はビルド時に生成される分岐ベース matcher（radix tree 圧縮）で実行します。

## Install

```bash
npm install english-to-kana
pnpm install english-to-kana
bun install english-to-kana
```

## Usage

```ts
import { hasKana, toKana } from "english-to-kana";

console.log(toKana("hello")); // "ハロー"
console.log(toKana("O’Reilly")); // "オーライリー"
console.log(hasKana("unknown")); // false
```

## Features

- DDD 構成 (`domain` / `application` / `infrastructure`)
- TDD 前提のユニットテスト
- ビルド時 radix tree 生成による高速辞書検索
- Bun + oxc (`oxlint` / `oxfmt`) ランタイムとフォーマッター/リンタ―
- Git hooks (`lefthook`) / CI / publish workflow
- 定期 benchmark 実行 + README 自動更新

## Architecture

- `src/domain`: 値オブジェクトとリポジトリ境界
- `src/application`: 変換ユースケース
- `src/infrastructure/build`: 辞書パースと matcher コード生成
- `src/infrastructure/generated`: 生成された matcher

matcher はビルド時に `scripts/generate-radix-matcher.ts` で生成され、  
`if/else` 連鎖と `startsWith` を使う分岐コードとして出力されます。

## Data

- `data/source-dictionary.py`: 元辞書（静的配置）
- `data/word-kana.json`: 実運用で参照する静的辞書データ

更新フロー:

```bash
bun run data:convert
bun run gen:matcher
```

## Development

```bash
bun install
bun run check
```

主要コマンド:

- `bun run format`
- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run build`
- `bun run bench`
- `bun run bench:readme`

## Release

```bash
bun run pack:dry-run
bun run release:dry-run
bun run release
```

`release` は npm provenance 付きで publish します。
