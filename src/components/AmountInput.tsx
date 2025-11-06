import { useState, useEffect, useMemo } from "react"
import { type Lang } from "../util/i18n"

interface AmountInputProps {
	amount: string;                          // 全局金额（上层状态）
	setAmount: (v: string) => void;          // 全局 setter（提交用）
	lang: Lang;                              
	result?: unknown;                        // 有结果时禁用输入
	t: (cn: string, en: string, ja: string) => string;
	formatAmountReadable: (amount: number | string, lang: Lang) => string;
}

export default function AmountInput({
	amount,
	setAmount,
	lang,
	result,
	t,
	formatAmountReadable,
	}: AmountInputProps) {
	// 本地编辑态，不影响全局；仅在 blur 或 Enter 时提交全局
	const [amountInput, setAmountInput] = useState(amount || "10.00");

	// 当外部全局 amount 变化时，同步本地显示（例如外部重置）
	useEffect(() => {
		setAmountInput(amount || "0");
	}, [amount]);

	// 规范化为两位小数；如果为空或不是数，回退为上一次全局 amount
	function normalize(val: string): string {
		const s = (val ?? "").toString().trim().replace(/,/g, "");
		if (s === "") return amount || "0.00";
		// 允许 0. / .5 这种输入
		const n = Number(s);
		if (!isFinite(n)) return amount || "0.00";
		return n.toFixed(2);
	}

	// 提交到全局
	function commit() {
		const normalized = normalize(amountInput);
		setAmountInput(normalized);
		setAmount(normalized);
	}

	// 可读化提示（实时基于本地输入展示）
	const readable = useMemo(
		() => formatAmountReadable(amountInput, lang),
		[amountInput, lang, formatAmountReadable]
	);

	return (
		<>
		{/* 左侧金额标签 + 右侧可读数字 */}
		<div className="flex items-center justify-between mb-1 mt-2">
			<label className="text-xs text-black/60">
			{t("金额", "Amount", "金額")}
			</label>
			<span className="text-xs text-black/60 font-mono truncate max-w-[60%] text-right">
			{readable}
			</span>
		</div>

		<input
			value={amountInput}
			disabled={!!result}
			onChange={(e) => setAmountInput(e.target.value)}
			onBlur={commit}
			onKeyDown={(e) => {
			if (e.key === "Enter") e.currentTarget.blur();
			if (e.key === "Escape") {
				setAmountInput(amount || "");
				e.currentTarget.blur();
			}
			}}
			inputMode="decimal"
			autoComplete="off"
			spellCheck={false}
			placeholder="请输入金额 / Enter amount"
			className="w-full border border-black px-3 py-2 text-sm rounded-xl font-mono text-right outline-none focus:ring-2 focus:ring-black/20"
		/>
		</>
	);
}
	