import { useMemo, useState } from 'react'
import cashcodeIcon from '../assets/cashcode_icon.svg'
import usdcIcon from '../assets/usdc.png'
import {JsonViewer} from './JsonViewer'
import base_ex from '../assets/base-ex.svg'

type ShowSignInfoProps = {
  address: string                              // 0x.. 地址
  originUrl: string                               
  assetDelta?: number                          // 资产变动（负数显示 -0.263）
  assetSymbol?: string                         // 资产符号，例如 USDC
  messageData?: any                // 展开时展示的 Message data 内容
  processing?: boolean                         // 处理中时禁用按钮
  // 可复用你项目里的 t；不传则使用内置版本
  t: (cn: string, en: string, ja?: string) => string
}


const fmtAddr = (a?: string) =>
  !a ? '' : `${a.slice(0, 6)}…${a.slice(-4)}`

const fmtAmount = (n?: number) => {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  const s = Math.abs(n).toFixed(2) // 始终两位小数
  return (n < 0 ? '-' : '') + s
}

export function ConformSignInfo({
  address,
  originUrl,
  assetDelta = -0.263,
  assetSymbol = 'USDC',
  messageData,
  processing = false,
  t
}: ShowSignInfoProps) {
 	const [openMsg, setOpenMsg] = useState(false)
  const assetLine = useMemo(() => {
    const amt = fmtAmount(assetDelta)
    return `${amt} ${assetSymbol}`
  }, [assetDelta, assetSymbol])


  return (
    <div className="">
      {/* Header */}
      	<div className="px-5 pt-1 mb-2">
			<h2 className="text-xl font-semibold font-bold text-center">
			{t('CC 钱包', 'CC Wallet', 'CCウォレット')}
			</h2>
		</div>
	<div className="px-5 pb-3">
        <h4 className="text-l font-semibold text-center">
          {t('确认ERC-3009签名请求', 'Confirm ERC-3009 signature request', '署名ERC-3009リクエストを確認')}
        </h4>

        {/* Signing with ... */}
        <div className="mt-3 flex items-center gap-2 text-black/70">
          <img src={cashcodeIcon} alt="CC" className="w-4 h-4" />
          <div className="text-sm flex items-center">
            {t('正在使用签名：', 'Signing with ', '署名アドレス: ')}
            <span className="font-medium">{fmtAddr(address)}</span>
			<a
			href={`https://basescan.org/address/${address}`}
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
          </div>
        </div>
      </div>

      {/* Review / From host */}
      <div className="px-5 py-3 border-t border-black/10">
        <div className="flex items-center gap-3">
          <img
			src={`${originUrl}/favicon.ico`}
			alt="site icon"
			className="w-9 h-9 rounded"
		/>
          <div className="leading-tight">
            <div className="font-semibold">{t('审阅', 'Review', 'レビュー')}</div>
            <div className="text-sm text-black/60">
              {t('来自', 'Request from', 'リクエスト元')} {originUrl}
            </div>
          </div>
        </div>
      </div>

      {/* Asset changes */}
      <div className="px-5 py-4 border-t border-black/10">
        <div className="text-sm text-black/70">
          {t('资产变动（估算）', 'Asset changes (estimate)', '資産の変化（見積もり）')}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-2xl font-semibold tracking-wide">
            {assetLine}
          </div>
          <div className="w-9 h-9 rounded-full border border-black/10 grid place-items-center text-[12px]">
             <img src={usdcIcon} alt="USDC"/>
            
          </div>
        </div>
      </div>

	  <div className="px-5 py-4 border-t border-black/10">
		<div className="text-sm text-black/70 flex items-center">
			<span className="font-semibold">{t('收款地址', 'Pay to', '支払い先')}</span>：
			<span className="font-mono text-black/80">{fmtAddr(messageData?.payTo)}</span>
			<a
			href={`https://basescan.org/address/${messageData?.payTo}`}
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
		</div>
  	</div>

      {/* Message data (collapsible) */}
      <div className="px-5 py-3 border-t border-black/10">
        <button
          type="button"
          onClick={() => setOpenMsg(v => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-semibold">
            {t('消息数据', 'Message data', 'メッセージデータ')}
          </span>
          <span className="text-black/50">{openMsg ? '▾' : '▸'}</span>
        </button>

        {openMsg && (
			<div className="mt-3 text-sm text-black/70 break-words">
				{messageData ? (
				typeof messageData === "object" ? (
					<JsonViewer data={messageData} />
				) : (
					<pre className="whitespace-pre-wrap font-mono text-[13px] bg-gray-50 rounded-lg p-2 border border-black/10 overflow-x-auto">
					{messageData}
					</pre>
				)
				) : (
				<div className="text-black/50 italic">
					{t(
					"（此处展示要签名的原始数据或摘要）",
					"(Show the raw payload or a summary to be signed here)",
					"（ここに署名対象のペイロードや要約を表示）"
					)}
				</div>
				)}
			</div>
			)}
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-4 text-sm text-black/60 border-t border-black/10">
        {t(
          '签署此请求后，你将允许该 dapp 代表你创建以上资产变动的交易。这些变动可能不会立即生效。',
          'By signing this request, you will allow the dapp to create a transaction for the above asset changes in the future. Those changes may not occur immediately.',
          'このリクエストに署名すると、dapp が上記の資産変化の取引を作成することを許可します。これらの変化はすぐに反映されない場合があります。'
        )}
      </div>

      {/* Footer buttons */}
      <div className="px-5 pb-5 pt-3 grid grid-cols-2 gap-3 border-t border-black/10">
        <button
          type="button"
          disabled={processing}
          onClick={() => {
				window.dispatchEvent(new CustomEvent("sign:final", { detail: { action: "cancel" } }))
		  }}
          className={`
            h-11 rounded-2xl border border-black/20
            text-black/80 transition
            ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/10'}
          `}
        >
          {t('取消', 'Cancel', 'キャンセル')}
        </button>
        <button
          type="button"
          disabled={processing}
          onClick={() => {
			window.dispatchEvent(new CustomEvent("sign:final", { detail: { action: "sign" } }))
				
		  }}
          className={`
            h-11 rounded-2xl
            bg-[#2c4cff] text-white font-medium
            transition ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}
          `}
        >
          {t('签名', 'Sign', '署名')}
        </button>
      </div>
    </div>
  )
}
