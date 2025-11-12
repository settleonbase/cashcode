import { useState, useRef, useEffect } from "react"
import { makeT, type TranslateFn, type Lang } from "../util/i18n"

import { getAddress } from "ethers"

import ShowPaymentUrl from "./showPaymentLink"
import cashcodeIcon from '../assets/cashcode_icon.svg'
import AmountInput from './AmountInput'
import {shortAddr, pickApprovedProvider, getCCWallet, x402Payment} from '../util/utils'
import { Copy } from "lucide-react";  // ✅ Lucide 图标库
import NoteInput from './NoteInput'
import ConnectWallet from './ConnectWallet'

import Check,  { type CheckHandle } from './Check'

import { toWalletClient } from "../util/toWalletClient"
type TabKey = "check" | "link"

type ResultShape = {
	code?: string
	url?: string
} | null


// ==== Config (fill in real addresses before going live) ====
const BASE_CHAIN_ID_DEC = 8453 as const

type Props = {
	lang: Lang
	setDemoOpen: React.Dispatch<React.SetStateAction<boolean>>
	wallet?: string
	id?: string
	amt?: string
	note?: string
}



export default function cashcodeAPP ({ lang, setDemoOpen, wallet, amt, note }: Props) {

	const checkRef = useRef<CheckHandle>(null)
	const providerRef = useRef<any>(null)
	const t: TranslateFn = makeT(lang)
	const [ccAccount] = useState(getCCWallet())
	const [chainId, setChainId] = useState<number | null>(null)
	
	const [tab, setTab] = useState<TabKey>("check")
	const [amount, setAmount] = useState<string>("0.01")
	// const [token, setToken] = useState<"USDC" | "USDT">("USDC")

	const [nodeInput, setNodeInput ] = useState<string>('')

	const [result, setResult] = useState<ResultShape>(null)
	// const [showWalletOptions, setShowWalletOptions] = useState(false)
	const [accErr, setAccErr] = useState<string | null>(null)
	const debounceRef = useRef<number | undefined>(undefined)
	const [accountInput, setAccountInput] = useState<string>('')
	const [_, setWalletKind] = useState<string>('') // 新增状态以保存钱包类型

	const walletClientRef = useRef<any | null>(null)
	

	const onWConnect = (client: typeof toWalletClient) => {
		walletClientRef.current = client // ✅ 不触发 re-render
	}

	useEffect(() => {
		setResult(null)

	}, [tab])

	useEffect(() => {
		pickApprovedProvider()
	}, [])


    const rnd = (n: number): string => Math.random().toString(36).slice(2, 2 + n).toUpperCase()

	const revalidate = (val: string) => {
		const err = validateEvmAddress(val.trim());
		setAccErr(err);
	}

    const genLink = (): void => {
		const code = `LNK-${rnd(4)}-${rnd(4)}-${rnd(4)}`;
		const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app";
		const params = new URLSearchParams({ id: code, amt: amount, ccy: 'USDC', wallet: accountInput, note: encodeURIComponent(nodeInput), lang}).toString();
		const url = `${origin}/pay?${params}`;
		setResult({ code, url });
	}

	const onChangeAccount: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		const val = e.target.value;
		setAccountInput(val);

		// 1) 输入中：立即隐藏旧错误
		if (accErr) setAccErr(null);

		// 2) 停止输入 300ms 后重新评估
		if (debounceRef.current) window.clearTimeout(debounceRef.current);
		debounceRef.current = window.setTimeout(() => revalidate(val), 300) as any;
	}

	const onBlurAccount: React.FocusEventHandler<HTMLInputElement> = (e) => {
		// 3) 失焦时立刻评估一次（防止用户输入很快，没有触发 debounce 的情况）
		if (debounceRef.current) window.clearTimeout(debounceRef.current);
		revalidate(e.target.value);
	}

	const disconnectWallet = () => {
		// 清除钱包连接状态
		setAccountInput("")
		setChainId(null)

		// 若项目中还有 walletClient / provider，也可一并重置
		if (typeof window !== "undefined") {
		// 通知全局状态 / wagmi / 自定义事件
			window.dispatchEvent(new CustomEvent("wallet:disconnect"))
		}

	}

	
	/** 返回 null 表示合法，否则返回错误信息 */
	function validateEvmAddress(value: string): string | null {
		if (!value) return null						//		"Address is required";
		// 允许用户还在输入 0x 前缀时暂不判定为错误
		if (value === "0x") return "Incomplete address";

		// 基本格式检查
		if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return "Invalid address format";

		// 使用 ethers 做 EIP-55 校验（会抛错）
		try {
			getAddress(value); // 规范化/校验
		} catch {
			return "Invalid checksum";
		}
		return null;
	}

	const SelectWallet = () => {
		const [showConnectWallet, setShowConnectWallet] = useState(true)
		useEffect(() => {
			const eth = (window as any).ethereum;
			if (!eth) return;

			const onWConnected = async (e: any) => {
				const raw = e?.detail?.account || ""
				try {
					setAccountInput(getAddress(raw))  
				} catch { setAccountInput("") }
				providerRef.current = e?.detail?.provider || null  // ← 保存 provider
				
				const chainID = typeof e?.detail?.chainId === "number" ? e.detail.chainId : null
				setChainId(chainID)
				setWalletKind(e?.detail?.walletType || "")
				onWConnect(e?.detail?.walletClient)
				// if (chainID !== 8453 ) {
				// 	try {
				// 		await eth.request({
				// 			method: "wallet_switchEthereumChain",
				// 			params: [{ chainId: 8453 }], // Base Mainnet
				// 		});
				//    		setChainId(8453);
				// 	} catch (err) {
				// 	// 用户拒绝或钱包不支持时，保留原链，但后面会走公共 RPC 回退
				// 	}
				// }

				
			};

			const onWAcc = (e: any) => {
				const raw = e?.detail?.account || ""
				onWConnect(e?.detail?.walletClient)
				try {
					setAccountInput(getAddress(raw))  
				} catch { setAccountInput("") }
				providerRef.current = e?.detail?.provider || null  // ← 保存 provider

			};

			const onWDisc = () => {
				setAccountInput("")
				setChainId(null)
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
					{t("连接其他钱包", "Connect Other Wallet", "その他のウォレットを接続")}
				</button>
			}
				<ConnectWallet t={t} />
			</>
		)
	}

	const GenerateForm = () => {
		return (
			<>
				{/* 顶部标签栏 */}
				<div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
						{/* 左侧：标签按钮区或空占位 */}
						<div className="flex items-center gap-3 text-sm">
							{!result && (
								<>
									<button
										onClick={() => {
											setTab("check")
										}}
										className={`px-3 py-1 border rounded-full transition ${
											tab === "check"
												? "bg-[#f0f0f0f0] text-black border-black/60"
												: "border-black/10 text-black/30 hover:underline"
										}`}
									>
										{t("开支票", "Issue Check", "チェックを発行")}
									</button>
									<button
										onClick={() => {
											setTab("link")
											
										}}

										className={`px-3 py-1 border rounded-full transition ${
											tab === "link"
												? "bg-[#f0f0f0f0] text-black border-black/60"
												: "border-black/10 text-black/30 hover:underline"
										}`}
									>
										{t("收款链接", "Payment Link", "支払いリンク")}
									</button>
								</>
							)}
						</div>

						{/* 右侧：关闭按钮 */}
						<button
							onClick={() => setDemoOpen(false)}
							className="text-sm hover:underline text-black/70"
						>
							{t("关闭", "Close", "閉じる")}
						</button>
					</div>
				{/* 主体改为上下结构 */}
				<div className="p-5 space-y-5">

					{/* 上半部分：表单输入 */}
					{
						!result &&
							<div>
								

								{
									tab !== "check" && (
										<>

										<div className="mb-3 flex items-center justify-between text-xs">
											<label className="flex items-center gap-2">
												
												{t(
													"Base Mainnet USDC",
													"Base Mainnet USDC",
													"Base Mainnet USDC"
												)}
											</label>
											<div className="flex items-center gap-2">
												{accountInput && (
													// <button
													// 	onClick={connect}
													// 	className="border border-black px-2 py-1 rounded-md"
													// >
													// 	{t("连接钱包", "Connect Wallet", "ウォレット接続")}
													// </button>
												
													<div className="flex items-center justify-between gap-2 mt-1">
														
														<span className="text-black/60 text-xs">
															{
																ccAccount &&
																	<img
																		src={cashcodeIcon}
																		alt="Cashcode"
																		className="w-4 h-4 opacity-70"
																	/>
																
															}
															{accountInput.slice(0, 6)}…{accountInput.slice(-4)}{" "}
															{chainId !== BASE_CHAIN_ID_DEC &&
															t("(请切到 Base)", "(Switch to Base)", "(Base に切替)")}
														</span>

														<button
															onClick={() => {
															// 触发断开逻辑，可根据你的项目改为 disconnectWallet()
																if (typeof disconnectWallet === "function") disconnectWallet();
																else console.log("Disconnect clicked");
																setAccountInput('')
															}}
															className="text-xs text-black/60 border border-black/20 rounded-lg px-2 py-0.5 hover:bg-black hover:text-white transition"
														>
															Disconnect
														</button>
													</div>


												)}
											</div>
										</div>

											<NoteInput  setNote={setNodeInput} note={nodeInput} t={t} lang={lang} />

											<AmountInput amount={amount} setAmount={setAmount} lang={lang} t={t}/>
										</>
									)
								}



								{tab === "check" && (
									<Check lang={lang} ref={checkRef} ccAccount={ccAccount} />
								)}

								{tab !== "check" && (
									<div>
										<label className="block text-xs text-black/60 mt-3 mb-1">
											{t("钱包地址", "Wallet Address", "ウォレットアドレス")}
										</label>

										<input
											value={accountInput}
											onChange={onChangeAccount}
											onBlur={onBlurAccount}
											disabled={Boolean(result)}
											aria-invalid={!!accErr}
											aria-describedby="walletAddressError"
											className={
											"w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors " +
											(accErr
												? "border border-red-500 ring-1 ring-red-500"
												: "border border-black focus:ring-1 focus:ring-black")
											}
											placeholder="0x..."
											inputMode="text"
											autoComplete="off"
											spellCheck={false}
										/>

										{/* 错误提示 */}
										{accErr && (
											<p id="walletAddressError" className="mt-1 text-xs text-red-600">
												{accErr}
											</p>
										)}
										</div>
								)}

								{ (!accountInput && tab !== "check") ? (<SelectWallet />) : !result ? (
									
										tab !== "check" && 
											<button
												onClick={() => {
													setResult(null)
												
													genLink();
													
													setAccountInput('')

												}}
												className="mt-4 w-full border border-black px-3 py-2 text-sm hover:bg-black hover:text-white transition rounded-xl"
											>
												{
													t("生成收款链接", "Generate Payment Link", "支払いリンクを作成")
												}
											
											</button>
										
										
									): (<></>)
								}
							</div>
					}


					{/* 下半部分：Result / Share，仅在 result 存在时显示 */}
					{ result && 
						<ShowPaymentUrl t={t} account={ccAccount} result={result} />
					
					}
				</div>
			</>
		)
	}

	const ShowWalletComp = () => {
		const [showFull, setShowFull] = useState(false)
		const [copied, setCopied] = useState(false)

		  async function handleCopy() {
			if (!wallet) {
				return
			}
			try {
				await navigator.clipboard.writeText(wallet);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			} catch {
				alert("复制失败，请手动复制。")
			}
		}
		
		return (
			
			<div className="mb-3 text-xs">
				<div className="mb-3 flex items-center justify-between text-xs">
					
					<label className="flex items-center gap-2">
						{/* <input
						type="checkbox"
						checked={realMode}
						onChange={(e) => setRealMode(e.target.checked)}
						/>{" "} */}
						{t(
							"Base Mainnet USDC",
							"Base Mainnet USDC",
							"Base Mainnet USDC"
						)}
					</label>
					<div className="flex items-center gap-2">
						{accountInput && (
							// <button
							// 	onClick={connect}
							// 	className="border border-black px-2 py-1 rounded-md"
							// >
							// 	{t("连接钱包", "Connect Wallet", "ウォレット接続")}
							// </button>
							
							<div className="flex items-center justify-between gap-2 mt-1">
								<span className="text-black/60 text-xs">
									{accountInput.slice(0, 6)}…{accountInput.slice(-4)}{" "}
									{chainId !== BASE_CHAIN_ID_DEC &&
									t("(请切到 Base)", "(Switch to Base)", "(Base に切替)")}
								</span>

								<button
									onClick={() => {
									// 触发断开逻辑，可根据你的项目改为 disconnectWallet()
										if (typeof disconnectWallet === "function") disconnectWallet();
										else console.log("Disconnect clicked");
										setAccountInput('')
									}}
									className="text-xs text-black/60 border border-black/20 rounded-lg px-2 py-0.5 hover:bg-black hover:text-white transition"
								>
									Disconnect
								</button>
							</div>
						)}
					</div>
				</div>


				<label className="block text-xs text-black/60 mb-1">
					{t("收款人钱包地址", "Recipient's Address", "受取人のウォレットアドレス")}
				</label>

				{/* ✅ 输入框 + 复制按钮 */}
				<div className="flex items-center gap-2">
					<input
						value={showFull ? wallet : shortAddr(wallet)}
						onFocus={() => setShowFull(true)}
						onBlur={() => setShowFull(false)}
						readOnly
						className="w-full px-3 py-2 rounded-xl outline-none text-[12px] font-mono bg-gray-50 text-black transition-colors cursor-pointer"
						autoComplete="off"
						spellCheck={false}
					/>

					{/* ✅ Copy 按钮 */}
					<button
						onClick={handleCopy}
						className="p-2 rounded-xl border border-black/20 hover:bg-black hover:text-white transition flex items-center justify-center"
						title="复制钱包地址"
					>
						<Copy size={14} />
					</button>
				</div>

				{/* ✅ 复制反馈 */}
				{copied && (
					<div className="mt-1 text-[11px] text-green-600">
						{t("已复制", "Copied!", "コピーしました！")}
					</div>
				)}
			</div>
			
		)
	}

	const ShowNode = (nodeInfo?: string) => {
		const [showNodeInfo] = useState(nodeInfo)
		return (
			<div className="mb-3 text-xs">
				<label className="block text-xs text-black/60 mt-3 mb-1">
					{t("备注", "Notes", "メモ")}
				</label>
				<input
					value={showNodeInfo}
					readOnly
					className="w-full p-2 rounded-xl text-[13px] font-mono bg-gray-50 text-black outline-none cursor-default text-center"
				/>
			</div>
		)
	}

	const ShowAmount = () => {
		const [showAmt] = useState(amt)
		return (
			<div className="mb-3 text-xs">
				<label className="block text-xs text-black/60 mb-1">
					{t("金额", "Amount", "金額")}
				</label>
				<input
					value={showAmt}
					readOnly
					className="w-full p-2 rounded-xl border border-black/20 text-[13px] font-mono bg-gray-50 text-black outline-none cursor-default text-right"
				/>
			</div>
		)
	}

	const PayForm = () => {
		
		return (
			<>

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

				{/* 中间：标题（中、英、日） */}
				<div className="absolute left-1/2 -translate-x-1/2 text-center">
					<div className="text-sm font-medium leading-tight">
					{t("支付请求", "Payment Request", "支払いリクエスト")}
					</div>
				</div>

				{/* 右侧：关闭按钮 */}
				<button
					onClick={() => setDemoOpen(false)}
					className="text-sm hover:underline"
				>
					{t("关闭", "Close", "閉じる")}
				</button>
				</div>

				{/* 主体改为上下结构 */}
				<div className="p-5 space-y-5">
					<ShowWalletComp />
					{ShowNode(note)}
					<ShowAmount />
					{ !result ? (
						// 已连接：按 check / link 执行并显示对应文案
						<button
							onClick={() => {
								if (!wallet||!amt) {
									return
								}
								x402Payment(wallet, amt, ccAccount, walletClientRef.current)
							}}
							className="mt-4 w-full border border-black px-3 py-2 text-sm hover:bg-black hover:text-white transition rounded-xl"
						>
							{
								t("确认支付", "Confirm Payment", "支払いを確認する")
							}
							
							
						</button>
					): (<></>)}
				</div>

				
			</>
		)
	}

	return (
			<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
				{/* 外框整体圆角 */}
				<div className="w-full max-w-md bg-white text-black border border-black shadow-2xl rounded-3xl overflow-hidden">
					{
						wallet ? <PayForm /> : <GenerateForm />
					}
					
				</div>
			</div>

	)
}
 
