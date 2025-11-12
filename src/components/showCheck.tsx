import { useMemo, useRef, useState, useEffect, forwardRef } from "react"
import {formatAmountReadable, formatWithThousands} from '../util/utils'
import {type Lang } from '../util/i18n'
import HumanReadableAmount from './HumanReadableAmount'
import ConnectWallet from './ConnectWallet'
import {ethers} from 'ethers'
import cashcodeIcon from '../assets/cashcode_icon.svg'
import noteMemo from '../util/ABI/noteMemo.ABI.json'
import WalletInput from './walletInput'
import base_ex from '../assets/base-ex.svg'

const provider = new ethers.JsonRpcProvider('https://mainnet-rpc.conet.network')
const noteMemo_addr = '0xB8c526aC40f5BA9cC18706efE81AC7014A4aBB6d'
const noteDataSC = new ethers.Contract(noteMemo_addr, noteMemo, provider)
type Props = {
	lang: Lang
	codeHash: string
	t: (cn: string, en: string, ja?: string) => string
	account: string
	setDemoOpen: React.Dispatch<React.SetStateAction<boolean>>
}
type CheckValues = {
	amount: string
	secureCode: string;
	note: string
}


type memo = {

	from: string
	successAuthorizationHash: string
	chianID: bigint
	erc3009Address: string
	node: string
	amount: bigint
	decimals: bigint
	createTimestamp: bigint
	depositHash: string
	depositTimestamp: string
}



export type CheckHandle = {
	/** 立即获得当前值 */
	getValues: () => CheckValues
	/** 方便外部把焦点放到金额输入框 */
	focusAmount: () => void
	
}

const ShowCheck = forwardRef<CheckHandle, Props>(function ShowCheck({
	lang,
	codeHash,
	t: tProp,
	setDemoOpen
}: Props) {

	const _codeHash = codeHash?.trim() ?? ''

	const SelectWallet = () => {
		const [showConnectWallet, setShowConnectWallet] = useState(true)
		useEffect(() => {
			const eth = (window as any).ethereum;
			if (!eth) return;

			const onWConnected = async (e: any) => {
				const raw = e?.detail?.account || ""
				try {
					setUserWallet(ethers.getAddress(raw))  
					setUserWalletInput(ethers.getAddress(raw))
				} catch { 
					setUserWallet("") 
					setUserWalletInput('')
				}
				onWConnect(e?.detail?.walletClient)
				providerRef.current = e?.detail?.provider || null  // ← 保存 provider

			}

			const onWAcc = (e: any) => {
				const raw = e?.detail?.account || ""
				try {
					setUserWallet(ethers.getAddress(raw))  
					setUserWalletInput(ethers.getAddress(raw))
				} catch { 
					setUserWallet("")
					setUserWalletInput('') 
				}
				onWConnect(e?.detail?.walletClient)
				providerRef.current = e?.detail?.provider || null  // ← 保存 provider
			};

			const onWDisc = () => {
				setUserWallet("")
				setUserWalletInput('')
			};
			
			window.addEventListener("wallet:connected", onWConnected as any);
			window.addEventListener("wallet:accountsChanged", onWAcc as any);
			// window.addEventListener("wallet:chainChanged", onWChain as any);
			window.addEventListener("wallet:disconnected", onWDisc as any);

			return () => {

				window.removeEventListener("wallet:connected", onWConnected as any);
				window.removeEventListener("wallet:accountsChanged", onWAcc as any);
				window.removeEventListener("wallet:disconnected", onWDisc as any);
			};
		}, [])

		return (
			<>
			{
				showConnectWallet &&
				<button
					onClick={() => {
						(window as any).openConnectWallet?.()
						window.dispatchEvent(new CustomEvent("wallet:openConnectModal"))
						setShowConnectWallet(false)

					}}
					className="mt-4 w-full border border-black px-3 py-2 text-sm hover:bg-black hover:text-white transition rounded-xl"
				>
					{t("连接钱包", "Connect Wallet", "ウォレット接続")}
				</button>
			}
				
				<ConnectWallet t={t} />
			</>
		)
	}

	const providerRef = useRef<any>(null)

	const t =
		tProp ??
			((cn: string, en: string, ja?: string) => {
			if (lang === "cn") return cn
			if (lang === "en") return en
			return ja ?? en
		})


	const walletClientRef = useRef<any | null>(null)

	const onWConnect = (client: any) => {
		walletClientRef.current = client // ✅ 不触发 re-render
	}
	const [amount, setAmount] = useState('')
	const [secureCode, setSecureCode] = useState<string>("")
	const [redeemCode, setRedeemCode] = useState<string>("")
	const [redeemError, setRedeemError] = useState("")
	const [showSecureCodeInput, setShowSecureCodeInput] = useState(false)
	const [verifying, setVerifying] = useState(false)
	const [verifySuccess, setVerifySuccess] = useState(false)
	const [currency, ] = useState<string>("")

	const [createTimestamp, setCreateTimestamp] = useState(0)
	const [note, setNote] = useState<string>(
		t("这是使用Cashcode的收款测试", "This is a Cashcode payment test", "これはCashcodeの支払いテストです")
	)
	const [secureError, setSecureError] = useState<string>("")

	const inputRef = useRef<HTMLInputElement | null>(null)
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const [userWallet, setUserWallet] = useState('')
	const [userWalletInput, setUserWalletInput] = useState('')

	const [redeeming, setRedeeming] = useState(false)
	const [redeemFailed, setRedeemFailed] = useState(false)
	const [depositBaseHash, setDepositBaseHash] = useState('')
	const [successAuthorizationHash, setSuccessAuthorizationHash] = useState('')
	const [successTimestamp, setSuccessTimestamp] = useState(0)

	useEffect(() => {
		getData()
	}, [_codeHash])


	const parsed = useMemo(() => Number(amount.replace(/,/g, "")), [amount])

	const readable = useMemo(() => {
		const result = formatAmountReadable(Number(parsed || 0), lang, currency)
		return result
	}, [parsed, lang, currency])

	const getNet = (_value: number|string) => {
		const amt = Number(String(_value).replace(/,/g, "")) || 0
		const feeVal = amt <= 20 ? 0.10 : amt * 0.005
		const netVal = Math.max(amt - feeVal, 0)
		return netVal.toFixed(2)

	}

	const getData = async () => {
		if (!_codeHash || !/^0x[0-9a-fA-F]{64}$/.test(_codeHash)) return
		
		try {
			const data: memo = await noteDataSC.checkMemo(_codeHash)
			
			const _Amount = ethers.formatUnits(data.amount, data.decimals)
			const _net = getNet(_Amount)
			setAmount(formatWithThousands(_net))
			const notes = data.node
			setNote(notes)
			const ms = Number(data.createTimestamp) * 1000   // BigInt -> number(ms)
			const succHash = data.depositHash
			if (succHash !== ethers.ZeroHash ) {
				setSuccessAuthorizationHash(succHash)
			}
			setDepositBaseHash(data.successAuthorizationHash)

			
			const msSuccessTimestamp = Number(data.depositTimestamp) * 1000 
			setSuccessTimestamp(msSuccessTimestamp)

			setCreateTimestamp(ms)

		} catch (ex: any) {

		}
	}

	const handleVerifyRedeem = async () => {
		setRedeemError("")
		if (verifying) return
		setVerifying(true)
		checkRedeemCode()
	}

	const RedeemError = () => {
		setRedeeming(false)
		setRedeemFailed(true)
		setTimeout(() => setRedeemFailed(false), 4000) // 2秒后隐藏
	}

	const checkRedeemCode = () => {
		const preHash = ethers.solidityPackedKeccak256(['string'], [redeemCode+secureCode.replace('-','')])
		if (preHash === codeHash) {
			return setVerifySuccess(true)
		}
		setShowSecureCodeInput(true)
		setVerifying(false)
		setRedeemError(t(
			"兑换码有误，或需要输入安全码",
			"Invalid redeem code, or security code required",
			"引き換えコードが無効、またはセキュリティコードの入力が必要です"
		))
	}

	const handleRedeem = async () => {
		if (redeeming) return
		setRedeeming(true)
		setRedeemFailed(false)
		let _codeNumber = ''
		if (secureCode) {
			_codeNumber = secureCode.replace('-','')
		}
		
		const paramsRemote = new URLSearchParams({
			code: redeemCode+_codeNumber,
			address: userWallet
		}).toString()
		const isLocal = false

		const remote = isLocal? `http://localhost:4088/api/cashCodeCheck?${paramsRemote}`:`https://api.settleonbase.xyz/api/cashCodeCheck?${paramsRemote}`

		try {
			const res = await fetch(remote, { method: 'GET' })

			// 网络请求返回非200
			if (!res.ok) {
				console.error(`Redeem failed: HTTP ${res.status}`)
				setRedeemFailed(true)
				RedeemError()
				return
			}

			// 解析返回JSON
			const data = await res.json()
			console.log('Redeem response:', data)

			// 判断业务逻辑
			if (data?.success) {

				getData()
				
			} else {
				// 后端返回的错误信息
				console.warn('Redeem error:', data?.message || 'Unknown error')
				setRedeemFailed(true)
				RedeemError()
			}
		} catch (e) {
			console.error('Redeem exception:', e)
			setRedeemFailed(true)
			RedeemError()

		} finally {
			setRedeeming(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
			<div className="w-full max-w-md bg-white text-black border border-black shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-screen">
				<div className="relative overflow-hidden rounded-3xl border border-black/40 p-5 md:p-6 max-w-md">
					{/* 顶部标签栏 */}
					<div className="relative flex items-center justify-between border-b border-black/10 px-4 py-3">
						{/* 左侧：icon */}
						<div className="flex items-center gap-2">
							<img
								src={cashcodeIcon}
								alt="Cashcode"
								className="w-5 h-5 object-contain"
							/>
						</div>

						{/* 居中标题：使用 absolute 精准居中 */}
						<h2 className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold text-black/80">
							{t("CashCode 支票", "CashCode Check", "CashCode チェック")}
						</h2>

						{/* 右侧：关闭按钮 */}
						<button
							onClick={() => setDemoOpen(false)}

							className="text-sm hover:underline"
						>
							{t("关闭", "Close", "閉じる")}
						</button>
					</div>
				{
				
					<div className={`rounded-3xl p-5 md:p-6 max-w-md`}>
						
						
						{
							!successTimestamp && 
							<>
								<div className="mt-4">
							
							
						
							{/* 兑换码输入框 +（22位时）检测按钮 */}
							<div className="relative flex items-center">
								<input
									value={redeemCode}
									onChange={(e) => {
										if (verifySuccess) return 
										const filtered = e.target.value.replace(/[^0-9A-Za-z]/g, "")
										setRedeemCode(filtered.slice(0, 22))
									}}
									inputMode="text"
									readOnly={verifySuccess}
									type="text"
									style={{ fontSize: "16px", textAlign: "center", transition: "all 0.2s ease" }}
									className="
										w-full bg-transparent outline-none
										leading-none font-semibold tracking-wide text-slate-800
										border-0 border-b border-black/20 pb-2
										focus:border-black/50 transition-colors
										pr-20
										placeholder:font-semibold placeholder:tracking-wide
										placeholder:text-black/30 placeholder:leading-none placeholder:text-center
									"
									placeholder={t("输入兑换码", "Enter redeem code", "引き換えコードを入力")}
								/>

								
								{verifySuccess ? (
								
								<div
									className="
									absolute right-2 top-1/2 -translate-y-1/2 -mt-[10px]
									text-green-600 flex items-center justify-center
									"
								>
									<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="w-5 h-5"
									>
									<path d="M20 6L9 17l-5-5" />
									</svg>
								</div>
								) : (
								// 🔍 检测按钮
								<button
									type="button"
									onClick={async () => {
									if (redeemCode.length !== 22 || verifying) return
										handleVerifyRedeem()
									}}
									disabled={redeemCode.length !== 22 || verifying}
									className={`
										absolute right-2 top-1/2 -translate-y-1/2 -mt-[10px]
										text-sm transition-opacity
									${redeemCode.length === 22 ? "text-black/70 hover:underline" : "text-black/30 cursor-default"}
									`}
								>
									{verifying ? t("检测中…", "Verifying…", "検証中…") : t("检测", "Verify", "検証")}
								</button>
								)}
							</div>

							{/* 错误信息显示区域 */}
							{redeemError && (
								<div className="mt-1 text-xs text-red-600 text-center w-full">{redeemError}</div>
							)}
						</div>
						{/* 安全码输入框 */}
						{
							showSecureCodeInput &&
								<div className="mt-4">
									<input
										type="text"
										inputMode="numeric"
										pattern="\d*"
										maxLength={7} // 允许中间出现一个减号
										value={secureCode}
										readOnly={verifySuccess}
										onChange={(e) => {
											if (verifySuccess) return
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
											w-full
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
						}
							</>
						}
	
									

								{/* 金额输入 + 人类可读 */}
								<div
									ref={wrapperRef}
									className="relative rounded-xl
										bg-[repeating-linear-gradient(0deg,#cde5ff_0_1px,transparent_1px_12px)]
										bg-[length:100%_12px] p-4"
								>
									{/* 红色印章风格 PAID 标签 */}
									{successAuthorizationHash && (
										<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
											<span
												className="px-6 py-2 text-3xl font-extrabold uppercase tracking-widest
												text-red-600 border-4 border-red-600 rounded-xl
												bg-red-50 backdrop-blur-sm
												rotate-[-10deg] shadow-md opacity-20 select-none"
											>
												{t("已存入", "Deposited", "入金済み")}
											</span>
										</div>
									)}

									{/* 金额显示 */}
									<input
										ref={inputRef}
										value={amount}
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

									<HumanReadableAmount readable={readable} lang={lang} />
								</div>
						
						{/* 备注输入栏 */}
						<div className="mb-4">
							<label className="block text-xs text-black/60 mb-1">
								{t("备注", "Notes", "メモ")}
							</label>
							<input
								type="text"
								readOnly
								value={note}
								className="
									w-full border-0 border-b border-black/20
									bg-transparent outline-none
									text-sm text-slate-800 pb-1
									placeholder-black/30
									focus:border-black/50 transition-colors
								"
							/>
						</div>


						{createTimestamp > 0 && (
							<div className="text-xs text-black/60 text-right mt-2">
								<span className="inline-flex items-center">
									{t("创建时间", "Created at", "作成日時")}：
										{new Date(createTimestamp).toLocaleString(undefined, {
											year: "numeric",
											month: "2-digit",
											day: "2-digit",
											hour: "2-digit",
											minute: "2-digit",
											second: "2-digit",
										})}

									{depositBaseHash && /^0x[0-9a-fA-F]{64}$/.test(depositBaseHash) && (
										<a
										href={`https://basescan.org/tx/${depositBaseHash}`}
										target="_blank"
										rel="noreferrer"
										className="ml-2 inline-flex items-center justify-center rounded-md border border-blue-500 px-1.5 py-0.5 hover:bg-blue-600 hover:text-white transition"
										aria-label={t("查看交易", "View on BaseScan", "BaseScanで表示")}
										title={t("查看交易", "View on BaseScan", "BaseScanで表示")}
										>
										<img src={base_ex} alt="" className="w-4 h-4" />
										<span className="sr-only">
											{t("查看交易", "View on BaseScan", "BaseScanで表示")}
										</span>
										</a>
									)}
								</span>
							</div>
						)}

						{!!successTimestamp && (
							<div className="text-xs text-black/60 text-right mt-2">
								<span className="inline-flex items-center">
									{t("兑换时间", "Redeeming at", "引き換え日時")}：
									{new Date(successTimestamp).toLocaleString(undefined, {
										year: "numeric",
										month: "2-digit",
										day: "2-digit",
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit",
									})}

									{successAuthorizationHash && /^0x[0-9a-fA-F]{64}$/.test(successAuthorizationHash) && (
										<a
										href={`https://basescan.org/tx/${successAuthorizationHash}`}
										target="_blank"
										rel="noreferrer"
										className="ml-2 inline-flex items-center justify-center rounded-md border border-blue-500 px-1.5 py-0.5 hover:bg-blue-600 hover:text-white transition"
										aria-label={t("查看交易", "View on BaseScan", "BaseScanで表示")}
										title={t("查看交易", "View on BaseScan", "BaseScanで表示")}
										>
										<img src={base_ex} alt="" className="w-4 h-4" />
										<span className="sr-only">
											{t("查看交易", "View on BaseScan", "BaseScanで表示")}
										</span>
										</a>
									)}
								</span>
							</div>
							)}



						{	verifySuccess && !successAuthorizationHash &&
							<>
								<div className="mt-4">
									<WalletInput t={t}
									value={userWalletInput}
									onChange={(e) => {
										 const val = e.currentTarget.value.trim()
										if (ethers.isAddress(val)) {
											setUserWallet(val)
										} else {
											setUserWallet('')
										}
										setUserWalletInput(e.target.value.trim())
									}}

									 />
									
								</div>
								{ !userWallet && <SelectWallet />}
								{
									userWalletInput && 
									<>
										<button
											onClick={handleRedeem}
											disabled={redeeming||redeemFailed}
											className={`
												mt-4 w-full text-sm py-2 rounded-xl transition-colors
												${
												redeeming
													? "text-gray-400 cursor-not-allowed"
													: redeemFailed
													? "bg-red-100 text-red-700 cursor-not-allowed"
													: "text-black/70 hover:underline"
		}
											`}
										>

										{redeeming
											? t("兑换中…", "Redeeming…", "引き換え中…") : redeemFailed ?
											 t("兑换失败，请稍后再试",
												"Redeem failed, please try again later",
												"引き換えに失敗しました。後でもう一度お試しください")
											: t("兑换", "Redeem", "引き換え")
										}
										</button>
									</>
								}
							</>
							
						}
						
					</div>
				}
				
				</div>
			</div>
		</div>
	)
})


export default ShowCheck
