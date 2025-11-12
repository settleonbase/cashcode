import { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react"
import {formatAmountReadable, generateCODE, formatWithThousands, getBalance} from '../util/utils'
import {type Lang } from '../util/i18n'
import HumanReadableAmount from './HumanReadableAmount'
import { Copy } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import cashcodeIcon from '../assets/cashcode_icon.svg'
import base_ex from '../assets/base-ex.svg'

import CcWalletComp from './ccWallet'
import CCWallet_Sign from './CCWallet_Show402_Sign'

type Props = {
	lang: Lang
	currency?: string                 // 左上角，如 USDC
	defaultAmount?: number            // 初始金额
	validityDays?: number             // 有效期天数
	cancellable?: boolean             // 右下角“可止付”提示
	// 可传入项目里的 t；若不传，使用组件内置的 t
	t?: (cn: string, en: string, ja?: string) => string
	/** 未连接时显示覆盖层并阻止交互 */
	ccAccount: string
}
type CheckValues = {
	amount: string
	secureCode: string;
	note: string
}




export type CheckHandle = {
	/** 立即获得当前值 */
	getValues: () => CheckValues
	/** 方便外部把焦点放到金额输入框 */
	focusAmount: () => void
}

const copy = async (text: string): Promise<void> => {
	try {
	await navigator.clipboard.writeText(text);
	} catch {
	// noop
	}
}


const Check = forwardRef<CheckHandle, Props>(function Check({
	lang,
	currency = "USDC",
	defaultAmount = 1.0,
	validityDays = 7,
	cancellable = true,
	t: tProp,
	ccAccount,
}: Props, ref) {

	const t =
		tProp ??
		((cn: string, en: string, ja?: string) => {
			if (lang === "cn") return cn
			if (lang === "en") return en
			return ja ?? en
		})


	const [amount, setAmount] = useState<string>(defaultAmount.toFixed(2))
	const [secureCode, setSecureCode] = useState<string>("")
	const [redeemCode, setRedeemCode] = useState<string>("")
	const [redeemHash, setRedeemHash] = useState<string>("")
	const [note, setNote] = useState<string>(
		t("这是使用Cashcode的收款测试", "This is a Cashcode payment test", "これはCashcodeの支払いテストです")
	)

	const [error, setError] = useState<string>("")
	const inputRef = useRef<HTMLInputElement | null>(null)
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	
	const [result, setResult] = useState('')
	const [process, setProcess] = useState(false)
	const [secureError, setSecureError] = useState<string>("")
	const [showCcWallet, setShowCcWallet] = useState(false)

	const [explorerUrl] = useState<string>('')
	const [, setWalletKind] = useState<string>('')
	const [ccAccountUSDC_Balance, setCcAccountUSDC_Balance] = useState(0)
	const [signx402Show, setSignx402Show] = useState(false)
	const [requestUrl, setRequestUrl] = useState('')

	const fetchUsdcBalance = async () => {
		if (!ccAccount) return
		const balance = await getBalance(ccAccount)

		if (balance && balance.balance) {

			const usdc = Number(balance.balance.usdc)
			setCcAccountUSDC_Balance(usdc)
		}
	}

	useImperativeHandle(ref, () => ({
		getValues: () => ({
			amount,
			secureCode,
			note
		}),
		focusAmount: () => {
			inputRef.current?.focus()
			inputRef.current?.select()
		}
   	}), [amount, secureCode, note])
	
	const defaultNote = useMemo(
		() => t(
			"这是使用Cashcode的收款测试",
			"This is a Cashcode payment test",
			"これはCashcodeの支払いテストです"
		),
		[t, lang]
	)

	// 当语言变化时，如果当前 note 等于旧默认文案，则同步为新默认文案
	useEffect(() => {
		setNote((prev) => (prev.trim() === "" || prev === defaultNote ? defaultNote : prev))
	}, [defaultNote])

	useEffect(() => {
		fetchUsdcBalance()
	}, [])

	const handleNoteFocus = () => {
		// 若当前是默认文案，则清空便于输入
		if (note === defaultNote) setNote("")
	}

	const handleNoteBlur = () => {
		// 若为空或只含空格，恢复默认文案
		if (note.trim() === "") setNote(defaultNote)
	}

	const parsed = useMemo(() => Number(amount.replace(/,/g, "")), [amount])

	const readable = useMemo(() => {
		const result = formatAmountReadable(Number(parsed || 0), lang, currency)
		return result
	}, [parsed, lang, currency])

	const formatMoney = (n: number) =>
		n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

	const { fee, net } = useMemo(() => {
			const amt = Number(String(amount).replace(/,/g, "")) || 0
			const feeVal = amt <= 20 ? 0.10 : amt * 0.005
			const netVal = Math.max(amt - feeVal, 0)
			return { fee: feeVal, net: netVal }
	}, [amount])

	const readableNet = useMemo(() => {
		return formatAmountReadable(Number(net || 0), lang, currency)
	}, [net, lang, currency])

	const handleBlur = () => {
		const v = Number(String(amount).replace(/,/g, ""))
		if (isNaN(v) || v < 0.10) {
			setError(t("金额不能低于0.11", "Amount must be ≥ 0.11", "金額は0.11以上にしてください"))
			requestAnimationFrame(() => {
				inputRef.current?.focus()
				inputRef.current?.select()
			})
			return false
		}
		if (v > ccAccountUSDC_Balance) {
			setError(
				t(
					"金额超出你的CC钱包余额",
					"Amount exceeds your CC wallet balance",
					"金額があなたのCCウォレット残高を超えています"
				))
			requestAnimationFrame(() => {
				inputRef.current?.focus()
				inputRef.current?.select()
			})
			return false
		}
		//   // ✅ 增加：不能超过 1000 美元
		// if (v > 1000.1) {
		// 	setError(t("金额不能超过1000美元", "Amount must not exceed 1000 USD", "金額は1000ドルを超えてはいけません"))
		// 	requestAnimationFrame(() => {
		// 	inputRef.current?.focus()
		// 	inputRef.current?.select()
		// 	})
		// 	return
		// }
		// 格式化
		setAmount(formatWithThousands(v))
		setError("")
		return true
	}

	const handleWalletClick = () => {
		setShowCcWallet(true)
		setWalletKind('ccWallet')
	}

	// const generateCashCode = async () => {
	// 	if (process) {
	// 		return
	// 	}
	// 	setProcess(true)

	// 	const isLocal = false
	// 	const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app";

	// 	const price = Number(String(amount).replace(/,/g, "")).toString()
	// 	const code = generateCODE(secureCode.replace('-',''))
	// 	setRedeemCode(code.code)
	// 	const params = new URLSearchParams({amount:price, note, secureCode, hash: code.hash, lang}).toString()
	// 	const path = `/api/cashCode?${params}`

	// 	const fetchWithPayment = wrapFetchWithPayment(fetch, walletClientRef.current, ethers.parseUnits(price, 6))
	
	// 	const remote = "https://api.settleonbase.xyz"
	// 	const local = "http://localhost:4088" 
	// 	const url = (isLocal ? local : remote) + path
	// 	console.log(fetchWithPayment)
		
		
	// 	try {
			
	// 		const response = await fetchWithPayment(
	// 			url, {
	// 			method: 'GET'
	// 		});


	// 		if (response?.ok) {
				
	// 			const data: x402Response = await response.json()
	// 			if (data?.USDC_tx) {
					
	// 				setExplorerUrl(`https://basescan.org/tx/${ data.USDC_tx}`)
	// 				console.log("Purchase success:", response)
	// 				const paramsRemote = new URLSearchParams({hash: code.hash, lang}).toString()
	// 				const realUrl = `${origin}?${paramsRemote}`
	// 				setResult(realUrl)
	// 			}
				

	// 		} else {
	// 			showTermAlert("CashCode Response error", false)
	// 			console.log("❌ Response error:", response)
				
	// 		}
	// 		setProcess(false)
	// 	} catch (ex: any) {
	// 		showTermAlert("CashCode Response error", false)
	// 		console.log(ex.message)
	// 		setProcess(false)
	// 	}
	// }

	const generateCashCodeCCWallet = async () => {
		
		const check = handleBlur()
		
		if (process||!check) {
			return
		}

		setProcess(true)

		const isLocal = false
		

		const price = Number(String(amount).replace(/,/g, "")).toString()
		const code = generateCODE(secureCode.replace('-',''))
		setRedeemCode(code.code)
		setRedeemHash(code.hash)
		const params = new URLSearchParams({amount:price, note, secureCode, hash: code.hash, lang}).toString()
		const path = `/api/cashCode?${params}`

		// const fetchWithPayment = wrapFetchWithPayment(fetch, walletClientRef.current, ethers.parseUnits(price, 6))
	
		const remote = "https://api.settleonbase.xyz"
		const local = "http://localhost:4088" 
		const url = (isLocal ? local : remote) + path
		setRequestUrl(url)
		setSignx402Show(true)
		
	}

	const x402Sign = (data: any) => {
		setSignx402Show(false)
		if (typeof data === 'boolean') {
			if (!data) {
				
				setProcess(false)
				return setError(t("取消签字", "Cancel Signature", "署名をキャンセル"))
			}

			return
		}
		
		setProcess(false)
		if (data == null) {
			return setError(t("发生错误，请稍后再试", "An error occurred, please try again later", "エラーが発生しました。しばらくしてからもう一度お試しください"))
		}
		const paramsRemote = new URLSearchParams({hash: redeemHash, lang}).toString()
		const realUrl = `${origin}?${paramsRemote}`

		console.log(data)
		setResult(realUrl)
		
	} 

	return (
		<div className="relative overflow-hidden rounded-3xl border border-black/40 p-5 md:p-6 max-w-md flex-1 min-h-0 overflow-y-auto">
			{
				showCcWallet ? <CcWalletComp  address={ccAccount} onPrimaryAction={() => setShowCcWallet(false)} t={t} lang={lang} /> :
				
				signx402Show? <CCWallet_Sign url={requestUrl} final={x402Sign} t={t}  /> : !result ? <>
					{/* 顶部行 */}
					<div className="flex items-center justify-between">
						<div className="text-[22px] font-semibold tracking-wide text-black/80 leading-none">
							{currency}
						</div>

						{ccAccount && (
							<div className="flex items-center gap-1">
								{typeof ccAccountUSDC_Balance !== 'undefined' && (
									<span className="text-sm text-black/50">
										$ {ccAccountUSDC_Balance.toFixed(2)}
									</span>
								)}
								<button
									onClick={handleWalletClick} 
									className="
										flex items-center gap-[2px] text-sm text-black/60 leading-none
										hover:bg-[#f0f0f0] hover:text-black transition rounded-lg px-2 py-1
									"
								>
									{ccAccount && (
										<img
											src={cashcodeIcon}
											alt="Cashcode"
											className="w-4 h-4 opacity-70"
										/>
									)}
									<span>{ccAccount.slice(0, 6)}…{ccAccount.slice(-4)}</span>
								</button>
							</div>
							
						)}
					</div>
					{/* 备注输入栏 */}
					<div className="mt-4">
						<label className="block text-xs text-black/60 mb-1">
							{t("备注（对方可见）", "Notes (visible to the recipient)", "メモ（受信者に表示されます）")}
						</label>
						<input
							type="text"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							onFocus={handleNoteFocus}
							onBlur={handleNoteBlur}
							placeholder={defaultNote}
							className="
								w-full border-0 border-b border-black/20
								bg-transparent outline-none
								text-sm text-slate-800 pb-1
								placeholder-black/30
								focus:border-black/50 transition-colors
							"
						/>
					</div>

					<div className={`rounded-3xl p-5 md:p-6 max-w-md`}>


						{/* 金额输入 + 人类可读 */}
						<div
							ref={wrapperRef}
							className="mt-4 rounded-xl
							bg-[repeating-linear-gradient(0deg,#cde5ff_0_1px,transparent_1px_12px)]
							bg-[length:100%_12px] p-4"
						>
							<input
								ref={inputRef}
								value={amount}
								inputMode="decimal"
								type="text"
								onChange={(e) => setAmount(e.target.value)}
								onBlur={handleBlur}
								placeholder="0.00"
								style={{
									fontSize: "45px",
									textAlign: "right",
									transition: "all 0.2s ease",
								}}
								className="
									w-full bg-transparent outline-none
									leading-none font-semibold tracking-wide text-slate-800
								"
							/>

							<HumanReadableAmount readable={readable} lang={lang} />
							{/* 可选：安全码（6位数字） */}
							
								<div className="mt-4">
									<input
										type="text"
										inputMode="numeric"
										pattern="\d*"
										maxLength={7} // 允许中间出现一个减号
										value={secureCode}
										onChange={(e) => {
											// 聚焦时去掉“-”，只保留数字
											const digits = e.target.value.replace(/\D/g, "").slice(0, 6)
											setSecureCode(digits)
											if (secureError && (digits.length === 0 || digits.length === 6)) setSecureError("")
										}}
										onFocus={() => {
											// 去掉格式化分隔符，恢复纯数字
											setSecureCode((prev) => prev.replace(/\D/g, ""))
										}}
										onBlur={() => {
											if (secureCode.length > 0 && secureCode.length !== 6) {
												setSecureError(t("安全码需为6位数字", "Security code must be 6 digits", "セキュリティコードは6桁の数字です"))
											} else {
												setSecureError("")
												// 格式化为 123-456
												if (secureCode.length === 6) {
												const formatted = secureCode.replace(/(\d{3})(\d{3})/, "$1-$2")
												setSecureCode(formatted)
												}
											}
										}}
										placeholder={t(
											"安全码（可选，6位数字，例如123456）",
											"Security code (optional, 6 digits, e.g. 123456)",
											"セキュリティコード（任意・6桁の数字、例：123456）"
											)}
										className="
											w-full border-0 border-b border-black/20
											bg-transparent outline-none
											text-sm text-slate-800 pb-1
											text-center                     /* 👈 居中显示 */
											placeholder:text-xs placeholder-black/30
											focus:border-black/50 transition-colors
										"
									/>
									{secureError ? (
										<div className="mt-1 text-xs text-red-600">{secureError}</div>
									) : null}
								</div>
						</div>
					</div>

					{error ? (
						<div className="mt-2 text-[13px] text-red-600" aria-live="polite">
							{error}
						</div>
					) : null}

					{/* 实际到账 */}
					<div className="flex items-baseline justify-between">
						<span className="text-sm text-black/60">
							{t("实际到账", "Receive", "受取金額")}
						</span>
						<span className="text-[20px] font-semibold text-slate-900">
							{formatMoney(net)} {currency}
						</span>
					</div>

					{/* 底部提示行 */}
					<div className="text-xs text-black/40 text-right -mt-1">
						{t("手续费", "Fee", "手数料")}: {formatMoney(fee)} {currency}
					</div>

					<div className="mt-2 flex items-center justify-between text-sm text-black/60">
						
						<span>
							{t("有效期", "Valid for", "有効期限")} {validityDays} {t("天", "days", "日")}
						</span>
						<span>{cancellable ? t("可止付", "Cancellable", "支払停止可") : "\u00A0"}</span>
					</div>
					
					{ !result ? (
						// 已连接：按 check / link 执行并显示对应文案
						<button
							onClick={() => {
								generateCashCodeCCWallet()
							}}
							disabled={process}
							className={`
								mt-4 w-full border border-black px-3 py-2 text-sm rounded-xl transition
								${process
									? "bg-gray-200 text-gray-500 cursor-not-allowed"
									: "hover:bg-black hover:text-white"}
							`}
						>
							{process
								? t("正在交易中…", "Processing…", "処理中…")
								: t("生成支票码", "Generate Check Code", "チェックコードを作成")}
						</button>
					): <button
							onClick={() => {
								
							}}
							className="mt-4 w-full border border-black px-3 py-2 text-sm hover:bg-black hover:text-white transition rounded-xl"
						>
							{
								t("显示兑换", "Show Check", "チェック")
							}
							
						</button>}
			
				</>
				//				显示结果
				: <>
					<div className={`rounded-3xl p-5 md:p-6 max-w-md`}>
						<div className="mt-4">
							{/* 三国语言标签：兑换码 */}
							<label className="block text-xs text-black/60 mb-1">
								{t("兑换码", "Redeem Code", "引き換えコード")}
							</label>
							<div className="relative flex items-center">
								<input
									value={redeemCode}
									inputMode="decimal"
									type="text"
									readOnly
									style={{
										fontSize: "16px",
										textAlign: "center",
										transition: "all 0.2s ease",
									}}
									className="
										w-full bg-transparent outline-none
										leading-none font-semibold tracking-wide text-slate-800
										border border-black/20 rounded-xl py-2 px-4
									"
								/>

								{/* 复制按钮 */}
								<button
									onClick={() => {
										navigator.clipboard.writeText(redeemCode)
									}}
									className="
										absolute right-3 p-1 rounded-lg hover:bg-gray-100
										transition-colors active:scale-95
									"
									title={t("复制", "Copy", "コピー")}
								>
									<Copy size={18} className="text-black/60" />
								</button>
							</div>
						</div>

						{/* 金额输入 + 人类可读 */}
						<div
							ref={wrapperRef}
							className="rounded-xl
							bg-[repeating-linear-gradient(0deg,#cde5ff_0_1px,transparent_1px_12px)]
							bg-[length:100%_12px] p-4"
						>
							
							

							<input
								ref={inputRef}
								value={formatMoney(net)}
								inputMode="decimal"
								type="text"
								readOnly
								style={{
									fontSize: "45px",
									textAlign: "right",
									transition: "all 0.2s ease",
								}}
								className="
									w-full bg-transparent outline-none
									leading-none font-semibold tracking-wide text-slate-800
								"
							/>

							<HumanReadableAmount readable={readableNet} lang={lang} />
							{/* 可选：安全码（6位数字） */}
							
						</div>
						{
							secureCode && 
							<div className="mt-4">
								<label className="block text-xs text-black/60 mb-1">
									{t("安全码", "Secure Code", "セキュリティコード")}
								</label>
								<input
									type="text"
									readOnly
									maxLength={7} // 允许中间出现一个减号
									value={secureCode}
									className="
										w-full
										bg-transparent outline-none
										text-m text-slate-800 pb-1
										text-center                     
										placeholder:text-xs placeholder-black/30
										focus:border-black/50 transition-colors
									"
								/>
							</div>
						}
						{/* 备注输入栏 */}
						<div className="mb-4">
							<label className="block text-xs text-black/60 mb-1">
								{t("备注", "Notes", "メモ")}
							</label>
							<input
								type="text"
								readOnly
								value={note}
								placeholder={defaultNote}
								className="
									w-full border-0 border-b border-black/20
									bg-transparent outline-none
									text-sm text-slate-800 pb-1
									placeholder-black/30
									focus:border-black/50 transition-colors
								"
							/>
						</div>
						{/* 新增部分：显示链接 + 二维码 + 操作按钮 */}
						{
							result &&
							<div className="mt-6 flex flex-col items-center gap-3">
							
								{/* 二维码 */}
								
								<div className="p-3 rounded-2xl border border-black/10 shadow-sm bg-white">
									<QRCodeCanvas
										value={result || ''}
										size={160}
										includeMargin
										imageSettings={{
											src: cashcodeIcon,   
											height: 36,
											width: 36,
											excavate: true              // 在中心“挖空”以提高识别度
										}}
									/>
									<div className="flex justify-center items-center gap-1 text-[13px] mt-0 pt-0 leading-none">
										<span className="uppercase text-black/50 text-xs" style={{ color: "#c0c0c0ff" }}>
											{t("金额", "Amount", "金額")}
										</span>
										<span className="font-mono text-black/50 font-semibold text-xs" >
											{formatMoney(net)}
										</span>
									</div>
									
								</div>
								

								{/* 按钮区 */}
								<div className="flex gap-2 mt-2">
									<a
										href={result}
										target="_blank"
										rel="noreferrer"
										className="border border-black px-3 py-1 text-xs rounded-xl hover:bg-black hover:text-white transition"
									>
										{t("在新页打开", "Open", "開く")}
									</a>
									<button
										onClick={() => copy(result!)}
										className="border border-black px-3 py-1 text-xs rounded-xl hover:bg-black hover:text-white transition"
									>
										{t("复制", "Copy", "リンクをコピー")}
									</button>
									{explorerUrl && (
										<a
										href={explorerUrl}
										target="_blank"
										rel="noreferrer"
										className="border border-blue-500 text-blue-600 px-3 py-1 text-xs rounded-xl hover:bg-blue-600 hover:text-white transition"
										>
											<img
												src={base_ex}
												alt="Explorer"
												className="w-4 h-4"
											/>
										</a>
									)}
								</div>
							</div>
						}
						
					</div>
				</>
			}
			
			
		</div>
	)
})


export default Check