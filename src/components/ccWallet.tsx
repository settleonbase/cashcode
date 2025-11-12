


import cashcodeIcon from '../assets/cashcode_icon.svg'
// import ethIcon from '../assets/eth.png'
import usdcIcon from '../assets/usdc.png'
import baseIcon from '../assets/base-logo.png'
import { Copy } from 'lucide-react'
import metamask_icon from "../assets/metamask-icon.svg";
import coinbase_icon from "../assets/coinbase-icon.svg";
import okx_icon from "../assets/okx-icon.png";
import { useEffect, useState} from 'react'
import {getBalance} from '../util/utils'
import ConnectWallet from './ConnectWallet';
import { ethers } from 'ethers';
import AmountInput from './AmountInputNew'
import {type Lang} from '../util/i18n'
import base_ex from '../assets/base-ex.svg'

type Props = {
	address: string
	t: (cn: string, en: string, ja?: string) => string
	onPrimaryAction: () => void   // 点击地址胶囊
	lang: Lang
}

type balance= {
	usdc: string
	eth: string
	oracle: {
		bnb: string
		eth: string
		usdc: string
	}
}

type ResultShape = {
	code?: string
	url?: string

} 




const fmtUsd = (n = 0) => `$${n.toFixed(2)}`
const fmtAddr = (a = '') => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'

function SelectWallet({
	t,
	onConnected,
	onDisconnected
}: {
	t: (cn: string, en: string, ja?: string) => string
		onConnected: (addr: string, walletType: string, walletClient: any) => void
		onDisconnected: () => void
}) {
	const [showConnectWallet, setShowConnectWallet] = useState(true)

	useEffect(() => {
		const eth = (window as any).ethereum
		if (!eth) return

    const onWConnected = (e: any) => {
		const raw = e?.detail?.account || ""
		const walletType = e?.detail?.walletType || ""
		const walletClient = e?.detail?.walletClient
		try {
			onConnected(ethers.getAddress(raw), walletType, walletClient)
		} catch {
			onDisconnected()
		}
    }

    const onWAcc = (e: any) => {
		const raw = e?.detail?.account || ""
		const walletType = e?.detail?.walletType || ""
		const walletClient = e?.detail?.walletClient
		try {
			onConnected(ethers.getAddress(raw), walletType, walletClient)
		} catch {
			onDisconnected()
		}
    }

    const onWDisc = () => onDisconnected()

    window.addEventListener("wallet:connected", onWConnected as any)
    window.addEventListener("wallet:accountsChanged", onWAcc as any)
    window.addEventListener("wallet:disconnected", onWDisc as any)
    return () => {
      window.removeEventListener("wallet:connected", onWConnected as any)
      window.removeEventListener("wallet:accountsChanged", onWAcc as any)
      window.removeEventListener("wallet:disconnected", onWDisc as any)
    }
  }, [onConnected, onDisconnected])


  return (
    <>
      {showConnectWallet && (
		<div className="flex justify-end">
			<div
				role="button"
				onClick={() => {
					(window as any).openConnectWallet?.()
					window.dispatchEvent(new CustomEvent("wallet:openConnectModal"))
					setShowConnectWallet(false)
				}}
				className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 transition"
			>
				{t("通过其他钱包", "Via Other Wallet", "他のウォレット経由")}
			</div>
		</div>
 
      )}
      <ConnectWallet t={t} />
    </>
  )
}


export default function CcWallet({
	address,
	onPrimaryAction,
	t,
	lang
}: Props) {



	const [totalUsd, setTotalUsd] = useState(0)
	const [, setEthUsd] = useState(0)
	const [usdcUsd, setUsdcUsd] = useState(0)
	const [usdcAmount, setUsdcAmount] = useState(0)
	const [, setEthAmount] = useState(0)
	const [accountInput,setAccountInput] = useState('')
	const [walletClient, setWalletClient] = useState<any>(null)
	
	const [walletType, setWalletKind] = useState<string>('')
	const [tab, setTab] = useState<'crypto' | 'deposit' | 'withdraw'>('crypto')  // ← 提升到父组件
	const [result, setResult] = useState<ResultShape>()
	const [finishedPay, setFinishedPay] = useState('')

	const handleConnected = (addr: string, wtype: string, walletClient: any) => {
		setAccountInput(addr)
		if (/okx/i.test(wtype)) {
			wtype = 'okx'
		} else if (/coinbase/i.test(wtype)) {
			wtype = 'coinbase'
		} else if (/metamask/i.test(wtype)) {
			wtype = 'metamask'
		}
		setWalletKind(wtype)
		setWalletClient(walletClient)
	}

	const handleDisconnected = () => {
		setAccountInput('')
		setWalletKind('')
	}

	function CryptoTabs() {

		const [usdcBalance, setUsdcBalance] = useState(0)

		useEffect(() => {
			const fetchUsdcBalance = async () => {
				if (!accountInput) return
				const balance = await getBalance(accountInput)

				if (balance && balance.balance) {

					const usdc = Number(balance.balance.usdc)
					setUsdcBalance(usdc)
				}
			}
			fetchUsdcBalance()
		}, [accountInput])



		return (
			<div className="mt-6">
			{/* === Tabs Header === */}
			<div className="mt-6">
				<div className="flex items-center gap-6 text-sm font-semibold select-none">
				{[
					{ key: 'crypto', label: t('加密资产', 'Crypto Assets', '暗号化資産') },
					{ key: 'deposit', label: t('入金', 'Deposit', '入金') },
					{ key: 'withdraw', label: t('出金', 'Withdraw', '出金') },
				].map(({ key, label }) => (
					<div
						key={key}
						onClick={() => setTab(key as any)}  // ← 使用父组件的 setTab
						role="button"
						tabIndex={0}
						className={`relative pb-1 cursor-pointer outline-none ${
							tab === key ? 'text-[#2563eb]' : 'text-black/70'
						}`}
						style={{
							WebkitTapHighlightColor: 'transparent',
							background: 'transparent',
							border: 'none',
						}}
					>
					{label}
					{tab === key && (
						<span className="absolute left-0 right-0 -bottom-[2px] h-[2px] bg-[#2563eb] rounded-full" />
					)}
					</div>
				))}
				</div>
			</div>
			{/* === Tab Content === */}
			<div className="mt-6">
				{tab === 'crypto' && (
					<>
						<div className="mt-6 space-y-6">
							{/* USDC */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="relative">
										{usdcIcon ? (
											<img src={usdcIcon} alt="USDC" className="w-10 h-10 rounded-full" />
											) : (
											<div className="w-10 h-10 rounded-full bg-blue-200 grid place-items-center text-blue-900 font-bold">$</div>
										)}
										<img src={baseIcon} alt="Base" className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm" />
									</div>
									<div>
										<div className="text-lg">USDC</div>
										<div className="text-green-600 text-base">{t('可免费发送', 'Free to send', '無料で送金が可能')}</div>
									</div>
								</div>
								<div className="text-right">
									<div className="text-lg">{fmtUsd(usdcUsd)}</div>
									<div className="text-sm text-black/50">{usdcAmount.toFixed(2)} USDC</div>
								</div>
							</div>
						</div>
					</>
				)}

				{tab === 'deposit' && (
					<div className="text-sm text-black/60 mt-4">
						
						{
							finishedPay ? 
							<>
								<h4 className="font-semibold text-[22px] text-center text-[#2563eb]">
									{
										t("入金完成", "Deposit completed", "入金完了")
									}
								</h4>

								<div className="text-xs text-black/60 text-center mt-2">
									<span className="inline-flex items-center">
										{t("创建时间", "Created at", "作成日時")}：
											{new Date().toLocaleString(undefined, {
												year: "numeric",
												month: "2-digit",
												day: "2-digit",
												hour: "2-digit",
												minute: "2-digit",
												second: "2-digit",
											})}

										
											<a
												href={`https://basescan.org/tx/${finishedPay}`}
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
										
									</span>
								</div>

							</>
							: <>
								{
								//		connected local wallet APP
								accountInput && (
									<div className="flex justify-end">
										<button
											type="button"
											onClick={() => {
												navigator.clipboard.writeText(accountInput || '')
											}}
											className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 transition"
											>
											

											{walletType === 'metamask' && (
												<img src={metamask_icon} alt="metamask" className="w-4 h-4" />
											)}

											{walletType === 'okx' && (
												<img src={okx_icon} alt="okx" className="w-4 h-4" />
											)}

											{walletType === 'coinbase' && (
												<img src={coinbase_icon} alt="coinbase" className="w-4 h-4" />
											)}
											<span className="text-sm font-medium text-black/80">{fmtAddr(accountInput)}</span>
											<Copy size={18} className="text-black/60" />
										</button>
									</div>
								)
								}

								{
									!accountInput && !result && (
										
										<SelectWallet
											t={t}
											onConnected={handleConnected}
											onDisconnected={handleDisconnected}
										/>
									)
								}
								
								<AmountInput usdcBalance={usdcBalance} t={t} address={address} payAccount={accountInput} walletClient={walletClient} lang={lang} setResult={setResult} result={result} setFinishedPay={setFinishedPay} />
							
							</>
						}
						
						
					</div>
				)}

				{tab === 'withdraw' && (
					<div className="text-sm text-black/60 mt-4">
						<ConnectWallet t={t} />
					</div>
				)}
			</div>
			</div>
		)
	}

	const getBa = async () => {
		if (!address) return
		const _ba = await getBalance(address)
		if (!_ba || !_ba.balance) return
		const ba: balance = _ba.balance
		const eth = Number(ba.eth)
		const ethUsd = eth * Number(ba.oracle.eth)
		setEthUsd(ethUsd)
		setEthAmount(eth)

		const usdc = Number(ba.usdc)
		setUsdcAmount(usdc)
		const usdcUsd = usdc * Number(ba.oracle.usdc)
		setUsdcUsd(usdcUsd)
		const total = ethUsd + usdcUsd

		setTotalUsd(total)
	}

	useEffect(() => {
		getBa()
	}, [finishedPay])

  return (
    <div>
		{/* 顶部：地址胶囊 + 右侧主按钮 */}
		<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={() => {
						navigator.clipboard.writeText(address || '')
					}}
					className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 transition"
				>
					<img src={cashcodeIcon} alt="CC" className="w-4 h-4" />
					<span className="text-sm font-medium text-black/80">{fmtAddr(address)}</span>
					<Copy size={18} className="text-black/60" />
				</button>

				<button
					type="button"
					onClick={onPrimaryAction}
					className="text-xs px-2 py-1 rounded-lg border border-black/20 hover:bg-[#f0f0f0] transition"
				>
					X
				</button>
		</div>

		{/* 总资产 */}
		<div className="mt-5">
			<div className="text-4xl font-extrabold tracking-tight">${totalUsd.toFixed(2)}</div>
		</div>
		<CryptoTabs />
	</div>
  )
}

