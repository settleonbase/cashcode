import { useState } from 'react'
import { x402Payment, generateCODE } from '../util/utils'
import {type Lang} from '../util/i18n'
import { QRCodeCanvas } from "qrcode.react"
import cashcodeIcon from '../assets/cashcode_icon.svg'
import {shortAddr} from '../util/utils'
import NodeInput from './NoteInput'

// import ShowPaymentUrl from './showPaymentLink'


type Props = {
	walletClient: any
	payAccount?: string
	address: string
	usdcBalance?: number
	t: (cn: string, en: string, ja?: string) => string
	lang: Lang
	setResult: (val: any) => void
	result: any
	setFinishedPay: (val: string) => void
}

const copy = async (text: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		// noop
	}
}



export type CheckHandle = {
	/** 方便外部把焦点放到金额输入框 */
	focusAmount: () => void
}


const AmountInput = ({ usdcBalance = 0, t, address, payAccount, walletClient, lang, setResult, result, setFinishedPay} :
	Props) =>  {

	const [amount, setAmount] = useState('')
	const [error, setError] = useState(false)
	const [note, setNote] = useState('')




	const amountNum = Number(amount || 0)
	const fee = amountNum > 0 ? Math.max(amountNum * 0.005, 0.1) : 0
	const netAmount = amountNum > 0 ? Math.max(amountNum - fee, 0) : 0

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		setAmount(val)

		const num = Number(val)
		if (!isNaN(num) && walletClient && num > usdcBalance) {
			setError(true)
		} else {
			setError(false)
		}
	}


	const handleMax = () => {
			setAmount(usdcBalance.toString())
			setError(false)
	}

    const genLink = (): void => {

		if (!address) {
			return 
		}
		const code = generateCODE('')
		const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app";
		const params = new URLSearchParams({ id: code.hash, amt: amount, ccy: 'USDC', wallet: address, lang, note: encodeURIComponent(note)}).toString();
		const url = `${origin}/pay?${params}`;
		setResult({ code: code.hash, url });
	}

	const [processing, setProcessing] = useState(false)
	const [processingError, setProcessingError] = useState<string | null>(null)

// 点击逻辑
const handleClick = async () => {
	if (processing) return
	if (!address || netAmount <= 0) return
	if (!walletClient || !payAccount) return genLink()

	setProcessing(true)
	setProcessingError(null)
	
		const result = await x402Payment(address, amount, payAccount, walletClient)
		if (result) {
			setFinishedPay(result)
		} else {
			setProcessingError(t("支付失败，请稍后再试", "Payment failed, please try again later", "支払いに失敗しました。後でもう一度お試しください。"))
			// 5 秒后自动清除错误
			setTimeout(() => setProcessingError(null), 5000)
		}
	
		
	
	setProcessing(false)
	
		

}

	return (
		<>
		{
			!result &&
				<div className="mt-6">
					
					{/* ===== 去除 Chrome/Safari/Edge 数字上下箭头 ===== */}
					<style>
						{`
						input[type=number]::-webkit-inner-spin-button,
						input[type=number]::-webkit-outer-spin-button {
							-webkit-appearance: none;
							margin: 0;
						}
						input[type=number] {
							-moz-appearance: textfield;
						}
						`}
					</style>
					{
						!payAccount && <NodeInput t={t} lang={lang} setNote={setNote} note={note} />

					}
					
					{/* ===== 金额输入区 ===== */}
					<div className="flex items-center w-full min-w-0 relative">
						{/* 左侧 $ */}
						<span className="absolute left-3 text-[40px] font-semibold text-[#2563eb] select-none">$</span>

						{/* 输入框 + Max按钮容器 */}
						<div className="flex items-center w-full pl-10 pr-3">
							<input
							type="number"
							inputMode="decimal"
							placeholder="0"
							value={amount}
							onChange={handleChange}
							className={`
								flex-1 min-w-0 text-[40px] font-semibold text-right
								bg-transparent outline-none border-none focus:ring-0
								appearance-none [appearance:textfield] [-moz-appearance:textfield]
								transition-colors
								${error ? 'text-red-500 placeholder:text-red-300' : 'text-[#2563eb] placeholder:text-[#2563eb]/40'}
							`}
							style={{
								WebkitAppearance: 'none',
								MozAppearance: 'textfield',
							}}
							/>

							{/* Max 按钮（若无则自动腾出空间） */}
							{walletClient && (
							<button
								type="button"
								onClick={handleMax}
								className="
								ml-2 text-sm text-black/80
								border border-black/10 rounded-full px-3 py-0.5
								hover:bg-black/5 transition
								shrink-0
								"
							>
								{t('最大', 'Max', '最大')}
							</button>
							)}
						</div>
					</div>

					{/* ===== 下方说明（左：可用；右：实际到账） ===== */}
					<div className="mt-2">
						<div className="flex items-center justify-between text-sm">
							{walletClient ? (
								<span className="text-black/50">
								${usdcBalance.toFixed(2)} {t('可用', 'available', '利用可能')}
								</span>
							) : (
								<span /> // 占位以维持右侧对齐
							)}



							<div className="flex flex-col items-end">
								{/* 上方：免GAS费 */}
								<span className="text-xs text-black/50">
									{t("免GAS费", "No GAS fee", "ガス代無料")}
								</span>

								{/* 下方：实际到账 */}
								<span className={`font-medium ${error ? 'text-red-500' : 'text-black/80'}`}>
									{t('实际到账', 'Net amount', '実受取')} {netAmount.toFixed(2)} USDC
								</span>
							</div>
						</div>

						{error && (
							<div className="mt-1 text-xs text-red-500">
								{t('金额不能大于可用余额', 'Amount cannot exceed available balance', '金額は利用可能な残高を超えることはできません')}
							</div>
						)}

						<div
							role="button"
							onClick={handleClick}
							className={`
							mt-4 w-full text-center text-sm py-2 rounded-xl border border-black/20
							select-none transition
							${processingError
								? "bg-red-500/30 text-red-700 cursor-not-allowed"
								: processing
								? "bg-gray-100 text-gray-400 cursor-not-allowed"
								: netAmount <= 0
								? "bg-gray-100 text-gray-400 cursor-not-allowed"
								: "text-black/80 hover:bg-[#f0f0f0] cursor-pointer"
							}
							`}
						>
							{processingError
							? processingError
							: processing
							? t("处理中…", "Processing…", "処理中…")
							: walletClient
							? t("继续", "Continue", "続行")
							: t("请人代付", "Ask someone to pay", "他人に支払いを依頼")}
						</div>
					</div>

				</div>
		}
		{
			result && <>
					<div className="p-4 bg-white text-black rounded-2xl border border-black/5 shadow-sm">
						<h4 className="font-semibold text-sm text-center">
							{t("请分享下列链接给付款人", "Please share the following link with the payer", "以下のリンクを支払人に共有してください")}
						</h4>

						<div className="mt-4 space-y-3">
						

							{result.url && (
								<div>
									
									{/* <div className="text-xs uppercase text-black/60">
										{t("兑付链接", "Claim URL", "受け取りリンク")}
									</div> */}
									<div className="mt-1 break-all font-mono text-xs" style={{ color: "#c0c0c0ff" }}>
										{result.url}
									</div>

									{/* ✅ 主容器：二维码 + 钱包信息 + 操作按钮 */}
									<div className="mt-3 flex flex-col sm:flex-row items-center sm:items-start gap-4">
										
										{/* ✅ 二维码 */}
										<div className="border border-black/20 rounded-xl p-3 bg-white text-center">
											<QRCodeCanvas
												value={result.url}
												size={160}
												level="H"
												includeMargin={true}
												bgColor="#ffffff"
												fgColor="#000000"
												imageSettings={{
													src: cashcodeIcon,
													height: 42, // logo 大小
													width: 42,
													excavate: true,
												}}
												className="rounded-lg inline-block"
											/>

											{/* ✅ WALLET 与地址一行显示，紧贴二维码 */}
											<div className="flex justify-center items-center gap-1 text-[13px] mt-0 pt-0 leading-none">
												<span className="uppercase text-black/50 font-medium tracking-wider text-xs" style={{ color: "#c0c0c0ff" }}>
													WALLET
												</span>
												<span className="font-mono text-black/50 font-semibold text-xs" >
													{shortAddr(address)}
												</span>
											</div>
											
										</div>

										{/* 右侧：操作按钮 */}
										<div className="flex flex-col gap-2 items-stretch">
											<a
												href={result.url}
												className="border border-black/30 px-3 py-1 text-xs rounded-xl hover:bg-black/10 transition text-center text-black/80"
												target="_blank"
												rel="noreferrer"
											>
												{t("在新页打开", "Open in new tab", "新しいタブで開く")}
											</a>
											<button
												onClick={() => copy(result.url!)}
												className="border border-black/30 px-3 py-1 text-xs rounded-xl hover:bg-black/10 transition text-black/80"
											>
												{t("复制链接", "Copy Link", "リンクをコピー")}
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
			</>
		}
			
		</>
		
	)

}

export default AmountInput