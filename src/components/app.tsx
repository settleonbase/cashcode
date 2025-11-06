import { useState, useRef, useEffect } from "react"
import { makeT, type TranslateFn, type Lang } from "../util/i18n"

import { BrowserProvider, Contract, parseUnits, keccak256, hexlify, randomBytes, getAddress } from "ethers"

import { QRCodeCanvas } from "qrcode.react"
import cashcodeIcon from '../assets/cashcode_icon.svg'
import AmountInput from './AmountInput'
import {shortAddr, formatAmountReadable, pickApprovedProvider, type EIP1193Provider} from '../util/utils'
import { Copy } from "lucide-react";  // ✅ Lucide 图标库
import NoteInput from './NoteInput'
// import { wrapFetchWithPayment } from "x402-fetch"
import ConnectWallet from './ConnectWallet'
import { wrapFetchWithPayment } from "x402-fetch"


type TabKey = "check" | "link"

type ResultShape = {
	code?: string
	url?: string
} | null

type x402Response = {
	timestamp: string
	network: string
	payer: string
	success: boolean
	USDC_tx?: string
	SETTLE_tx?: string
}


  // Minimal ABIs
const ERC20_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
]

const CHECK_ABI = [
	"function issue(address token, uint256 amount, bytes32 hashlock, uint64 expiry) external",
]

function isApprovedProvider(p: any) {
	return !!(p?.isMetaMask || p?.isCoinbaseWallet || p?.isOkxWallet);
}

// ==== Config (fill in real addresses before going live) ====
const BASE_CHAIN_ID_DEC = 8453 as const
const USDC_BASE: string = (typeof process !== "undefined" && (process as any)?.env?.NEXT_PUBLIC_USDC_BASE) || "<FILL_USDC_ADDRESS_ON_BASE>"; // Base USDC address
const CHECK_CONTRACT: string = (typeof process !== "undefined" && (process as any)?.env?.NEXT_PUBLIC_CHECK_CONTRACT) || "<FILL_CHECK_CONTRACT_ADDRESS>"

//   // ==== Wallet & chain helpers ====

// Minimal EIP-1193 provider type for dapps

const getSigner = async () => {
    const provider = new BrowserProvider((window.ethereum as EIP1193Provider) as any);
    return await provider.getSigner()
}


type Props = {
	lang: Lang
	setDemoOpen: React.Dispatch<React.SetStateAction<boolean>>
	wallet?: string
	id?: string
	amt?: string
	note?: string
}


function showTermAlert(message: string, success = true, hash = "") {
	const alert = document.createElement("div");
	alert.className =
		"fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded border text-xs font-mono transition-opacity duration-300 flex items-center gap-2";
	// 强制在函数内设定可读的颜色（不改全局）
	if (success) {
		alert.style.background = "#0b1f0b";            // 深色底
		alert.style.borderColor = "#34d399";           // 绿边
		alert.style.color = "#a7f3d0";                 // 浅绿字
		alert.style.boxShadow = "0 0 12px rgba(52,211,153,.6)";
	} else {
		alert.style.background = "rgba(255,0,0,.1)";
		alert.style.borderColor = "#f87171";
		alert.style.color = "#fca5a5";
		alert.style.boxShadow = "0 0 12px rgba(255,0,0,.4)";
	}

	// 文本
	const text = document.createElement("span");
	text.textContent = message;
	alert.appendChild(text);

	// 成功时：追加可点击的 hash 链接（新窗口打开）
	if (success && hash) {
		const sep = document.createElement("span");
		sep.textContent = " · ";
		sep.style.opacity = "0.7";
		alert.appendChild(sep);

		const a = document.createElement("a");
		const trimmed =
		hash.length > 20 ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : hash;
		a.textContent = trimmed;
		a.href = `https://basescan.org/tx/${hash}`;
		a.target = "_blank";
		a.rel = "noopener noreferrer";
		a.style.textDecoration = "underline";
		a.style.cursor = "pointer";
		a.style.color = "#86efac"; // 更亮一点的链接色
		a.title = hash;
		alert.appendChild(a);
	}

	// 成功时：右侧关闭按钮 & 不自动淡出
	if (success) {
		const closeBtn = document.createElement("button");
		closeBtn.textContent = "×";
		closeBtn.className = "ml-2 px-2 text-sm font-bold rounded";
		closeBtn.style.color = "#a7f3d0";
		closeBtn.style.lineHeight = "1";
		closeBtn.style.cursor = "pointer";
		closeBtn.onmouseenter = () => (closeBtn.style.background = "rgba(255,255,255,0.08)");
		closeBtn.onmouseleave = () => (closeBtn.style.background = "transparent");
		closeBtn.onclick = () => {
		alert.style.opacity = "0";
		setTimeout(() => alert.remove(), 200);
		};
		alert.appendChild(closeBtn);
	}

	// 挂载
	document.body.appendChild(alert);
	alert.style.opacity = "1";

	// 失败时：自动淡出
	if (!success) {
		setTimeout(() => {
		alert.style.opacity = "0";
		setTimeout(() => alert.remove(), 300);
		}, 2400);
	}
}

export default function cashcodeAPP ({ lang, setDemoOpen, wallet, amt, note }: Props) {

	const providerRef = useRef<any>(null)
	const t: TranslateFn = makeT(lang)
	const [account, setAccount] = useState<string>('')
	const [chainId, setChainId] = useState<number | null>(null);
	const [pending, setPending] = useState<string | null>(null);
	const [txHash, setTxHash] = useState<string | null>(null);
	const [realMode] = useState<boolean>(true)
	
	const [tab, setTab] = useState<TabKey>("link")
	const [amount, setAmount] = useState<string>("10.00")
	// const [token, setToken] = useState<"USDC" | "USDT">("USDC")
	const [expiry, setExpiry] = useState<string>("7")
	const [nodeInput, setNodeInput ] = useState<string>('')

	const [result, setResult] = useState<ResultShape>(null)
	// const [showWalletOptions, setShowWalletOptions] = useState(false)
	const [accErr, setAccErr] = useState<string | null>(null)
	const debounceRef = useRef<number | undefined>(undefined)
	const [accountInput, setAccountInput] = useState<string>('')
	const [walletClient, setWwlletClient] = useState(null)
	const [_,setWalletProvider] = useState<EIP1193Provider|null>(null)



	useEffect(() => {
		const eth = providerRef.current;
		if (!eth?.request || !account || !isApprovedProvider(eth)) return

		let unsub: (() => void) | undefined

		return () => {
			if (unsub) unsub()
		}

	}, [account, chainId])

	const copy = async (text: string): Promise<void> => {
		try {
		await navigator.clipboard.writeText(text);
		} catch {
		// noop
		}
	}

    useEffect(() => {
		if (account) {
			setAccountInput(account)
			setAccErr(null)
			
		}
	}, [account])

	useEffect(() => {
		setResult(null)

	}, [tab])

	useEffect(() => {

		pickApprovedProvider()
		
	},[])



	const ensureAllowance = async (owner: string, tokenAddr: string, spender: string, amountBn: bigint): Promise<void> => {
			const signer = await getSigner();
			const erc20 = new Contract(tokenAddr, ERC20_ABI, signer);
			const current = (await erc20.allowance(owner, spender)) as bigint;
			if (current < amountBn) {
			const tx = await erc20.approve(spender, amountBn);
			setPending(t("授权 USDC 中…", "Approving USDC…", "USDC を承認中…"));
			const rc = await tx.wait();
			void rc; // silence unused var in some TS configs
			setPending(null);
			}
	}


	

    // ==== On-chain: Issue Check on Base ====
  	const issueCheckOnChain = async (): Promise<void> => {
		

		// if (token !== "USDC") throw new Error(t("先支持 Base 上 USDC", "USDC on Base only for now", "まずはBase上のUSDCに対応"));
		if (!CHECK_CONTRACT || CHECK_CONTRACT.startsWith("<")) throw new Error(t("请配置 CHECK_CONTRACT 地址", "Please configure CHECK_CONTRACT address", "CHECK_CONTRACT を設定してください"));
		if (!USDC_BASE || USDC_BASE.startsWith("<")) throw new Error(t("请配置 USDC 地址", "Please configure USDC address", "USDC アドレスを設定してください"));

		const signer = await getSigner();
		const amt = parseUnits(amount, 6); // USDC has 6 decimals (bigint)

		// Generate secret S & hash H
		const secretBytes = randomBytes(32);
		const secret = hexlify(secretBytes); // 0x...
		const H = keccak256(secretBytes);
		const now = Math.floor(Date.now() / 1000);
		const expSecs = (now + parseInt(expiry || "7", 10) * 86400) as unknown as bigint; // contract expects uint64 but ethers auto-casts from number/bigint

		// Ensure allowance then call issue
		await ensureAllowance((await signer.getAddress()) as string, USDC_BASE, CHECK_CONTRACT, amt);

		const check = new Contract(CHECK_CONTRACT, CHECK_ABI, signer);
		setPending(t("开支票上链中…", "Issuing check on-chain…", "オンチェーンでチェックを発行中…"));
		const tx = await check.issue(USDC_BASE, amt, H, expSecs);
		const rc = await tx.wait();
		setPending(null);
		setTxHash((rc as any)?.hash ?? (tx as any)?.hash ?? null);

		// Build code & URL
		const humanCode = `CHK-${secret.slice(2, 10).toUpperCase()}-${secret.slice(10, 18).toUpperCase()}`;
		const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app";
		const claimUrl = `${origin}/claim#${secret}`; // using secret for real claim
		setResult({ code: humanCode, url: claimUrl });
	}



	const x402Payment = async (recipient: string, amt: string ) => {

		if (!account|| !walletClient) {
			(window as any).openConnectWallet?.()
			window.dispatchEvent(new CustomEvent("wallet:openConnectModal"))
			return
		}

		
		
		const params = new URLSearchParams({ amt, ccy: 'USDC', wallet: recipient}).toString()
		const path = `/api/settle?${params}`
		try {

			const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient)
		
			// const remote = "https://api.settleonbase.xyz" + path
			const local = "http://localhost:4088" + path
			const response = await fetchWithPayment(
				local, {
				method: 'GET'
			});


			if (response?.ok) {
				const data: x402Response = await response.json()


				showTermAlert("✅", true, data.USDC_tx)

				console.log("Purchase success:", response)

			} else {
				showTermAlert("Response error", false);
				console.log("❌ Response error:", response);
			}
		} catch (ex: any) {
			showTermAlert("Response error", false);
			console.log(ex.message)
		}
		

	}


    const rnd = (n: number): string => Math.random().toString(36).slice(2, 2 + n).toUpperCase()
	const genCheck = (): void => {
		const code = `CHK-${rnd(4)}-${rnd(4)}-${rnd(4)}`;
		const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app";
		const url = `${origin}/claim#${code}`;
		setResult({ code, url });
	};

	 const revalidate = (val: string) => {
		const err = validateEvmAddress(val.trim());
		setAccErr(err);
	};

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
		setAccount("");
		setChainId(null);

		// 若项目中还有 walletClient / provider，也可一并重置
		if (typeof window !== "undefined") {
		// 通知全局状态 / wagmi / 自定义事件
			window.dispatchEvent(new CustomEvent("wallet:disconnect"));
		}

	};

	
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
				const accs = e?.detail?.account || ""
				setAccount(accs)
				const chainID = typeof e?.detail?.chainId === "number" ? e.detail.chainId : null
				setChainId(chainID)
				const provider: EIP1193Provider = e?.detail?.provider||null
				if (provider ) {
					setWalletProvider(provider)
				}
				setWwlletClient(e?.detail?.walletClient)
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
				const accs = e?.detail?.account || ""
				setWwlletClient(e?.detail?.walletClient)
				setAccount(accs)
				const provider: EIP1193Provider = e?.detail?.provider||null
				if (provider ) {
					setWalletProvider(provider)
				}
			};

			const onWDisc = () => {
				setAccount("");
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
		}, []);
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
				
				<ConnectWallet />
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
						{ !result && (
						<>
							<button
								onClick={() => {
									// setTab("check")
								}}
								className={`px-3 py-1 border rounded-full transition ${
									tab === "check" ? "bg-black text-white" : "border-black"
								}`}
							>
								{t("开支票(即将推出)", "Issue Check(Coming Soon)", "チェックを発行(近日公開)")}
							</button>
							<button
								onClick={() => {
									setTab("link")
									setAccountInput(account)
								}}
								className={`px-3 py-1 border rounded-full transition ${
									tab === "link" ? "bg-black text-white" : "border-black"
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
						className="text-sm hover:underline"
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
								<div className="mb-3 flex items-center justify-between text-xs">
									<label className="flex items-center gap-2">
										
										{t(
											"Base Mainnet USDC",
											"Base Mainnet USDC",
											"Base Mainnet USDC"
										)}
									</label>
									<div className="flex items-center gap-2">
										{account && (
											// <button
											// 	onClick={connect}
											// 	className="border border-black px-2 py-1 rounded-md"
											// >
											// 	{t("连接钱包", "Connect Wallet", "ウォレット接続")}
											// </button>
										
											<div className="flex items-center justify-between gap-2 mt-1">
												<span className="text-black/60 text-xs">
													{account.slice(0, 6)}…{account.slice(-4)}{" "}
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

								{/* <label className="block text-xs text-black/60 mb-1">
								{t("币种", "Token", "トークン")}
								</label> */}

									


								
								<NoteInput  setNote={setNodeInput} note={nodeInput} t={t} lang={lang} />

								<AmountInput amount={amount} setAmount={setAmount} lang={lang} formatAmountReadable={formatAmountReadable} t={t}/>


								{tab === "check" && (
									<>
										<label className="block text-xs text-black/60 mt-3 mb-1">
											{t("有效期（天）", "Expiry (days)", "有効日数")}
										</label>
										<input
											value={expiry}
											onChange={(e) => setExpiry(e.target.value)}
											className="w-full border border-black px-3 py-2 text-sm rounded-xl"
										/>
									</>
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

								{ (!account && !accountInput) ? (<SelectWallet />) : !result ? (
										// 已连接：按 check / link 执行并显示对应文案
										<button
											onClick={() => {
												setResult(null)
												setTxHash(null)

												if (tab === "check") {
													realMode ? void issueCheckOnChain() : genCheck();
												} else {
													genLink();
												}
												setAccountInput('')

											}}
											className="mt-4 w-full border border-black px-3 py-2 text-sm hover:bg-black hover:text-white transition rounded-xl"
										>
											{tab === "check"
											? t("生成支票码", "Generate Check Code", "チェックコードを作成")
											: t("生成收款链接", "Generate Payment Link", "支払いリンクを作成")}
										</button>
									): (<></>)
								}

								<p className="mt-2 text-xs text-black/60">
								{/* {
									tab === "check"
										? realMode
										? t(
											"将发起真实链上交易：授权 USDC（如需）并调用 Check.issue。请确认钱包弹窗。",
											"This will send real on-chain tx: approve USDC (if needed) then Check.issue. Confirm in wallet.",
											"実際のオンチェーン取引を実行：必要に応じてUSDC承認→Check.issueを呼び出し。ウォレットで確認してください。"
											)
										: t(
											"此为前端演示，不会上链。实际版本将使用 Hashlock+Timelock 合约并支持 0 Gas 兑付。",
											"Demo only; real version uses Hashlock+Timelock contracts and 0-gas claims.",
											"これはデモです。実運用ではHashlock+Timelockコントラクトとガス代ゼロ受け取りに対応します。"
											)
										: t(
											"此为前端演示，支付将走模板化意图签名与 Paymaster 白名单。",
											"Demo only; real payments sign template intents with Paymaster whitelist.",
											"これはデモです。実際の支払いはテンプレート化インテント署名とPaymasterホワイトリストで行います。"
										)
									} */}
								</p>
								{pending && <div className="mt-2 text-xs text-black">{pending}</div>}
								{txHash && (
									<div className="mt-2 text-xs">
										<span className="text-black/60">TX:</span>{" "}
										<a
										className="underline"
										href={`https://basescan.org/tx/${txHash}`}
										target="_blank"
										rel="noreferrer"
										>
										{txHash.slice(0, 10)}…
										</a>
									</div>
								)}
							</div>
					}


					{/* 下半部分：Result / Share，仅在 result 存在时显示 */}
					{result && (
						<div className="p-4 bg-white text-black rounded-2xl border border-black/5 shadow-sm">
							{/* <h4 className="font-semibold text-sm">
							{t("结果 / 分享", "Result / Share", "結果 / 共有")}
							</h4> */}

							<div className="mt-4 space-y-3">
								{result.code && tab === "check" && (
									
									
											<>
												<div className="text-xs uppercase text-black/60">
													{t(
														"支票代码（分享给收款人）",
														"Check Code (share with payee)",
														"チェックコード（受取人に共有）"
													)}
												</div>
												<div className="mt-1 font-mono text-lg tracking-wider">
													{result.code}
												</div>

												<button
													onClick={() => copy(result.code!)}
													className="mt-2 border border-black px-3 py-1 text-xs rounded-xl hover:bg-black hover:text-white transition"
												>
													{t("复制代码", "Copy Code", "コードをコピー")}
												</button>
											</>
											
									
								)}

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
											{/* 左侧：二维码（带中心LOGO）+ WALLET信息 */}
											
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
																{shortAddr(account)}
															</span>
														</div>
													
												</div>

												
											

												{/* 右侧：操作按钮 */}
												<div className="flex items-center gap-2">
													<a
														href={result.url}
														className="border border-black px-3 py-1 text-xs rounded-xl hover:bg-black hover:text-white transition text-center"
														target="_blank"
														rel="noreferrer"
													>
														{t("在新页打开", "Open in new tab", "新しいタブで開く")}
													</a>
													<button
														onClick={() => copy(result.url!)}
														className="border border-black px-3 py-1 text-xs rounded-xl hover:bg-black hover:text-white transition"
													>
														{t("复制链接", "Copy Link", "リンクをコピー")}
													</button>
												</div>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
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
						{account && (
							// <button
							// 	onClick={connect}
							// 	className="border border-black px-2 py-1 rounded-md"
							// >
							// 	{t("连接钱包", "Connect Wallet", "ウォレット接続")}
							// </button>
						
							<div className="flex items-center justify-between gap-2 mt-1">
								<span className="text-black/60 text-xs">
									{account.slice(0, 6)}…{account.slice(-4)}{" "}
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
					{ !account ? (<SelectWallet />) : !result ? (
						// 已连接：按 check / link 执行并显示对应文案
						<button
							onClick={() => {
								if (!wallet||!amt) {
									return
								}
								x402Payment(wallet, amt)
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
 
