import { QRCodeCanvas } from "qrcode.react"
import cashcodeIcon from '../assets/cashcode_icon.svg'
import {shortAddr} from '../util/utils'

const copy = async (text: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		// noop
	}
}


type ResultShape = {
	code?: string
	url?: string
} 


export default function ShowPaymentUrl ({result, t, account}: {account: string, result: ResultShape, t: (cn: string, en: string, ja?: string) => string }) {
	return (
		<div className="p-4 bg-white text-black rounded-2xl border border-black/5 shadow-sm">
			{/* <h4 className="font-semibold text-sm">
			{t("结果 / 分享", "Result / Share", "結果 / 共有")}
			</h4> */}

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
	)
}