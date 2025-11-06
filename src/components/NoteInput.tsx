import { useState, useRef, useEffect, useMemo } from "react";
import { type Lang } from "../util/i18n"

interface NodeInputProps {
	note: string;                          // 全局金额（上层状态）
	setNote: (v: string) => void;          // 全局 setter（提交用）                           
	t: (cn: string, en: string, ja: string) => string
	lang: Lang; 
}


const NodeInput: React.FC<NodeInputProps> = ({ note, setNote, t, lang }) => {
  // 计算当前语言的初始文案
  const defaultNote = useMemo(
    () =>
      t(
        "这是使用Cashcode的收款测试",
        "This is a Cashcode payment test",
        "これはCashcodeの受け取りテストです"
      ),
    [t, lang]
  );

  // 本地输入状态
  const [nodeInput, setNodeInput] = useState<string>(note || "");
  const prevDefaultRef = useRef<string>(defaultNote);

  // 首次挂载 / 外部 note 变化时的同步
  useEffect(() => {
    if (!note || note.trim() === "") {
      // 外部为空，则初始化为默认文案（保证不为空）
      setNodeInput(defaultNote);
      setNote(defaultNote);
    } else {
      setNodeInput(note);
    }
  }, [note, defaultNote, setNote]);

  // 语言变化：如果当前显示的还是旧的默认文案，切到新的默认文案
  useEffect(() => {
    if (nodeInput === prevDefaultRef.current) {
      setNodeInput(defaultNote);
      setNote(defaultNote);
    }
    prevDefaultRef.current = defaultNote;
  }, [defaultNote]); // 仅在默认文案（受语言影响）变化时运行

  // 提交到全局（保证不为空；空则回退默认文案）
  const commit = () => {
    const trimmed = (nodeInput ?? "").trim();
    if (trimmed === "") {
      setNodeInput(defaultNote);
      setNote(defaultNote);
    } else {
      setNote(trimmed);
    }
  };

  return (
    <>
      <label className="block text-xs text-black/60 mt-3 mb-1">
        {t("备注（对方可见）", "Notes (visible to the recipient)", "メモ（受信者に表示されます）")}
      </label>

      <input
        value={nodeInput}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setNodeInput(e.target.value); // 仅改本地，避免输入时丢焦
        }}
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
          // 聚焦时，如果是默认文案则清空，方便直接输入
          if ((e.currentTarget.value || "") === defaultNote) {
            setNodeInput("");
          }
        }}
        onBlur={commit} // 失焦时提交，空则回默认文案
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") {
            (e.currentTarget as HTMLInputElement).blur(); // 触发 onBlur -> 提交
          } else if (e.key === "Escape") {
            // 撤销编辑：恢复为全局 note（若全局为空则默认文案）
            const fallback = note && note.trim() !== "" ? note : defaultNote;
            setNodeInput(fallback);
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="w-full border border-black px-3 py-2 text-sm rounded-xl outline-none focus:ring-2 focus:ring-black/20"
        autoComplete="off"
        spellCheck={false}
        placeholder={defaultNote}
      />
    </>
  );
};
export default NodeInput