import { useState,useEffect } from "react";
import CashcodeLogo from './assets/logo'
import CashcodeAPP from './components/app'
import type {Lang, TranslateFn} from './util/i18n'
import {makeT} from './util/i18n'
import { parseQueryParams } from "./util/utils"








//@ts-ignore
export default function CashcodeLanding(): JSX.Element {

	// ===== State (TS typed) =====
	const [lang, setLang] = useState<Lang>("en")
	const [demoOpen, setDemoOpen] = useState<boolean>(false)
	const [id, setID] = useState('')
	const [wallet, setWallet] = useState('')
	const [amt, setAmt] = useState('')
	const [node, setNote] = useState('')

	const t: TranslateFn = makeT(lang)
	function Header() {
		return (
			<header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
				<div className="flex items-center gap-3">
				{/* ✅ 用 CashcodeLogo 替代原方框 */}
				<div className="h-7 w-7 flex items-center justify-center">
					<CashcodeLogo />
				</div>

				<span className="font-semibold tracking-tight">
					{t("码信钱包", "Cashcode Wallet", "Cashcode ウォレット")}
				</span>
				</div>

				{/* 其余部分保持不变 */}
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
					<button
						onClick={() => setLang("cn")}
						className={`rounded-full border px-2 py-1 text-lg transition ${
							lang === "cn"
								? "bg-[#f0f0f0] text-black border-black"
								: "hover:bg-[#f9f9f9]"
						}`}
					>
						🇨🇳
					</button>

					<button
						onClick={() => setLang("en")}
						className={`rounded-full border px-2 py-1 text-lg transition ${
							lang === "en"
								? "bg-[#f0f0f0] text-black border-black"
								: "hover:bg-[#f9f9f9]"
						}`}
					>
						🇺🇸
					</button>

					<button
						onClick={() => setLang("ja")}
						className={`rounded-full border px-2 py-1 text-lg transition ${
							lang === "ja"
								? "bg-[#f0f0f0] text-black border-black"
								: "hover:bg-[#f9f9f9]"
						}`}
					>
						🇯🇵
					</button>

					<button
						onClick={() => setDemoOpen(true)}
						className="ml-2 rounded-full border border-black px-3 py-1 tracking-wide hover:bg-black hover:text-white transition"
					>
						{t("开始体验", "Get Started", "はじめる")}
					</button>
				</div>
			</div>
			</header>
		)
	}

	function Footer () {
		return (
			<footer className="border-t border-black/10">
				<div className="mx-auto max-w-6xl px-4 py-8 text-xs text-black/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					
					{/* ✅ 左侧：Cashcode 动画图标 + 文本 */}
					<div className="flex items-center gap-2">
					<div className="h-5 w-5 flex items-center justify-center">
						<CashcodeLogo />
					</div>
					<span>© {new Date().getFullYear()} Cashcode / CC钱包</span>
					</div>

					{/* ✅ 右侧：隐私 / 条款 / GitHub */}
					<div className="flex gap-4 items-center">
					<a href="#" className="hover:underline">
						{t("隐私", "Privacy", "プライバシー")}
					</a>
					<a href="#" className="hover:underline">
						{t("条款", "Terms", "利用規約")}
					</a>
					<a
						href="https://github.com/settleonbase/cashcode"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1 hover:text-black"
					>
						<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="w-4 h-4"
						>
						<path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.43 7.86 10.96.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.28-1.67-1.28-1.67-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.74.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.3 1.2-3.12-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.19a11.1 11.1 0 0 1 5.82 0c2.22-1.5 3.2-1.19 3.2-1.19.63 1.59.23 2.76.11 3.05.75.82 1.2 1.86 1.2 3.12 0 4.43-2.7 5.4-5.28 5.68.42.36.8 1.07.8 2.16v3.2c0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
						</svg>
						<span>GitHub</span>
					</a>
					</div>
				</div>
				</footer>
		)
	}

  	useEffect(() => {

		const queryParams = parseQueryParams(window.location.search);
		
		
		// let referrals = ''
		if (queryParams?.size) {

			const id = queryParams.get("id")||''
			const wallet = queryParams.get("wallet")||''
			const _amt =  queryParams.get("amt")||''
			const lang = queryParams.get("lang")||''
			const _note = decodeURIComponent(queryParams.get("note"))||''
			setWallet(wallet)
			setID(id)
			setAmt(_amt)
			setNote(_note)
			setLang(lang)
			makeT(lang)
		}
		
  	},[])

	useEffect(() => {
		if (wallet) {
			setDemoOpen(true)
		}
	},[wallet])


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
		// Listen new block headers to refresh balances dynamically


	const HomeBody = () => {
		return (
			<>
				{/* Hero */}
				<section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
				<div className="grid items-center gap-10 md:grid-cols-2">
					<div>
					<h1 className="text-4xl md:text-5xl font-semibold leading-tight">
						{t("稳定币，发一个码就到账。", "Stablecoins, paid by sharing a code.", "ステーブルコイン、コードを共有するだけで支払い完了。")}
					</h1>
					<p className="mt-4 text-base text-black/70">
						{t(
						"USDC/USDT 的支票码、收款链接与直接 Send，零门槛、可止付/过期、统一账本。",
						"USDC/USDT checks, payment links, and direct Send—zero friction, stop/expiry controls, unified ledger.",
						"USDC/USDTのチェックコード・支払いリンク・ダイレクト送金。学習不要、停止/有効期限、統合台帳。"
						)}
					</p>

					<div className="mt-6 flex flex-wrap items-center gap-3">
						<button
						onClick={() => {
							setWallet('')
							setAmt('')
							setNote('')
							setDemoOpen(true)
						}}
						/* ④ 仅描边按钮补白底，避免 Safari 自动深色化 */
						className="rounded-xl border border-black px-5 py-2 text-sm hover:bg-black hover:text-white transition bg-white"
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

					<div className="mt-4 text-xs uppercase tracking-wider text-black/60">
						{t("USDC • USDT • Base → 之后接入 OP/Arb", "USDC • USDT • Base → OP/Arb (soon)", "USDC・USDT・Base → まもなく OP/Arb 対応")}
					</div>
					</div>

					{/* ② 卡片容器加 overflow-hidden + ios-rounded-fix */}
					<div className="relative mx-auto w-full max-w-sm rounded-2xl border border-black bg-white shadow-[6px_6px_0_#000] p-4 overflow-hidden ios-rounded-fix">
					{/* 顶部标签栏 */}
					<div className="mb-3 grid grid-cols-4 text-xs gap-1">
						<button className="border border-black bg-black text-white rounded-full px-2 py-1">
						{t("支票", "Check", "チェック")}
						</button>
						{/* ③ 非激活按钮补白底 */}
						<button className="border border-black rounded-full px-2 py-1 bg-white">
						{t("收款", "Link", "リンク")}
						</button>
						<button className="border border-black rounded-full px-2 py-1 bg-white">Send</button>
						<button className="border border-black rounded-full px-2 py-1 bg-white">
						{t("账本", "Ledger", "台帳")}
						</button>
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
							onClick={() => {
								setWallet('')
								setAmt('')
								setNote('')
								setDemoOpen(true)
							}}
							/* ④ 仅描边按钮补白底 */
							className="mt-4 w-full rounded-xl border border-black px-3 py-2 text-sm hover:bg-black hover:text-white transition bg-white"
						>
							{t("生成支票码", "Generate check code", "チェックコードを作成")}
						</button>
						</div>

						{/* ⑤ 虚线提示块用白底，避免被深色化变暗 */}
						<div className="rounded-2xl border border-dashed border-black bg-white p-3 text-xs text-black/70">
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
				<h2 className="text-3xl font-semibold">{t("从身边到全球：真实使用场景", "Real-world use cases — from local to global", "身近な場面からグローバルまで：実例")}</h2>
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
					<div className="text-xs uppercase tracking-wide text-black/50"># {t("全球使用：跨境转账 / 家人汇款", "Global: cross-border transfers / remittance", "グローバル：国際送金／家族への送金")}</div>
					<p className="mt-2 text-sm leading-6">
						{t(
						"寄钱给在国外的家人？汇款常常慢、贵、还有限时。用 ‘支票码’，你先锁定 100 USDC 给家人，发一串码即可。对方在任意时区、任意钱包里输入就到账——没有中间机构、没有营业时间。",
						"Sending money across borders? Traditional remittance is slow, expensive and time-boxed. With a ‘check code’, lock 100 USDC for your family and share the code. They redeem in any time zone from their wallet—no intermediaries, no banking hours.",
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
						"Paying small stipends to a global team? Use bulk checks or links. Staff redeem in their local time zones; unclaimed funds auto-refundable; finance exports the ledger in one click.",
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
						"Buyer pays via a link; platform keeps it stoppable until seller marks shipped, then flips to a redeemable check—reducing disputes in cross-border marketplaces.",
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
					onClick={() => {
						setWallet('')
						setAmt('')
						setNote('')
						setDemoOpen(true)
					}}
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
		)
	}


  return (
    <div className="min-h-screen flex flex-col bg-white">

      <Header />
	  <main className="flex-1">
		{
			demoOpen 
			? <CashcodeAPP setDemoOpen={setDemoOpen} lang={lang} id={id} wallet={wallet} amt={amt} note={node}/>
			: <HomeBody />
		}
	  </main>
		

      {/* Footer */}
		<Footer />

      {/* Demo Modal */}
      
    </div>
  );
}
