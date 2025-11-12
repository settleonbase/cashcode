import { useRef } from "react";

// --- 断行规则 ---
function splitReadable(readable: string, lang: "en" | "cn" | "ja") {
  if (lang === "en") {
    // 英文：匹配 "and XX/100 dollars" 部分
    const m = readable.match(/\s+(and\s+\d{1,2}\/100\s+dollars)\s*$/i);
    if (m && m.index !== undefined && m.index > 0) {
      const firstLine = readable.slice(0, m.index).trim();
      const secondLine = m[1].trim();
      // 确保第一行不为空且有意义
      if (firstLine && firstLine.length > 10) {
        return [firstLine, secondLine];
      }
    }
  }
  if (lang === "cn") {
    const m = readable.match(/\s+(元(?:整|[零壹贰貳參叁肆伍陆陸柒捌玖〇一二三四五六七八九十百千万亿兆]*[角分]*)?)$/);
    if (m && m.index !== undefined && m.index > 0) {
      return [readable.slice(0, m.index).trim(), m[1]];
    }
  }
  if (lang === "ja") {
    const m = readable.match(/\s+(ドル(?:\s*\d+\s*セント)?|\s*ドルちょうど|\s*ドル\s*セント.*)\s*$/);
    if (m && m.index !== undefined && m.index > 0) {
      return [readable.slice(0, m.index).trim(), m[1].trim()];
    }
  }
  return [readable, ""];
}

export default function HumanReadableAmount({
  readable,
  lang, // "en" | "cn" | "ja"
}: {
  readable: string;
  lang: "en" | "cn" | "ja";
}) {
  const elRef = useRef<HTMLDivElement>(null);
  
  // 清理输入的 readable，去除已存在的换行符
  const cleanReadable = readable
    .replace(/\s+/g, " ")  // 将所有空白符（包括换行）替换为单个空格
    .trim();
  
  // 直接根据内容拆分，不依赖于 offsetHeight
  const [a, b] = splitReadable(cleanReadable, lang);
  const lines = { l1: a, l2: b || undefined };

  return (
    <div
      ref={elRef}
      className="mt-2 text-right text-sm md:text-base lg:text-lg font-semibold text-black/50 whitespace-normal break-words leading-snug"
      title={readable}
    >
      {lines.l1}
      {lines.l2 ? (
        <>
          <br />
          {lines.l2}
        </>
      ) : null}
    </div>
  );
}