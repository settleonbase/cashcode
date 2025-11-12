// src/components/ConnectWallet.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import metamask_icon from "../assets/metamask-icon.svg";
import coinbase_icon from "../assets/coinbase-icon.svg";
import okx_icon from "../assets/okx-icon.png";
// import { pickByRDNS } from "../util/eip6963";
import { toWalletClient } from "../util/toWalletClient";
import cash_icon from '../assets/cashcode_icon.svg'

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function metamaskDeeplinkForThisPage() {
  return `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
}

type EIP1193Provider = {
	isMetaMask?: boolean
	isCoinbaseWallet?: boolean
	request: (args: { method: string; params?: any[] | object }) => Promise<any>
	on?: (event: string, cb: (...args: any[]) => void) => void
	removeListener?: (event: string, cb: (...args: any[]) => void) => void
}

declare global {
	interface Window {
		// @ts-ignore
		ethereum?: EIP1193Provider & { providers?: EIP1193Provider[] }
		coinbaseWalletExtension?: { isCoinbaseWallet?: boolean } & EIP1193Provider;
		openConnectWallet?: () => void;
		disconnectWallet?: () => void;
  }
}

type WalletKind = "metamask" | "coinbase" | "okx"

function emitWalletEvent(type: string, detail?: any) {
  try {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  } catch {}
}

function debugWalletDetection() {
  console.log("=== 钱包检测调试开始 ===");
  
  const { ethereum } = window as any;
  
  // 1. 检查 window.ethereum
  console.log("window.ethereum:", {
		exists: !!ethereum,
		isMetaMask: ethereum?.isMetaMask,
		isOkxWallet: ethereum?.isOkxWallet,
		isOkExWallet: ethereum?.isOkExWallet,
		isCoinbaseWallet: ethereum?.isCoinbaseWallet,
		isTrust: ethereum?.isTrust,
  });

  // 2. 检查 providers 数组
  if (ethereum?.providers && Array.isArray(ethereum.providers)) {
    console.log(`Found ${ethereum.providers.length} providers:`);
    ethereum.providers.forEach((p: any, idx: number) => {
      console.log(`  [${idx}]:`, {
        isMetaMask: p?.isMetaMask,
        isOkxWallet: p?.isOkxWallet,
        isOkExWallet: p?.isOkExWallet,
        isCoinbaseWallet: p?.isCoinbaseWallet,
        isTrust: p?.isTrust,
        rdnsName: p?.info?.rdns || "unknown",
      });
    });
  }

  // 3. 检查 EIP-6963 注册的钱包
  const providers: any[] = [];
  window.addEventListener("eip6963:announceProvider", (event: any) => {
    const { info, provider } = event.detail;
    providers.push({ info, provider });
    console.log(`EIP-6963 provider announced: ${info.rdns}`);
  });
  
  // 触发 EIP-6963 请求
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  // 4. 检查其他独立注入
  const anyWin = window as any;
  console.log("Independent injections:", {
    okxwallet: !!anyWin.okxwallet,
    okxwallet_flags: anyWin.okxwallet ? {
      isOkxWallet: anyWin.okxwallet.isOkxWallet,
      ethereum: !!anyWin.okxwallet.ethereum,
    } : null,
    okexwallet: !!anyWin.okexwallet,
    coinbaseWalletExtension: !!anyWin.coinbaseWalletExtension,
  });

  console.log("=== 调试结束 ===");
}

const eip6963ProvidersRef = { current: new Map<string, EIP1193Provider>() }

// const RDNS_MAP: Record<WalletKind, string[]> = {
// 	metamask: ["io.metamask", "io.metamask.flask"],
// 	coinbase: ["com.coinbase.wallet", "com.coinbase.wallet.extension"],
// 	okx: ["com.okx.wallet", "com.okex.wallet"], // 两个都留着
// }

// 监听 EIP-6963 announceProvider 事件，存储所有钱包
if (typeof window !== "undefined") {
	window.addEventListener("eip6963:announceProvider", (event: any) => {
		const { info, provider } = event.detail;
		if (info?.rdns) {
			eip6963ProvidersRef.current.set(info.rdns, provider);
		}
	});
	// 主动触发 EIP-6963 请求
	window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function getInjectedProvider(kind: WalletKind): EIP1193Provider | undefined {
	const { ethereum } = window as any;

	// ============= 方案 1: 优先使用 EIP-6963 =============
	// EIP-6963 是最可信的，因为钱包必须通过标准化的 rdns 标识自己
	const eip6963Map = eip6963ProvidersRef.current;

	if (kind === "metamask") {
		// MetaMask 的官方 RDNS
		const mmFromEIP = eip6963Map.get("io.metamask");
		if (mmFromEIP) return mmFromEIP;
	}

	if (kind === "coinbase") {
		const cbFromEIP = eip6963Map.get("com.coinbase.wallet");
		if (cbFromEIP) return cbFromEIP;
	}

	if (kind === "okx") {
		// OKX 可能用 com.okex.wallet 或 com.okx.wallet
		const okxFromEIP = eip6963Map.get("com.okex.wallet") || eip6963Map.get("com.okx.wallet");
		if (okxFromEIP) return okxFromEIP;
	}

	// ============= 方案 2: 多 provider 数组检查 =============
	if (ethereum?.providers && Array.isArray(ethereum.providers)) {
		const arr = ethereum.providers as any[];

		if (kind === "metamask") {
		// 找到设置了 isMetaMask=true 但没有 OKX/CB 标志的
		const mm = arr.find((p) => {
			return (
			!!p?.isMetaMask &&
			!p?.isOkxWallet &&
			!p?.isOkExWallet &&
			!p?.isCoinbaseWallet
			);
		});
		if (mm) return mm as EIP1193Provider;
		}

		if (kind === "coinbase") {
		const cb = arr.find(
			(p) => !!p?.isCoinbaseWallet && !p?.isOkxWallet && !p?.isOkExWallet
		);
		if (cb) return cb as EIP1193Provider;
		}

		if (kind === "okx") {
		const ok = arr.find((p) => !!p?.isOkxWallet || !!p?.isOkExWallet);
		if (ok) return ok as EIP1193Provider;
		}
	}

	// ============= 方案 3: 单 provider 场景 =============
	// 注意：只有在 EIP-6963 和 providers 数组都没找到时才用这个
	// 因为 window.ethereum 容易被 OKX 伪装
	if (ethereum) {
		if (kind === "okx") {
		if (ethereum.isOkxWallet || ethereum.isOkExWallet) {
			return ethereum as EIP1193Provider;
		}
		}

		if (kind === "coinbase") {
		if (ethereum.isCoinbaseWallet && !ethereum.isOkxWallet && !ethereum.isOkExWallet) {
			return ethereum as EIP1193Provider;
		}
		}

		// MetaMask: 只在没有 OKX 伪装的情况下才用
		// 由于 OKX 会设置 isMetaMask=true 但不设置 isOkxWallet，
		// 我们需要额外的启发式方法来区分
		if (kind === "metamask") {
		if (
			!!ethereum.isMetaMask &&
			!ethereum.isOkxWallet &&
			!ethereum.isOkExWallet &&
			!ethereum.isCoinbaseWallet
		) {
			// 额外检查：看 provider 是否声称自己来自 "MetaMask" 或类似
			// 这是一个启发式的防御，因为 OKX 不太可能完全伪装 provider.name
			if (
			ethereum.isConnected?.toString().includes("bound") ||
			(ethereum.request && ethereum.request.length === 0)
			) {
			return ethereum as EIP1193Provider;
			}
		}
		}
	}

	// ============= 方案 4: OKX 独立注入兜底 =============
	const anyWin = window as any;
	if (kind === "okx") {
		if (anyWin.okxwallet?.isOkxWallet) {
		return anyWin.okxwallet as EIP1193Provider;
		}
		if (anyWin.okxwallet?.ethereum?.isOkxWallet) {
		return anyWin.okxwallet.ethereum as EIP1193Provider;
		}
		if (anyWin.okexwallet?.isOkExWallet || anyWin.okexwallet?.isOkxWallet) {
		return anyWin.okexwallet as EIP1193Provider;
		}
		if (anyWin.okexwallet?.ethereum?.isOkExWallet) {
		return anyWin.okexwallet.ethereum as EIP1193Provider;
		}
	}

	// ============= 方案 5: Coinbase 独立注入 =============
	if (
		kind === "coinbase" &&
		(window as any).coinbaseWalletExtension?.isCoinbaseWallet
	) {
		return (window as any).coinbaseWalletExtension as EIP1193Provider;
	}

	// Trust Wallet 防误报
	if ((window as any).ethereum?.isTrust) return undefined;

	return undefined;
}


const BASE_CHAIN_ID = "0x2105"; // Base Mainnet

type Props = {
	t: (cn: string, en: string, ja?: string) => string
}

export default function ConnectWallet({ t }: Props) {
	const [open, setOpen] = useState(false)
	const [connecting, setConnecting] = useState<WalletKind | null>(null)
	const [address, setAddress] = useState<string | null>(null)
	const [chainId, setChainId] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [currentKind, setCurrentKind] = useState<WalletKind | null>(null)

	const providerRef = useRef<EIP1193Provider | null>(null)
	const onAccountsChangedRef = useRef<((accs: string[]) => void) | null>(null)
	const onChainChangedRef = useRef<((cid: string) => void) | null>(null)

	const metaMaskInjected = useMemo(
		() => Boolean(getInjectedProvider("metamask")),
		[open]
	)

	const coinbaseInjected = useMemo(
		() => Boolean(getInjectedProvider("coinbase")),
		[open]
	)

	const okxInjected = useMemo(
		() => Boolean(getInjectedProvider("okx")),
		[open]
	)



	useEffect(() => {
			
		// 暴露给外部（保持兼容）
		window.openConnectWallet = () => setOpen(true);
		(window as any).debugWalletDetection = debugWalletDetection;
		return () => {
				delete (window as any).debugWalletDetection;
			if (window.openConnectWallet) delete window.openConnectWallet;
		}
	}, [])

	function detachListeners() {
		const provider = providerRef.current;
		if (!provider) return;
		if (onAccountsChangedRef.current) {
			provider.removeListener?.("accountsChanged", onAccountsChangedRef.current);
		}
		if (onChainChangedRef.current) {
			provider.removeListener?.("chainChanged", onChainChangedRef.current);
		}
		onAccountsChangedRef.current = null;
		onChainChangedRef.current = null;
	}

	const disconnect = React.useCallback(() => {
			detachListeners();
			providerRef.current = null;
			setAddress(null);
			setChainId(null);
			setCurrentKind(null);
			setError(null);
			emitWalletEvent("wallet:disconnected", {});
	}, []);

	useEffect(() => {
		window.disconnectWallet = () => disconnect();
		return () => {
		if (window.disconnectWallet) delete window.disconnectWallet;
		};
	}, [disconnect])

	useEffect(() => {
		if (open) {
			// 主动触发 EIP-6963 请求，促使扩展 announce
			try {
			// 规范里推荐用 CustomEvent('eip6963:requestProvider')
			window.dispatchEvent(new Event("eip6963:requestProvider"));
			} catch {}
		}
	}, [open])

	function finalizeConnect(opts: {
			provider: EIP1193Provider;
			account: string;
			chainIdHex: string;
			kind: WalletKind;
	}) {
		const { provider, account, chainIdHex, kind } = opts;
		setAddress(account);
		setChainId(chainIdHex);
		setCurrentKind(kind);
		setOpen(false);

		const walletClient = toWalletClient(provider, account)

		emitWalletEvent("wallet:connected", {
			account,
			chainId: parseInt(chainIdHex, 16),
			kind,
			walletType:
				kind === "metamask"
				? "MetaMask"
				: kind === "coinbase"
				? "Coinbase Wallet"
				: "OKX Wallet",
			provider,
			walletClient,
		});
	}

  useEffect(() => {
    // 仅移动端：MetaMask DApp 浏览器静默连接
    const trySilentConnect = async () => {
      const p = getInjectedProvider("metamask");
      if (!p) return;
      try {
        const accs: string[] = await p.request({ method: "eth_accounts" });
        const cidHex: string = await p.request({ method: "eth_chainId" });
        const account = accs?.[0];
        if (account && cidHex) {
          if (cidHex === BASE_CHAIN_ID) {
            finalizeConnect({ provider: p, account, chainIdHex: cidHex, kind: "metamask" });
          } else {
            try {
              await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_CHAIN_ID }] });
              const cid2 = await p.request({ method: "eth_chainId" });
              if (cid2 === BASE_CHAIN_ID) {
                finalizeConnect({ provider: p, account, chainIdHex: cid2, kind: "metamask" });
              }
            } catch {}
          }
        }
      } catch {}
    };

    if (isMobile) {
      const shouldAuto = /connect=metamask/i.test(window.location.search) || true;
      if (shouldAuto) trySilentConnect();
    }
  }, []);

  async function connect(kind: WalletKind) {
    setError(null);
    if (address && currentKind && currentKind !== kind) {
      disconnect();
    }

    setConnecting(kind);
    try {
      const provider = getInjectedProvider(kind);
      if (!provider) {
        if (kind === "metamask") {
          if (isMobile) {
            window.location.href = metamaskDeeplinkForThisPage();
          } else {
            window.open("https://metamask.io/download/", "_blank");
          }
        } else if (kind === "coinbase") {
          window.open("https://www.coinbase.com/wallet", "_blank");
        } else {
          window.open(
            "https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge?hl=en",
            "_blank"
          );
        }
        return
      }

      providerRef.current = provider

      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" })
      const cidHex: string = await provider.request({ method: "eth_chainId" })
      const isBase = cidHex === BASE_CHAIN_ID

      setAddress(accounts?.[0] ?? null)
      setChainId(cidHex ?? null)
      setCurrentKind(kind)

      if (!isBase) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_CHAIN_ID }],
          });
          const cid2 = await provider.request({ method: "eth_chainId" });
          const accs2: string[] = await provider.request({ method: "eth_accounts" });
          const account2 = accs2?.[0] ?? accounts?.[0] ?? "";
          if (cid2 === BASE_CHAIN_ID && account2) {
            finalizeConnect({ provider, account: account2, chainIdHex: cid2, kind });
          } else {
            setError("Tried switching to Base; no account returned. Please authorize in wallet and retry.");
          }
        } catch (err: any) {
          if (err?.code === 4001) {
            setError("Network switch was canceled.");
          } else {
            setError(err?.message || String(err));
          }
        }
      } else {
        finalizeConnect({ provider, account: accounts?.[0] ?? "", chainIdHex: cidHex, kind });
      }

      // 监听
      const onAccountsChanged = (accs: string[]) => {
        const next = accs?.[0] ?? null;
        setAddress(next);
        emitWalletEvent("wallet:accountsChanged", { account: next || "" });
        if (!next) {
          setChainId(null);
          setCurrentKind(null);
          providerRef.current = null
          detachListeners()
        }
      }
      const onChainChanged = async (newChainId: string) => {
        setChainId(newChainId ?? null);
        const n = newChainId ? parseInt(newChainId, 16) : null;
        emitWalletEvent("wallet:chainChanged", { chainId: n });

        if (newChainId === BASE_CHAIN_ID && providerRef.current) {
          try {
            const accs: string[] = await providerRef.current.request({ method: "eth_accounts" });
            const account = accs?.[0] ?? "";
            if (account) {
              finalizeConnect({
                provider: providerRef.current,
                account,
                chainIdHex: newChainId,
                kind: currentKind || "metamask",
              });
            }
          } catch {}
        }
      };

      onAccountsChangedRef.current = onAccountsChanged;
      onChainChangedRef.current = onChainChanged;
      provider.on?.("accountsChanged", onAccountsChanged);
      provider.on?.("chainChanged", onChainChanged);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setConnecting(null);
    }
  }


  

  // —— 样式：黑白卡片 & 窄宽度（更贴合 Cashcode） ——
  // 容器：全宽，但卡片限制在 480px，并与上方元素留距
  // 卡片：白底、黑边、圆角、淡阴影；标题与按钮黑白反转
  // 列表项：黑色描边，hover 反转为黑底白字；副文本用中性灰
  return (
    <div className="relative w-full">
		{/* 顶部操作：如已连接，显示 Disconnect */}
		{address && (
			<button
				onClick={() => setOpen((s) => !s)}
				className="px-3 py-2 rounded-xl border border-black text-black hover:bg-black hover:text-white transition"
				title={address}
			>
			{open ? "Close" : "Disconnect"}
			</button>
		)}

      {/* 内嵌钱包选择卡片 */}

      {open && (
			<div className="w-full mt-4 rounded-2xl border border-black/20 bg-white text-black shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
				<div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
					{/* 左侧：icon + Select Wallet + CC钱包按钮 */}
					{
					
						<div className="flex items-center gap-3">
							<img src={cash_icon} alt="CC Wallet" className="w-5 h-5" />
							<h3 className="text-base font-semibold">{t("请选择钱包", "Select Wallet", "ウォレットを選択")}</h3>
							
						</div>
						
					}	

					

					{/* 右侧 Close 按钮 */}
					<button
						onClick={() => {
							setOpen(false)
						}}
						className="text-xs px-2 py-1 rounded-lg border border-black/20 hover:bg-[#f0f0f0] transition"
					>
						Close
					</button>
				</div>
				{
					<>
						<div className="p-4 space-y-3">
						{/* MetaMask */}
							<button
								disabled={connecting !== null}
								onClick={() => connect("metamask")}
								className="w-full flex items-center justify-between rounded-xl border border-black/20 bg-white px-4 py-3 hover:bg-[#f0f0f0] transition"
							>
								<div className="flex items-center gap-3">
								<img src={metamask_icon} alt="MetaMask" className="w-7 h-7 rounded-sm" />
								<div className="text-left">
									<div className="text-sm font-medium">MetaMask</div>
									<div className="text-xs text-black/60">
									{ metaMaskInjected ? t(
												"已检测到钱包环境",
												"Wallet environment detected",
												"ウォレット環境を検出しました"
												)
										: isMobile ? t(
												"未检测到注入，点击在 MetaMask 内打开",
												"No injection detected, tap to open in MetaMask",
												"インジェクションが検出されません。MetaMaskで開くにはタップしてください"
											)
										: t(
												"未检测到，点击将跳转安装",
												"Not detected, click to install",
												"検出されません。クリックしてインストールしてください"
											)
										}
									</div>
								</div>
								</div>
								<div className="text-xs">
								{connecting === "metamask" ? t("连接中…", "Connecting…", "接続中…") : t("连接", "Connect", "接続")}
								</div>
							</button>

							{/* Coinbase */}
							<button
								disabled={connecting !== null}
								onClick={() => connect("coinbase")}
								className="w-full flex items-center justify-between rounded-xl border border-black/20 bg-white px-4 py-3 hover:bg-[#f0f0f0] transition"
							>
								<div className="flex items-center gap-3">
								<img src={coinbase_icon} alt="Coinbase Wallet" className="w-7 h-7 rounded-sm" />
								<div className="text-left">
									<div className="text-sm font-medium">Coinbase</div>
									<div className="text-xs text-black/60">
									{coinbaseInjected ? t(
										"已检测到浏览器扩展",
										"Browser extension detected",
										"ブラウザ拡張機能が検出されました"
									) : t(
										"未检测到，点击将跳转安装",
										"Not detected, click to install",
										"検出されません。クリックしてインストールしてください"
									)}
									</div>
								</div>
								</div>
								<div className="text-xs">
								{connecting === "coinbase" ? t("连接中…", "Connecting…", "接続中…") : t("连接", "Connect", "接続")}
								</div>
							</button>

							{/* OKX */}
							<button
								disabled={connecting !== null}
								onClick={() => connect("okx")}
								className="w-full flex items-center justify-between rounded-xl border border-black/20 bg-white px-4 py-3 hover:bg-[#f0f0f0] transition"
							>
								<div className="flex items-center gap-3">
								<img src={okx_icon} alt="OKX Wallet" className="w-7 h-7 rounded-sm" />
								<div className="text-left">
									<div className="text-sm font-medium">OKX</div>
									<div className="text-xs text-black/60">
									{ okxInjected ? t(
										"已检测到浏览器扩展",
										"Browser extension detected",
										"ブラウザー拡張機能を検出しました"
										)
										:
										t(
										"未检测到，点击将跳转安装",
										"Not detected, click to install",
										"検出されません。クリックしてインストールしてください"
										)}
									</div>
								</div>
								</div>
								<div className="text-xs">
								{connecting === "okx" ? t("连接中…", "Connecting…", "接続中…") : t("连接", "Connect", "接続")}
								</div>
							</button>

							{/* 网络提示 */}
							{chainId && chainId !== BASE_CHAIN_ID && (
								<div className="mt-2 rounded-xl border border-black/20 bg-[#f9f9f9] text-black px-4 py-3 text-xs leading-relaxed">
								<div className="font-medium">[ NETWORK NOTICE ]</div>
								<div className="mt-1">
									当前网络 <span className="font-mono">{parseInt(chainId, 16)}</span>，需要切换到
									<span className="font-mono ml-1">Base (8453)</span>。
								</div>
								</div>
							)}

							{/* 错误提示 */}
							{error && (
								<div className="mt-2 rounded-xl border border-black/30 bg-[#fff] text-black px-4 py-3 text-xs break-words">
									Error: {error}
								</div>
							)}
						</div>
					</>
				}
			</div>
		)}

    </div>
  );
}
