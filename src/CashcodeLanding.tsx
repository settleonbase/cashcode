import { useState } from "react";
// On-chain libs (ethers v6). Ensure your bundler has `ethers` installed.
// import { BrowserProvider, Contract, parseUnits, keccak256, hexlify, randomBytes } from "ethers";

// ===== Types =====
type Lang = "cn" | "en" | "ja";
// type TabKey = "check" | "link";

// type ResultShape = {
//   code?: string;
//   url?: string;
// } | null;

// Minimal EIP-1193 provider type for dapps
export interface EIP1193Provider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  request<T = unknown>(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}
//@ts-ignore
export default function CashcodeLanding(): JSX.Element {
  // ===== State (TS typed) =====
  const [lang, setLang] = useState<Lang>("en");
  const [demoOpen, setDemoOpen] = useState<boolean>(false);

//   const [account, setAccount] = useState<string | null>(null);
//   const [chainId, setChainId] = useState<number | null>(null);
//   const [pending, setPending] = useState<string | null>(null);
//   const [txHash, setTxHash] = useState<string | null>(null);
//   const [realMode, setRealMode] = useState<boolean>(true);
  
//   const [tab, setTab] = useState<TabKey>("check");
//   const [amount, setAmount] = useState<string>("10.00");
//   const [token, setToken] = useState<"USDC" | "USDT">("USDC");
//   const [expiry, setExpiry] = useState<string>("7");
//   const [result, setResult] = useState<ResultShape>(null)
  

  // i18n helper
  const t = (cn: string, en: string, ja?: string): string => {
    if (lang === "cn") return cn;
    if (lang === "en") return en;
    return ja ?? en;
  };



  // ==== Config (fill in real addresses before going live) ====
//   const BASE_CHAIN_ID_HEX = "0x2105" as const; // 8453
//   const BASE_CHAIN_ID_DEC = 8453 as const;
//   const USDC_BASE: string = (typeof process !== "undefined" && (process as any)?.env?.NEXT_PUBLIC_USDC_BASE) || "<FILL_USDC_ADDRESS_ON_BASE>"; // Base USDC address
//   const CHECK_CONTRACT: string = (typeof process !== "undefined" && (process as any)?.env?.NEXT_PUBLIC_CHECK_CONTRACT) || "<FILL_CHECK_CONTRACT_ADDRESS>";

  // Minimal ABIs
//   const ERC20_ABI = [
//     "function allowance(address owner, address spender) view returns (uint256)",
//     "function approve(address spender, uint256 amount) returns (bool)",
//     "function decimals() view returns (uint8)",
//   ];
//   const CHECK_ABI = [
//     "function issue(address token, uint256 amount, bytes32 hashlock, uint64 expiry) external",
//   ];

//   // ==== Wallet & chain helpers ====
//   const hasProvider = (): boolean => typeof window !== "undefined" && !!window?.ethereum;

//   const connect = async (): Promise<void> => {
//     if (!hasProvider()) throw new Error(t("未检测到钱包（需要 MetaMask / Coinbase Wallet）", "No wallet detected (MetaMask / Coinbase Wallet)", "対応ウォレットが見つかりません (MetaMask / Coinbase Wallet)"));
//     const eth = window.ethereum as EIP1193Provider;
//     const accs = await eth.request<string[]>({ method: "eth_requestAccounts" });
//     setAccount(accs?.[0] ?? null);
//     const cid = await eth.request<string>({ method: "eth_chainId" });
//     const dec = parseInt(cid, 16);
//     setChainId(dec);
//   };

//   const switchToBase = async (): Promise<void> => {
//     const eth = window.ethereum as EIP1193Provider;
//     try {
//       await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_CHAIN_ID_HEX }] });
//       setChainId(BASE_CHAIN_ID_DEC);
//     } catch (e: any) {
//       if (e?.code === 4902) {
//         await eth.request({
//           method: "wallet_addEthereumChain",
//           params: [
//             {
//               chainId: BASE_CHAIN_ID_HEX,
//               chainName: "Base",
//               nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
//               rpcUrls: ["https://mainnet.base.org"],
//               blockExplorerUrls: ["https://basescan.org"],
//             },
//           ],
//         });
//         setChainId(BASE_CHAIN_ID_DEC);
//       } else {
//         throw e;
//       }
//     }
//   };

//   const getSigner = async () => {
//     const provider = new BrowserProvider((window.ethereum as EIP1193Provider) as any);
//     return await provider.getSigner();
//   };

//   const ensureAllowance = async (owner: string, tokenAddr: string, spender: string, amountBn: bigint): Promise<void> => {
//     const signer = await getSigner();
//     const erc20 = new Contract(tokenAddr, ERC20_ABI, signer);
//     const current = (await erc20.allowance(owner, spender)) as bigint;
//     if (current < amountBn) {
//       const tx = await erc20.approve(spender, amountBn);
//       setPending(t("授权 USDC 中…", "Approving USDC…", "USDC を承認中…"));
//       const rc = await tx.wait();
//       void rc; // silence unused var in some TS configs
//       setPending(null);
//     }
//   };

  // ==== On-chain: Issue Check on Base ====
//   const issueCheckOnChain = async (): Promise<void> => {
//     if (!account) await connect();
//     if (chainId !== BASE_CHAIN_ID_DEC) await switchToBase();

//     if (token !== "USDC") throw new Error(t("先支持 Base 上 USDC", "USDC on Base only for now", "まずはBase上のUSDCに対応"));
//     if (!CHECK_CONTRACT || CHECK_CONTRACT.startsWith("<")) throw new Error(t("请配置 CHECK_CONTRACT 地址", "Please configure CHECK_CONTRACT address", "CHECK_CONTRACT を設定してください"));
//     if (!USDC_BASE || USDC_BASE.startsWith("<")) throw new Error(t("请配置 USDC 地址", "Please configure USDC address", "USDC アドレスを設定してください"));

//     const signer = await getSigner();
//     const amt = parseUnits(amount, 6); // USDC has 6 decimals (bigint)

//     // Generate secret S & hash H
//     const secretBytes = randomBytes(32);
//     const secret = hexlify(secretBytes); // 0x...
//     const H = keccak256(secretBytes);
//     const now = Math.floor(Date.now() / 1000);
//     const expSecs = (now + parseInt(expiry || "7", 10) * 86400) as unknown as bigint; // contract expects uint64 but ethers auto-casts from number/bigint

//     // Ensure allowance then call issue
//     await ensureAllowance((await signer.getAddress()) as string, USDC_BASE, CHECK_CONTRACT, amt);

//     const check = new Contract(CHECK_CONTRACT, CHECK_ABI, signer);
//     setPending(t("开支票上链中…", "Issuing check on-chain…", "オンチェーンでチェックを発行中…"));
//     const tx = await check.issue(USDC_BASE, amt, H, expSecs);
//     const rc = await tx.wait();
//     setPending(null);
//     setTxHash((rc as any)?.hash ?? (tx as any)?.hash ?? null);

//     // Build code & URL
//     const humanCode = `CHK-${secret.slice(2, 10).toUpperCase()}-${secret.slice(10, 18).toUpperCase()}`;
//     const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app";
//     const claimUrl = `${origin}/claim#${secret}`; // using secret for real claim
//     setResult({ code: humanCode, url: claimUrl });
//   };

  // helpers
//   const rnd = (n: number): string => Math.random().toString(36).slice(2, 2 + n).toUpperCase();
// //   const genCheck = (): void => {
// //     const code = `CHK-${rnd(4)}-${rnd(4)}-${rnd(4)}`;
// //     const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app";
// //     const url = `${origin}/claim#${code}`;
// //     setResult({ code, url });
// //   };
// //   const genLink = (): void => {
// //     const code = `LNK-${rnd(4)}-${rnd(4)}-${rnd(4)}`;
// //     const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app";
// //     const params = new URLSearchParams({ id: code, amt: amount, ccy: token }).toString();
// //     const url = `${origin}/pay?${params}`;
// //     setResult({ code, url });
// //   };
// //   const copy = async (text: string): Promise<void> => {
// //     try {
// //       await navigator.clipboard.writeText(text);
// //     } catch {
// //       // noop
// //     }
// //   };

//   // === Dev sanity checks (lightweight "tests") ===
//   function _test_formatHumanCode(): void {
//     const fakeSecret = "0x" + "ab".repeat(32);
//     const human = `CHK-${fakeSecret.slice(2, 10).toUpperCase()}-${fakeSecret.slice(10, 18).toUpperCase()}`;
//     console.assert(/^CHK-[0-9A-F]{8}-[0-9A-F]{8}$/.test(human), "human code format");
//   }
//   function _test_linkParams(): void {
//     const q = new URLSearchParams({ id: "LNK-TEST-TEST", amt: amount, ccy: token }).toString();
//     console.assert(q.includes("amt=") && q.includes("ccy="), "pay link contains required params");
//   }
//   function _test_i18n_fallback(): void {
//     const fallback = (lng: Lang, cn: string, en: string, ja?: string): string => {
//       if (lng === "cn") return cn;
//       if (lng === "en") return en;
//       return ja ?? en;
//     };
//     console.assert(fallback("ja", "中", "EN") === "EN", "ja without translation should fallback to EN");
//   }
//   useEffect(() => {
//     if (typeof process === "undefined" || (process as any)?.env?.NODE_ENV !== "production") {
//       const sample = rnd(4);
//       console.assert(/^[A-Z0-9]{4}$/.test(sample), "rnd() should return 4 alnum uppercase chars");
//       _test_formatHumanCode();
//       _test_linkParams();
//       _test_i18n_fallback();
//       if (realMode && (USDC_BASE.startsWith("<") || CHECK_CONTRACT.startsWith("<"))) {
//         console.warn("[Config] USDC_BASE or CHECK_CONTRACT missing — turn off 真实上链 or set env vars NEXT_PUBLIC_USDC_BASE/NEXT_PUBLIC_CHECK_CONTRACT.");
//       }
//     }
//   }, [realMode, amount, token]);


  return (
    <div className="min-h-screen bg-white text-black">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 border border-black grid place-content-center font-bold text-xs tracking-wider">CC</div>
            <span className="font-semibold tracking-tight">{t("码信钱包", "Cashcode Wallet", "Cashcode ウォレット")}</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex text-sm">
            <a href="#features" className="hover:underline">
              {t("功能", "Features", "機能")}
            </a>
            <a href="#stories" className="hover:underline">
              {t("故事", "Use Cases", "利用シーン")}
            </a>
            <a href="#security" className="hover:underline">
              {t("安全", "Security", "セキュリティ")}
            </a>
            <a href="#pricing" className="hover:underline">
              {t("价格", "Pricing", "料金")}
            </a>
            <a href="#faq" className="hover:underline">
              {t("常见问题", "FAQ", "よくある質問")}
            </a>
          </nav>
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setLang("cn")} className={`rounded-full border px-2 py-1 ${lang === 'cn' ? 'bg-black text-white' : 'border-black'}`}>中文</button>
            <button onClick={() => setLang("en")} className={`rounded-full border px-2 py-1 ${lang === 'en' ? 'bg-black text-white' : 'border-black'}`}>EN</button>
            <button onClick={() => setLang("ja")} className={`rounded-full border px-2 py-1 ${lang === 'ja' ? 'bg-black text-white' : 'border-black'}`}>日本語</button>
            <button
              onClick={() => setDemoOpen(true)}
              className="ml-2 rounded-full border border-black px-3 py-1 tracking-wide hover:bg-black hover:text-white transition"
            >
              {t("开始体验", "Get Started", "はじめる")} 
			</button>
          </div>
        </div>
      </header>
		{
			!demoOpen &&
			<>
				      {/* Hero */}
					<section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
						<div className="grid items-center gap-10 md:grid-cols-2">
						<div>
							<h1 className="text-4xl md:text-5xl font-semibold leading-tight">{t("稳定币，发一个码就到账。", "Stablecoins, paid by sharing a code.", "ステーブルコイン、コードを共有するだけで支払い完了。")}</h1>
							<p className="mt-4 text-base text-black/70">
							{t(
								"USDC/USDT 的支票码、收款链接与直接 Send，零门槛、可止付/过期、统一账本。",
								"USDC/USDT checks, payment links, and direct Send—zero friction, stop/expiry controls, unified ledger.",
								"USDC/USDTのチェックコード・支払いリンク・ダイレクト送金。学習不要、停止/有効期限、統合台帳。"
							)}
							</p>
							<div className="mt-6 flex flex-wrap items-center gap-3">
							<button
								onClick={() => setDemoOpen(true)}
								className="rounded-xl border border-black px-5 py-2 text-sm hover:bg-black hover:text-white transition"
							>
								{t("开第一张支票", "Issue your first check", "最初のチェックを発行")}
							</button>
							<a
								href="#features"
								className="rounded-xl border border-black/30 px-5 py-2 text-sm text-black/70 hover:border-black hover:text-black transition"
							>
								{t("查看功能", "See features", "機能を見る")}
							</a>
							</div>
							<div className="mt-4 text-xs uppercase tracking-wider text-black/60">{t("USDC • USDT • Base → 之后接入 OP/Arb", "USDC • USDT • Base → OP/Arb (soon)", "USDC・USDT・Base → まもなく OP/Arb 対応")}</div>
						</div>

							<div className="relative mx-auto w-full max-w-sm rounded-2xl border border-black bg-white shadow-[6px_6px_0_#000] p-4">
								{/* 顶部标签栏 */}
								<div className="mb-3 grid grid-cols-4 text-xs gap-1">
									<button className="border border-black bg-black text-white rounded-full px-2 py-1">{t("支票", "Check", "チェック")}</button>
									<button className="border border-black rounded-full px-2 py-1">{t("收款", "Link", "リンク")}</button>
									<button className="border border-black rounded-full px-2 py-1">Send</button>
									<button className="border border-black rounded-full px-2 py-1">{t("账本", "Ledger", "台帳")}</button>
								</div>

								{/* 主卡片内容 */}
								<div className="space-y-3 text-sm">
									<div className="rounded-2xl border border-black p-4 bg-gradient-to-b from-white to-gray-50">
									<div className="flex items-center justify-between">
										<span className="font-medium text-lg">USDC</span>
										<span className="text-black/60 text-sm">{t("金额", "Amount", "金額")}</span>
									</div>
									<div className="mt-2 text-3xl font-semibold tracking-tight">10.00</div>
									<div className="mt-3 flex justify-between text-xs text-black/70">
										<span>{t("有效期 7 天", "Expires in 7 days", "有効期限7日")}</span>
										<span>{t("可止付", "Stoppable", "支払い停止可")}</span>
									</div>
									<button
										onClick={() => setDemoOpen(true)}
										className="mt-4 w-full rounded-xl border border-black px-3 py-2 text-sm hover:bg-black hover:text-white transition"
									>
										{t("生成支票码", "Generate check code", "チェックコードを作成")}
									</button>
									</div>

									{/* 提示区块 */}
									<div className="rounded-2xl border border-dashed border-black bg-gray-50 p-3 text-xs text-black/70">
									{t(
										"演示：生成一次性支票码，分享给朋友，在兑付页输入即可 0 Gas 领取。",
										"Demo: generate a one-time check code; share and redeem with 0 gas on the claim page.",
										"デモ：使い切りのチェックコードを作成。共有して、受け取りページで入力するだけ、ガス不要。"
									)}
									</div>
								</div>
							</div>

						</div>
					</section>

					{/* Features */}
					<section id="features" className="border-t border-black/10 bg-black text-white">
						<div className="mx-auto max-w-6xl grid gap-10 px-4 py-16 md:grid-cols-3">
						<div>
							<h3 className="text-2xl font-semibold">{t("开支票（一次性码）", "Checks (one-time code)", "チェック（ワンタイムコード）")}</h3>
							<p className="mt-3 text-white/70 text-sm">
							{t("哈希锁+时锁；支持止付/过期/延期；对方输入码即可领取。", "Hashlock + timelock; stop/expiry/extend; redeem by entering the code.", "ハッシュロック＋タイムロック。停止/期限/延長に対応。コード入力で受け取り。")}
							</p>
						</div>
						<div>
							<h3 className="text-2xl font-semibold">{t("收款链接（同意即付）", "Payment links (consent to pay)", "支払いリンク（同意で即支払い）")}</h3>
							<p className="mt-3 text-white/70 text-sm">
							{t("生成收款链接，发送给对方；点击确认立即支付，支持 0 Gas 赞助。", "Create a payment link; payer taps to confirm. Optional 0-gas sponsorship.", "支払いリンクを作成し送信。タップで確定、即支払い。ガス代スポンサー対応。")}
							</p>
						</div>
						<div>
							<h3 className="text-2xl font-semibold">{t("直接 Send（已知地址）", "Direct Send (known address)", "ダイレクト送金（既知アドレス）")}</h3>
							<p className="mt-3 text-white/70 text-sm">
							{t("可读意图签名，地址校验与限额风控；USDC/USDT 即刻到账。", "Readable intent, address checks & limits; instant USDC/USDT transfers.", "読みやすいインテント署名。アドレス検証と限度管理。USDC/USDT 即時着金。")}
							</p>
						</div>
						</div>
					</section>

					{/* Stories / Use Cases */}
					<section id="stories" className="mx-auto max-w-6xl px-4 py-16">
						<h2 className="text-3xl font-semibold">{t("从身边到全球：真实使用场景", "Real‑world use cases — from local to global", "身近な場面からグローバルまで：実例")}</h2>
						<p className="mt-2 text-black/60 text-sm">{t("从朋友AA到全球结算，一看就会用。", "From dinner splits to global payouts—instantly usable.", "割り勘からグローバル送金まで、直感的に使える。")}</p>
						<div className="mt-8 grid gap-4 md:grid-cols-2">
						{/* 1 朋友聚会AA */}
						<div className="rounded-2xl border border-black/10 p-5">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("朋友聚会 AA", "Dinner split AA", "飲み会の割り勘")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"结账时不想逐个扫码？在 ‘收款链接’ 填上你的地址和总金额，一条链接发群里，大家点开就付，0 Gas。链接 15 分钟后自动失效。",
								"No more passing QR codes. Fill your address & total in LinkPay, drop one link in the chat; everyone pays in one tap—0 gas. Auto-expires in 15 minutes.",
								"QRコードを回さずに、合計金額と受取先を入力してリンクを1つ送るだけ。全員が1タップで支払い、ガス代ゼロ。15分で自動失効。"
							)}
							</p>
						</div>
						{/* 2 创作者收小费 */}
						<div className="rounded-2xl border border-black/10 p-5">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("创作者收小费", "Creator tips", "クリエイターへの投げ銭")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"在简介里放一个 ‘支持我’ 的链接。读者点开，不用懂区块链，直接用 USDC 赞助。之后还能换成品牌页与短链。",
								"Drop a ‘Support me’ link in your bio. Fans tip in USDC—no crypto knowledge needed. Later upgrade to branded pages & shortlinks.",
								"プロフィールに『サポート』リンクを設置。USDCで簡単に支援。のちにブランドページや短縮リンクに対応。"
							)}
							</p>
						</div>
						{/* 3 临时活动报名 */}
						<div className="rounded-2xl border border-black/10 p-5">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("临时活动报名", "Pop-up events", "ポップアップイベントの受付")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"周末路演想收 10 USDC 的场地费？生成链接贴在海报二维码里，打开即付，现场转化更高，不用 POS、不开商户号。",
								"Charging a 10 USDC venue fee? Put a payment link behind your poster QR. One tap to pay—no POS, no merchant account.",
								"10 USDCの会場費を集金？ポスターのQRに支払いリンクを仕込み、開けば即支払い。POSも商用アカウントも不要。"
							)}
							</p>
						</div>
						{/* 4 小店随机收款 */}
						<div className="rounded-2xl border border-black/10 p-5">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("小店随机收款", "Countertop payments", "屋台/小規模店舗の支払い")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"摆摊或夜市收钱，把金额留空并启用 ‘付款人可改金额’，顾客扫你桌上的二维码，输入想付的数就能完成支付。",
								"At a booth or night market, leave amount blank with ‘payer can edit’. Shoppers scan your QR and enter what they owe.",
								"屋台やナイトマーケットでは金額を空欄にし『支払者が金額を入力』を有効化。QRを読み取り、金額を入れて支払い完了。"
							)}
							</p>
						</div>
						{/* 5 全球最大场景：跨境转账/家人汇款 */}
						<div className="rounded-2xl border border-black/10 p-5 md:col-span-2">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("全球使用：跨境转账 / 家人汇款", "Global: cross‑border transfers / remittance", "グローバル：国際送金／家族への送金")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"寄钱给在国外的家人？汇款常常慢、贵、还有限时。用 ‘支票码’，你先锁定 100 USDC 给家人，发一串码即可。对方在任意时区、任意钱包里输入就到账——没有中间机构、没有营业时间。",
								"Sending money across borders? Traditional remittance is slow, expensive and time‑boxed. With a ‘check code’, lock 100 USDC for your family and share the code. They redeem in any time zone from their wallet—no intermediaries, no banking hours.",
								"海外の家族に送金？従来の送金は遅くて高コスト、しかも時間制限。『チェックコード』で100 USDCをロックしてコードを送るだけ。相手はどのタイムゾーンでも自分のウォレットで受け取り。仲介機関も営業時間も不要。"
							)}
							</p>
							<div className="mt-3 flex flex-wrap gap-2 text-xs text-black/60">
							<span>USDC/USDT</span>
							<span>24/7</span>
							<span>{t("可止付/可过期", "stoppable/expirable", "停止/期限設定可")}</span>
							<span>{t("统一账本对账", "unified ledger", "統合台帳")}</span>
							</div>
						</div>
						{/* 6 远程团队发薪/报销 */}
						<div className="rounded-2xl border border-black/10 p-5 md:col-span-2">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("远程团队发薪 / 报销", "Remote payroll / reimbursements", "リモートチームの給与／精算")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"全球团队发放一笔笔小额补贴？用 ‘批量支票’ 或 ‘批量收款链接’，员工在本地时区领取，逾期未领自动可退款，财务一键导出对账。",
								"Paying small stipends to a global team? Use bulk checks or links. Staff redeem in their local time zones; unclaimed funds auto‑refundable; finance exports the ledger in one click.",
								"グローバルチームに少額手当を配布？『一括チェック』や『一括支払いリンク』で、各自のタイムゾーンで受け取り。未受領は自動返金。台帳はワンクリックでエクスポート。"
							)}
							</p>
						</div>
						{/* 7 全球自由职业者结算 */}
						<div className="rounded-2xl border border-black/10 p-5">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("全球自由职业者结算", "Global freelancer payout", "グローバル・フリーランサーへの支払い")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"外包设计/开发交付后，用 ‘支票码’ 结算 500 USDC。对方在任意钱包 24/7 兑付；若 7 天未领，你可 ‘止付’ 并原路退回。",
								"After a design/dev gig is delivered, settle 500 USDC via a check code. The contractor redeems 24/7 in any wallet; if unclaimed in 7 days, stop and refund automatically.",
								"デザイン/開発の納品後に『チェックコード』で500 USDCを支払い。相手は24/7どのウォレットでも受け取り可。7日未受領なら停止して返金。"
							)}
							</p>
						</div>
						{/* 8 跨境电商/平台型结算（轻托管） */}
						<div className="rounded-2xl border border-black/10 p-5">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("跨境电商平台结算（轻托管）", "Marketplace payout (light escrow)", "越境ECのエスクロー（簡易）")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"买家支付生成 ‘收款链接’，平台在商家 ‘发货完成’ 前保持可止付状态；确认后转为商家可兑付的 ‘支票’，降低纠纷。",
								"Buyer pays via a link; platform keeps it stoppable until seller marks shipped, then flips to a redeemable check—reducing disputes in cross‑border marketplaces.",
								"購入者はリンクで支払い。出荷完了までプラットフォーム側で停止可能状態を維持し、確認後に販売者へ受け取り可能な『チェック』へ切替。紛争を抑制。"
							)}
							</p>
						</div>
						{/* 9 NGO/救援金发放 */}
						<div className="rounded-2xl border border-black/10 p-5 md:col-span-2">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("NGO / 救援金发放", "NGO / relief disbursements", "NGO／救援金の配布")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"灾后紧急援助，批量下发 ‘支票码’ 到受助者手机短信；本地钱包 0 Gas 兑付，未领款项自动回到资金池，账本透明可审计。",
								"For disaster relief, bulk-issue check codes via SMS. Local wallets redeem with 0 gas; unclaimed funds auto-return to the treasury; the ledger is transparent and auditable.",
								"災害支援では、SMSで『チェックコード』を一括配布。ローカルウォレットでガス代ゼロ受け取り。未受領は自動で資金に戻り、台帳は透明で監査可能。"
							)}
							</p>
						</div>
						{/* 10 留学生/差旅临时用款 */}
						<div className="rounded-2xl border border-black/10 p-5">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("留学生 / 差旅临时用款", "Students & business travel advances", "留学生／出張の仮払金")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"父母/公司给你一笔 200 USDC 的 ‘支票码’，可在 30 天内分次兑付；未用完自动退回原账户。",
								"Parents/company issue a 200 USDC check code, redeemable over 30 days in multiple pulls; the unused balance returns automatically.",
								"家族/会社から200 USDCの『チェックコード』を受け取り、30日以内に複数回に分けて受け取り可。未使用分は自動で返金。"
							)}
							</p>
						</div>
						{/* 11 打赏 / 订阅会员 */}
						<div className="rounded-2xl border border-black/10 p-5">
							<div className="text-xs uppercase tracking-wide text-black/50"># {t("创作打赏 / 会员订阅", "Tips & memberships", "投げ銭／メンバーシップ")}</div>
							<p className="mt-2 text-sm leading-6">
							{t(
								"为播客/专栏生成 ‘收款链接’，听众点击即付；高级版支持定期生成支票码，用于月度会员的自动续期。",
								"Create payment links for your podcast/newsletter; fans pay in one tap. Pro: auto-issue monthly check codes for recurring memberships.",
								"ポッドキャスト/連載向けに『支払いリンク』を作成。ワンタップで支援。Proでは月次メンバー向けに定期『チェックコード』を自動発行。"
							)}
							</p>
						</div>
						</div>
						<div className="mt-8">
						<a
							href="#start"
							onClick={() => setDemoOpen(true)}
							className="inline-block rounded-xl border border-black px-5 py-2 text-sm hover:bg-black hover:text-white transition"
						>
							{t("马上试一张 1 USDC 支票", "Try a 1 USDC check now", "1 USDC のチェックを試す")} 
							</a>
						</div>
					</section>

					{/* Security */}
					<section id="security" className="mx-auto max-w-6xl px-4 py-16">
						<h2 className="text-3xl font-semibold">{t("安全与合规边界", "Security & Boundaries", "セキュリティと境界")}</h2>
						<div className="mt-6 grid gap-6 md:grid-cols-2">
						<ul className="space-y-2 text-sm text-black/80 list-disc pl-5">
							<li>{t("账户抽象 AA + Passkey/MPC，无助记词上手", "AA + Passkey/MPC, seedless onboarding", "AA + Passkey/MPC、シード不要")}</li>
							<li>{t("模板化 EIP-712 意图签名，拒绝任意 calldata", "Template EIP-712 intents; no arbitrary calldata", "テンプレ化EIP-712署名。任意calldataを拒否")}</li>
							<li>{t("Paymaster 白名单赞助，仅限受信意图", "Whitelisted Paymaster sponsorship for trusted intents only", "Paymasterホワイトリストで信頼インテントのみスポンサー")}</li>
							<li>{t("支票码本地生成高熵 S；链上仅存哈希 H", "Check secrets local-only; onchain stores hash H", "チェックコードの秘密Sはローカル生成。オンチェーンにはハッシュHのみ")}</li>
						</ul>
						<ul className="space-y-2 text-sm text-black/80 list-disc pl-5">
							<li>{t("支持止付/过期/延期；未兑付可退款", "Stop/expiry/extend; refundable if unclaimed", "停止/期限/延長対応。未受領は返金可")}</li>
							<li>{t("统一账本与导出，适配财务对账", "Unified ledger & export for reconciliation", "統合台帳とエクスポート。経理対帳に対応")}</li>
							<li>{t("只做加密稳定币（USDC/USDT），不涉法币", "Crypto-only (USDC/USDT), no fiat ramps", "暗号のステーブルコインのみ（USDC/USDT）。法定通貨は非対応")}</li>
							<li>{t("先 Base，后 OP/Arb，多链同一体验", "Base first, then OP/Arb—same UX across chains", "まずBase、次にOP/Arb。体験は同一")}</li>
						</ul>
						</div>
					</section>

					{/* Pricing */}
					<section id="pricing" className="border-t border-black/10 bg-black text-white">
						<div className="mx-auto max-w-6xl px-4 py-16">
						<h2 className="text-3xl font-semibold">{t("价格", "Pricing", "料金")}</h2>
						<div className="mt-8 grid gap-6 md:grid-cols-3">
							<div className="border border-white p-6">
							<h3 className="text-xl font-semibold">{t("基础版", "Basic", "ベーシック")}</h3>
							<p className="mt-2 text-white/70 text-sm">{t("每笔 0.5% 手续费", "Per txn: 0.5% fee", "取引ごとに 0.5% 手数料")}</p>
							<ul className="mt-4 space-y-2 text-sm text-white/80 list-disc pl-5">
								<li>{t("支票/收款/Send 全部可用", "Checks/Links/Send included", "チェック／リンク／送金 すべて対応")}</li>
								<li>{t("0 Gas 兑付（平台赞助可选）", "0-gas claims (optional sponsorship)", "ガス代ゼロの受け取り（任意のスポンサー）")}</li>
								<li>{t("账本与 CSV 导出", "Ledger & CSV export", "台帳とCSVエクスポート")}</li>
							</ul>
							</div>
							<div className="border border-white p-6">
							<h3 className="text-xl font-semibold">Pro</h3>
							<p className="mt-2 text-white/70 text-sm">{t("订阅，面向小团队/创作者", "Subscription for teams/creators", "小規模チーム／クリエイター向けサブスク")}</p>
							<ul className="mt-4 space-y-2 text-sm text-white/80 list-disc pl-5">
								<li>{t("批量支票/收款、Webhook", "Bulk checks/links, webhooks", "一括チェック/支払い、Webhook")}</li>
								<li>{t("自定义限额与风控", "Custom limits & risk controls", "カスタム限度額とリスク管理")}</li>
								<li>{t("品牌化收款页", "Branded payment pages", "ブランド化支払いページ")}</li>
							</ul>
							</div>
							<div className="border border-white p-6">
							<h3 className="text-xl font-semibold">Enterprise</h3>
							<p className="mt-2 text-white/70 text-sm">{t("对账 API、权限/审计、白标", "Reconciliation API, roles/audit, white-label", "対帳API・権限/監査・OEM")}</p>
							<ul className="mt-4 space-y-2 text-sm text-white/80 list-disc pl-5">
								<li>{t("多组织/多环境", "Multi-org / environments", "複数組織／複数環境")}</li>
								<li>{t("优先支持与合规接口", "Priority support & compliance hooks", "優先サポート・コンプライアンス連携")}</li>
								<li>{t("专属赞助池策略", "Dedicated sponsorship strategy", "専用スポンサーシップ戦略")}</li>
							</ul>
							</div>
						</div>
						</div>
					</section>

					{/* FAQ */}
					<section id="faq" className="mx-auto max-w-6xl px-4 py-16">
						<h2 className="text-3xl font-semibold">FAQ</h2>
						<div className="mt-6 grid gap-6 md:grid-cols-2">
						<div>
							<h4 className="font-medium">{t("需要助记词吗？", "Do I need a seed phrase?", "シードフレーズは必要ですか？")}</h4>
							<p className="text-sm text-black/70 mt-1">{t("不需要。使用 Passkey/MPC 即可创建与恢复。", "No. Passkey/MPC for create & recovery.", "不要です。Passkey/MPCで作成・復元できます。")}</p>
						</div>
						<div>
							<h4 className="font-medium">{t("收款要 Gas 吗？", "Do recipients need gas?", "受け取りにガス代は必要ですか？")}</h4>
							<p className="text-sm text-black/70 mt-1">{t("默认赞助 0 Gas 兑付（可关闭）。", "Default 0-gas claims via sponsorship (optional).", "標準でガス代ゼロの受け取り（設定で無効可）。")}</p>
						</div>
						<div>
							<h4 className="font-medium">{t("支持哪些链？", "Which chains are supported?", "どのチェーンに対応していますか？")}</h4>
							<p className="text-sm text-black/70 mt-1">{t("先 Base，后续接入 OP/Arb，体验一致。", "Start with Base; OP/Arb next with identical UX.", "まずはBase。次にOP/Arbへ、体験は同じです。")}</p>
						</div>
						<div>
							<h4 className="font-medium">{t("是否开源？", "Open source?", "オープンソースですか？")}</h4>
							<p className="text-sm text-black/70 mt-1">{t("合约接口会公开，客户端与风控模块分阶段开源。", "Contracts public; client & risk modules phased open.", "コントラクトは公開。クライアントとリスク管理は段階的にOSS化。")}</p>
						</div>
						</div>
					</section>
			
			
			</>
		}

      {/* Footer */}
      <footer className="border-t border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-black/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>© {new Date().getFullYear()} Cashcode / CC钱包</div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">
              {t("隐私", "Privacy", "プライバシー")}
			  </a>
            <a href="#" className="hover:underline">
              {t("条款", "Terms", "利用規約")}
			  </a>
            <a href="#" className="hover:underline">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {/* {demoOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white text-black border border-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <div className="flex items-center gap-3 text-sm">
                <button onClick={() => setTab("check")} className={`px-3 py-1 border ${tab === "check" ? "bg-black text-white" : "border-black"}`}>
                  {t("开支票", "Issue Check", "チェックを発行")}
                </button>
                <button onClick={() => setTab("link")} className={`px-3 py-1 border ${tab === "link" ? "bg-black text-white" : "border-black"}`}>
                  {t("收款链接", "Payment Link", "支払いリンク")}
                </button>
              </div>
              <button onClick={() => setDemoOpen(false)} className="text-sm hover:underline">
                {t("关闭", "Close", "閉じる")}
              </button>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="p-4 border-r border-black/10">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={realMode} onChange={(e) => setRealMode(e.target.checked)} /> {t("真实上链（Base/USDC）", "On-chain (Base/USDC)", "オンチェーン（Base/USDC）")}
                  </label>
                  <div className="flex items-center gap-2">
                    {!account ? (
                      <button onClick={connect} className="border border-black px-2 py-1">
                        {t("连接钱包", "Connect Wallet", "ウォレット接続")}
                      </button>
                    ) : (
                      <span className="text-black/60">
                        {account.slice(0, 6)}…{account.slice(-4)} {chainId !== BASE_CHAIN_ID_DEC && t("(请切到 Base)", "(Switch to Base)", "(Base に切替)")}
                      </span>
                    )}
                  </div>
                </div>
                <label className="block text-xs text-black/60 mb-1">{t("币种", "Token", "トークン")}</label>
                <div className="flex gap-2 mb-3">
                  {["USDC", "USDT"].map((ccy) => (
                    <button key={ccy} onClick={() => setToken(ccy as "USDC" | "USDT")} className={`px-3 py-1 border ${token === ccy ? "bg-black text-white" : "border-black"}`}>
                      {ccy}
                    </button>
                  ))}
                </div>
                <label className="block text-xs text-black/60 mb-1">{t("金额", "Amount", "金額")}</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-black px-3 py-2 text-sm" />
                {tab === "check" && (
                  <>
                    <label className="block text-xs text-black/60 mt-3 mb-1">{t("有效期（天）", "Expiry (days)", "有効日数")}</label>
                    <input value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full border border-black px-3 py-2 text-sm" />
                  </>
                )}
                <button
                  onClick={() => {
                    setResult(null);
                    setTxHash(null);
                    if (tab === "check") {
                      realMode ? void issueCheckOnChain() : genCheck();
                    } else {
                      genLink();
                    }
                  }}
                  className="mt-4 w-full border border-black px-3 py-2 text-sm hover:bg-black hover:text-white transition"
                >
                  {tab === "check" ? t("生成支票码", "Generate Check Code", "チェックコードを作成") : t("生成收款链接", "Generate Payment Link", "支払いリンクを作成")}
                </button>
                <p className="mt-2 text-xs text-black/60">
                  {tab === "check"
                    ? (realMode
                        ? t("将发起真实链上交易：授权 USDC（如需）并调用 Check.issue。请确认钱包弹窗。", "This will send real on-chain tx: approve USDC (if needed) then Check.issue. Confirm in wallet.", "実際のオンチェーン取引を実行：必要に応じてUSDC承認→Check.issueを呼び出し。ウォレットで確認してください。")
                        : t("此为前端演示，不会上链。实际版本将使用 Hashlock+Timelock 合约并支持 0 Gas 兑付。", "Demo only; real version uses Hashlock+Timelock contracts and 0-gas claims.", "これはデモです。実運用ではHashlock+Timelockコントラクトとガス代ゼロ受け取りに対応します。"))
                    : t("此为前端演示，支付将走模板化意图签名与 Paymaster 白名单。", "Demo only; real payments sign template intents with Paymaster whitelist.", "これはデモです。実際の支払いはテンプレート化インテント署名とPaymasterホワイトリストで行います。")}
                </p>
                {pending && <div className="mt-2 text-xs text-black">{pending}</div>}
                {txHash && (
                  <div className="mt-2 text-xs">
                    <span className="text-black/60">TX:</span>{" "}
                    <a className="underline" href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">
                      {txHash.slice(0, 10)}…
                    </a>
                  </div>
                )}
              </div>
              <div className="p-4 bg-black text-white min-h-[240px]">
                <h4 className="font-semibold text-sm">{t("结果 / 分享", "Result / Share", "結果 / 共有")}</h4>
                {!result && <div className="mt-6 text-white/60 text-sm">{t("点击左侧生成即可预览支票码或收款链接。", "Generate on the left to preview code/link.", "左側で生成するとコード/リンクをプレビューできます。")}</div>}
                {result && (
                  <div className="mt-4 space-y-3">
                    {result.code && (
                      <div>
                        <div className="text-xs uppercase text-white/60">{t("支票代码（分享给收款人）", "Check Code (share with payee)", "チェックコード（受取人に共有）")}</div>
                        <div className="mt-1 font-mono text-lg tracking-wider">{result.code}</div>
                        <button onClick={() => copy(result.code!)} className="mt-2 border border-white px-3 py-1 text-xs hover:bg-white hover:text-black">
                          {t("复制代码", "Copy Code", "コードをコピー")}
                        </button>
                      </div>
                    )}
                    {result.url && (
                      <div>
                        <div className="text-xs uppercase text-white/60">{t("兑付链接", "Claim URL", "受け取りリンク")}</div>
                        <div className="mt-1 break-all font-mono text-sm">{result.url}</div>
                        <div className="mt-2 flex gap-2">
                          <a href={result.url} className="border border-white px-3 py-1 text-xs hover:bg-white hover:text-black" target="_blank" rel="noreferrer">
                            {t("在新页打开", "Open in new tab", "新しいタブで開く")}
                          </a>
                          <button onClick={() => copy(result.url!)} className="border border-white px-3 py-1 text-xs hover:bg-white hover:text-black">
                            {t("复制链接", "Copy Link", "リンクをコピー")}
							</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
