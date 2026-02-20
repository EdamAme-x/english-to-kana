import type { DictionaryEntry } from "./python-dict-parser";

type TrieNode = {
  value: string | null;
  children: Map<string, TrieNode>;
};

type RadixNode = {
  value: string | null;
  edges: RadixEdge[];
};

type RadixEdge = {
  label: string;
  node: RadixNode;
};

type HuffmanNode = {
  readonly char: string | null;
  readonly freq: number;
  readonly left: HuffmanNode | null;
  readonly right: HuffmanNode | null;
};

type KanaCompression = {
  readonly kanaToIndex: ReadonlyMap<string, number>;
  readonly bitLengths: readonly number[];
  readonly checkpoints: readonly number[];
  readonly checkpointSpan: number;
  readonly base64: string;
  readonly decodeMap: Readonly<Record<string, string>>;
};

export type GeneratedLookupModule = {
  readonly code: string;
  readonly entryCount: number;
  readonly trieNodeCount: number;
  readonly radixNodeCount: number;
  readonly radixEdgeCount: number;
};

function createTrieNode(): TrieNode {
  return {
    value: null,
    children: new Map<string, TrieNode>(),
  };
}

function compressTrieNode(node: TrieNode): RadixNode {
  const edges: RadixEdge[] = [];
  const childChars = [...node.children.keys()].toSorted();

  for (const childChar of childChars) {
    let label = childChar;
    let cursor = node.children.get(childChar) as TrieNode;

    while (cursor.value === null && cursor.children.size === 1) {
      const next = cursor.children.entries().next().value as [string, TrieNode];
      label += next[0];
      cursor = next[1];
    }

    edges.push({
      label,
      node: compressTrieNode(cursor),
    });
  }

  return {
    value: node.value,
    edges,
  };
}

function buildRadixTree(entries: readonly DictionaryEntry[]): {
  root: RadixNode;
  trieNodeCount: number;
} {
  const root = createTrieNode();
  let trieNodeCount = 1;

  for (const entry of entries) {
    let cursor = root;
    for (let index = 0; index < entry.key.length; index += 1) {
      const char = entry.key[index]!;
      let next = cursor.children.get(char);
      if (next === undefined) {
        next = createTrieNode();
        cursor.children.set(char, next);
        trieNodeCount += 1;
      }
      cursor = next;
    }

    if (cursor.value !== null && cursor.value !== entry.kana) {
      throw new Error(`Duplicate key with conflicting value: ${entry.key}`);
    }

    cursor.value = entry.kana;
  }

  return { root: compressTrieNode(root), trieNodeCount };
}

function countRadixNodes(node: RadixNode): number {
  let count = 1;
  for (const edge of node.edges) {
    count += countRadixNodes(edge.node);
  }
  return count;
}

function countRadixEdges(node: RadixNode): number {
  let count = node.edges.length;
  for (const edge of node.edges) {
    count += countRadixEdges(edge.node);
  }
  return count;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function buildHuffmanCodes(values: readonly string[]): Map<string, string> {
  const freq = new Map<string, number>();
  for (const value of values) {
    for (const char of value) {
      freq.set(char, (freq.get(char) ?? 0) + 1);
    }
  }

  if (freq.size === 0) {
    throw new Error("Cannot build Huffman codes for empty value set.");
  }

  const queue: HuffmanNode[] = [...freq.entries()].map(([char, count]) => ({
    char,
    freq: count,
    left: null,
    right: null,
  }));

  while (queue.length > 1) {
    queue.sort((left, right) => left.freq - right.freq);
    const first = queue.shift() as HuffmanNode;
    const second = queue.shift() as HuffmanNode;
    queue.push({
      char: null,
      freq: first.freq + second.freq,
      left: first,
      right: second,
    });
  }

  const root = queue[0] as HuffmanNode;
  const codes = new Map<string, string>();
  const visit = (node: HuffmanNode, prefix: string): void => {
    if (node.char !== null) {
      codes.set(node.char, prefix.length > 0 ? prefix : "0");
      return;
    }

    visit(node.left as HuffmanNode, `${prefix}0`);
    visit(node.right as HuffmanNode, `${prefix}1`);
  };
  visit(root, "");

  return codes;
}

function buildKanaCompression(entries: readonly DictionaryEntry[]): KanaCompression {
  const checkpointSpan = 128;
  const kanaToIndex = new Map<string, number>();
  const kanaList: string[] = [];

  for (const entry of entries) {
    if (!kanaToIndex.has(entry.kana)) {
      kanaToIndex.set(entry.kana, kanaList.length);
      kanaList.push(entry.kana);
    }
  }

  const codeByChar = buildHuffmanCodes(kanaList);
  const decodeMap = Object.fromEntries(
    [...codeByChar.entries()].map(([char, code]) => [code, char]),
  );

  const bitLengths: number[] = [];
  const checkpoints: number[] = [];
  const bytes: number[] = [];
  let currentByte = 0;
  let bitsInCurrentByte = 0;
  let totalBits = 0;

  const pushBit = (bit: number): void => {
    currentByte = (currentByte << 1) | bit;
    bitsInCurrentByte += 1;

    if (bitsInCurrentByte === 8) {
      bytes.push(currentByte);
      currentByte = 0;
      bitsInCurrentByte = 0;
    }
  };

  for (let kanaIndex = 0; kanaIndex < kanaList.length; kanaIndex += 1) {
    const kana = kanaList[kanaIndex] as string;
    if (kanaIndex % checkpointSpan === 0) {
      checkpoints.push(totalBits);
    }

    let bitLength = 0;
    for (const char of kana) {
      const code = codeByChar.get(char);
      if (code === undefined) {
        throw new Error(`Missing Huffman code for char: ${char}`);
      }

      bitLength += code.length;
      for (let index = 0; index < code.length; index += 1) {
        pushBit(code[index] === "1" ? 1 : 0);
      }
    }
    bitLengths.push(bitLength);
    totalBits += bitLength;
  }

  if (bitsInCurrentByte > 0) {
    bytes.push(currentByte << (8 - bitsInCurrentByte));
  }

  const base64 = Buffer.from(Uint8Array.from(bytes)).toString("base64");
  return {
    kanaToIndex,
    bitLengths,
    checkpoints,
    checkpointSpan,
    base64,
    decodeMap,
  };
}

function emitEdgeCondition(edgeLabel: string, depth: number, charVar: string): string {
  if (edgeLabel.length === 1) {
    return `${charVar}==${quote(edgeLabel)}`;
  }

  return `${charVar}==${quote(edgeLabel[0]!)}&&s(${depth + 1},${quote(edgeLabel.slice(1))})`;
}

function emitNode(
  node: RadixNode,
  depth: number,
  chunks: string[],
  kanaToIndex: ReadonlyMap<string, number>,
): void {
  if (node.value !== null) {
    const kanaIndex = kanaToIndex.get(node.value);
    if (kanaIndex === undefined) {
      throw new Error(`Missing kana index for value: ${node.value}`);
    }
    chunks.push(`if(n==${depth})return ${kanaIndex};`);
  }

  if (node.edges.length === 0) {
    chunks.push("return z;");
    return;
  }

  const charVar = `c${depth}`;
  chunks.push(`const ${charVar}=k[${depth}];`);

  let isFirstBranch = true;
  for (const edge of node.edges) {
    const branch = isFirstBranch ? "if" : "else if";
    isFirstBranch = false;
    const condition = emitEdgeCondition(edge.label, depth, charVar);
    chunks.push(`${branch}(${condition}){`);
    emitNode(edge.node, depth + edge.label.length, chunks, kanaToIndex);
    chunks.push("}");
  }

  chunks.push("return z;");
}

function buildHeader(entryCount: number, sourceLabel: string): string {
  const safeSourceLabel = sourceLabel.replaceAll("*/", "*\\/");
  return `/*auto-generated source:${safeSourceLabel} entries:${entryCount}*/`;
}

function emitKanaDecoderRuntime(chunks: string[], compression: KanaCompression): void {
  chunks.push(`const a=${quote(compression.base64)};`);
  chunks.push(`const l=${JSON.stringify(compression.bitLengths)};`);
  chunks.push(`const p=${JSON.stringify(compression.checkpoints)};`);
  chunks.push(`const q=${compression.checkpointSpan};`);
  chunks.push(`const x=${JSON.stringify(compression.decodeMap)};`);
  chunks.push(
    'const b=typeof Buffer!="undefined"?Uint8Array.from(Buffer.from(a,"base64")):Uint8Array.from(atob(a),q=>q.charCodeAt(0));',
  );
  chunks.push("const g=i=>{const j=(i/q)|0;let r=p[j];for(let t=j*q;t<i;t+=1)r+=l[t];return r;};");
  chunks.push("const c=[];");
  chunks.push(
    'const d=i=>{const y=c[i];if(y!=undefined)return y;let w="";let t="";let r=g(i);const e=r+l[i];for(;r<e;r+=1){w+=((b[r>>3]>>(7-(r&7)))&1)?"1":"0";const h=x[w];if(h!=undefined){t+=h;w="";}}c[i]=t;return t;};',
  );
}

export function generateLookupModule(
  entries: readonly DictionaryEntry[],
  sourceLabel = "unknown",
): GeneratedLookupModule {
  if (entries.length === 0) {
    throw new Error("Cannot generate matcher with zero entries.");
  }

  const { root, trieNodeCount } = buildRadixTree(entries);
  const compression = buildKanaCompression(entries);
  const radixNodeCount = countRadixNodes(root);
  const radixEdgeCount = countRadixEdges(root);

  const chunks: string[] = [];
  chunks.push(buildHeader(entries.length, sourceLabel));
  emitKanaDecoderRuntime(chunks, compression);
  chunks.push("const m=raw=>{");
  chunks.push("const z=null;");
  chunks.push('if(typeof raw!="string")return z;');
  chunks.push("const k=raw.trim().toLowerCase();");
  chunks.push("const n=k.length;");
  chunks.push("if(n==0)return z;");
  chunks.push(
    "const s=(o,p)=>{const m=p.length;if(o+m>n)return false;for(let i=0;i<m;i+=1){if(k[o+i]!=p[i])return false;}return true;};",
  );
  emitNode(root, 0, chunks, compression.kanaToIndex);
  chunks.push("};");
  chunks.push("export function lookupKana(raw){const i=m(raw);return i==null?null:d(i);}");
  chunks.push(`export const LOOKUP_KANA_ENTRY_COUNT=${entries.length};`);

  return {
    code: `${chunks.join("")}\n`,
    entryCount: entries.length,
    trieNodeCount,
    radixNodeCount,
    radixEdgeCount,
  };
}
