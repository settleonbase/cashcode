// import bs58 from "bs58"
import { type Lang } from "../util/i18n"
const uuid62 = require('uuid62')
import {ethers, parseUnits} from 'ethers'
import { wrapFetchWithPayment } from "x402-fetch";
import {type x402Response} from '../util/eip6963'

export const customJsonStringify = (item: any) => {
  const result = JSON.stringify(
    item,
    (_, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
  );
  return result;
};

export const formatMinutesToHHMM = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:00`;
}





/**
 * 将金额格式化为人类可读的文字形式
 * @param amount number | string
 * @param lang "cn" | "en" | "ja"
 * @param currency 货币代码，如 USDC、JPY
 */
export function formatAmountReadable(amount: number | string, lang: Lang, currency: string): string {
	const code = (currency || "").toUpperCase()

	// 统一解析数值（兼容 string）
	let n: number
	if (typeof amount === "number") n = amount
	else {
		const cleaned = amount.replace(/[^\d.-]/g, "")
		const parsed = parseFloat(cleaned)
		n = Number.isFinite(parsed) ? parsed : 0
	}

	if (lang === "cn") {
		// 中文：直接用 toChineseNumber（内含“元/角/分”），不要再额外拼 “元”
		const name = CURRENCY_CN[code] || code
		return `${name} ${toChineseNumber(n)}`
	}

	// 其它语言维持整数可读（如需带小数，可改为 n.toLocaleString）
	const intPart = Math.floor(Math.max(0, n))

	if (lang === "ja") {
		const CURRENCY_JA: Record<string, string> = {
			USD: "米", USDC: "米", USDT: "米",
			EUR: "ユーロ", JPY: "円", CNY: "人民元", HKD: "香港ドル",
			GBP: "英ポンド", AUD: "豪ドル", CAD: "カナダドル",
			SGD: "シンガポールドル", TWD: "ニュー台湾ドル",
		}
		const name = CURRENCY_JA[code] || code
		return `${name} ${toJapaneseNumber(n)}`
	}

	if (lang === "en") return toEnglishCheckWords(amount)

	return `${code} ${intPart.toLocaleString("en-US")}`
}


function intToEnglishBig(n: bigint): string {
	if (n === 0n) return "zero";

	const below20 = ["","one","two","three","four","five","six","seven","eight","nine","ten",
		"eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
	const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
	const scales = ["","thousand","million","billion","trillion","quadrillion","quintillion"];

	const chunkToWords = (x: number): string => {
		const h = Math.floor(x / 100);
		const t = x % 100;
		const u = x % 10;
		const out: string[] = [];
		if (h) out.push(below20[h], "hundred");
		if (t) {
			if (t < 20) out.push(below20[t]);
			else {
				const tw = tens[Math.floor(t / 10)];
				out.push(u ? `${tw}-${below20[u]}` : tw);
			}
		}
		return out.join(" ").trim();
	};

	const parts: string[] = [];
	let i = 0;
	while (n > 0n) {
		const chunk = Number(n % 1000n);
		if (chunk) {
			const w = chunkToWords(chunk);
			const s = scales[i];
			parts.unshift(s ? `${w} ${s}` : w);
		}
		n = n / 1000n;
		i++;
	}
	return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function toEnglishCheckWords(input: number | string): string {
	// 1) 统一为字符串，清理除 0-9 . - 之外的字符
	let s = typeof input === "number" ? input.toFixed(10) : String(input || "");
	console.log("原始输入:", s);
	
	s = s.replace(/[^\d.-]/g, "").trim();
	if (!s || s === "-" || s === "." || s === "-.") s = "0";

	// 2) 处理负号
	const negative = s.startsWith("-");
	if (negative) s = s.slice(1);

	// 3) 只认**第一个**小数点为分隔，小数取两位（不足补零，超出截断）
	const dot = s.indexOf(".");
	const intRaw = dot >= 0 ? s.slice(0, dot) : s;
	const fracRaw = dot >= 0 ? s.slice(dot + 1) : "";
	
	console.log("intRaw:", intRaw, "fracRaw:", fracRaw);
	
	const intStr = (intRaw.replace(/^0+(?=\d)/, "") || "0"); // 去前导零但至少留一位
	const fracTwo = (fracRaw + "00").slice(0, 2);

	console.log("intStr:", intStr, "fracTwo:", fracTwo);

	// 4) 防御性：整数部分如果为空/非数字，按 0；用 BigInt 防止被截断
	const dollars = intStr === "" ? 0n : BigInt(intStr);
	const cents = Number(fracTwo); // 0..99

	console.log("dollars:", dollars, "cents:", cents);

	// 5) 转英文
	const words = intToEnglishBig(dollars);
	console.log("words:", words);
	
	const fraction = String(cents).padStart(2, "0");
	const sign = negative ? "Negative " : "";

	// 6) 首字母大写 + 支票尾巴
	const start = words ? words.charAt(0).toUpperCase() + words.slice(1) : "Zero";
	const result = `${sign}${start} and ${fraction}/100 dollars`;
	console.log("最终结果:", result);
	
	return result;
}


const CURRENCY_CN: Record<string, string> = {
  USD: "美元", USDC: "美元", USDT: "美元",
  EUR: "欧元",
  JPY: "日元",
  CNY: "人民币", CNH: "离岸人民币",
  HKD: "港元",
  GBP: "英镑",
  AUD: "澳元",
  CAD: "加元",
  SGD: "新元",
  TWD: "新台币",
}




export const generateCODE = (passcode: string) => {
	const code: string = uuid62.v4()
	const hash = ethers.solidityPackedKeccak256(['string', 'string'], [code, passcode])
	return ({
		code, hash
	})
	
}



/** 日语金融漢数字（壱 弐 参 肆 伍 陸 漆 捌 玖 零），支持小数（角/分） */
function toJapaneseNumber(input: number | string): string {
	let n: number
	if (typeof input === "number") n = input
	else {
		const cleaned = input.trim().replace(/[^\d.-]/g, "")
		const parsed = parseFloat(cleaned)
		n = Number.isFinite(parsed) ? parsed : 0
	}

	const negative = n < 0
	n = Math.abs(n)

	const cents = Math.round(n * 100)
	const intPart = Math.floor(cents / 100)
	const jiao = Math.floor((cents % 100) / 10)
	const fen = cents % 10

	// ✅ 金融漢数字（日语）
	const digits = ["零", "壱", "弐", "参", "肆", "伍", "陸", "漆", "捌", "玖"]
	const unitsSmall = ["", "拾", "百", "千"]
	const unitsSection = ["", "万", "億", "兆"]

	const sectionToJP = (num: number): string => {
		if (num === 0) return ""
		let s = ""
		for (let i = 0; i < 4; i++) {
		const d = num % 10
		if (d !== 0) {
			const digitStr = (d === 1 && i > 0) ? "" : digits[d]
			s = digitStr + unitsSmall[i] + s
		} else if (!s.startsWith("零") && s !== "") {
			s = "零" + s
		}
		num = Math.floor(num / 10)
		if (num === 0) break
		}
		return s.replace(/零+/g, "零").replace(/^零|零$/g, "")
	}

	let intCN = ""
	if (intPart === 0) {
		intCN = "零"
	} else {
		let nLeft = intPart
		let unitIndex = 0
		while (nLeft > 0 && unitIndex < unitsSection.length) {
		const section = nLeft % 10000
		if (section !== 0) {
			const head = sectionToJP(section)
			intCN = head + unitsSection[unitIndex] + intCN
		} else if (!intCN.startsWith("零") && intCN !== "") {
			intCN = "零" + intCN
		}
		nLeft = Math.floor(nLeft / 10000)
		unitIndex++
		}
		intCN = intCN.replace(/零+/g, "零").replace(/^零|零$/g, "")
	}

	let fracCN = ""
	if (jiao === 0 && fen === 0) {
		fracCN = "整"
	} else if (jiao === 0 && fen !== 0) {
		fracCN = "零" + digits[fen] + "分"
	} else if (jiao !== 0 && fen === 0) {
		fracCN = digits[jiao] + "角"
	} else {
		fracCN = digits[jiao] + "角" + digits[fen] + "分"
	}

	const sign = negative ? "マイナス " : ""
	return sign + intCN + "ドル" + (fracCN ? fracCN : "")
}

/** 中文数字（整数部分），支持到兆 */
function toChineseNumber(input: number | string): string {
	// 输入清理
	let n: number
	if (typeof input === "number") n = input
	else {
		const cleaned = input.trim().replace(/[^\d.-]/g, "")
		const parsed = parseFloat(cleaned)
		n = Number.isFinite(parsed) ? parsed : 0
	}

	const negative = n < 0
	n = Math.abs(n)

	// 四舍五入到分
	const cents = Math.round(n * 100)
	const intPart = Math.floor(cents / 100)
	const jiao = Math.floor((cents % 100) / 10)
	const fen = cents % 10

	// 金融大写数字与单位
	const digits = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"]
	const unitsSmall = ["", "拾", "佰", "仟"]
	const unitsSection = ["", "万", "亿", "兆"]

	/** 0~9999 内的转换（节内简化规则：非最高位的“壹拾/佰/仟”可省略壹） */
	const sectionToCN = (num: number): string => {
		if (num === 0) return ""
		let s = ""
		const str = String(num)
		const len = str.length
		for (let i = 0; i < len; i++) {
		const d = parseInt(str[len - 1 - i])
		if (d === 0) {
			if (!s.startsWith("零") && s !== "") s = "零" + s
		} else {
			const isHighPos = i === len - 1 // 节最高位不省略
			const digitStr = (d === 1 && i > 0 && !isHighPos) ? "" : digits[d]
			s = digitStr + unitsSmall[i] + s
		}
		}
		return s.replace(/零+/g, "零").replace(/^零|零$/g, "")
	}

	// 整数部分
	let intCN = ""
	if (intPart === 0) {
		intCN = "零"
	} else {
		let nLeft = intPart
		let unitIndex = 0
		while (nLeft > 0 && unitIndex < unitsSection.length) {
		const section = nLeft % 10000
		if (section !== 0) {
			const head = sectionToCN(section)
			intCN = head + unitsSection[unitIndex] + intCN
		} else if (!intCN.startsWith("零") && intCN !== "") {
			intCN = "零" + intCN
		}
		nLeft = Math.floor(nLeft / 10000)
		unitIndex++
		}
		intCN = intCN.replace(/零+/g, "零").replace(/^零|零$/g, "")
	}

	// 小数部分（角/分）
	let fracCN = ""
	if (jiao === 0 && fen === 0) {
		fracCN = "整"
	} else if (jiao === 0 && fen !== 0) {
		fracCN = "零" + digits[fen] + "分"
	} else if (jiao !== 0 && fen === 0) {
		fracCN = digits[jiao] + "角"
	} else {
		fracCN = digits[jiao] + "角" + digits[fen] + "分"
	}

	const sign = negative ? "负" : ""
	return sign + intCN + "元" + fracCN
}

export function shortAddr(addr?: string | null): string {
  if (!addr || typeof addr !== "string") return "";
  const trimmed = addr.trim();
  if (trimmed.length <= 10) return trimmed; // 太短就原样返回
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}


export const parseQueryParams = (queryString: string) => {
  const params = new Map();

  // Remove the leading '?' if present
  const cleanQueryString = queryString.startsWith("?")
    ? queryString.slice(1)
    : queryString;

  // Split the string into key-value pairs
  const pairs = cleanQueryString.split("&");

  for (const pair of pairs) {
    // Split each pair into key and value
    const [key, value] = pair.split("=").map(decodeURIComponent);
    // Only add if key is not undefined
    if (key) {
      params.set(key, value || "");
    }
  }

  return params;
}




export const getPlanDuration = (passportInfo: any) => {
  if (String(passportInfo?.expiresDays) === "7") return "Free for 7 days";
  if (String(passportInfo?.expiresDays) === "30") return "Monthly Plan";
  if (String(passportInfo?.expiresDays) === "365") return "Yearly Plan";
  if (String(passportInfo?.expiresDays) > "365") return "Unlimited";
  if (String(passportInfo?.expiresDays) === "0") return "";
};

export const calcSpInUsd = (sp9999: string) => {
  const sp9999Number = Number(sp9999)
  const _spInUsd = 99.99 / sp9999Number
  return _spInUsd
}

const insertCommas = (str: string): string => {
  const [intPart, decimalPart] = str.split('.')
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (decimalPart ? '.' + decimalPart : '')
}

export const parseFormattedNumber = (str: string): number => {
  const cleanStr = str.replace(/,/g, '').trim().toUpperCase()
  if (cleanStr.endsWith('K')) {
    return parseFloat(cleanStr.slice(0, -1)) * 1_000
  } else if (cleanStr.endsWith('M')) {
    return parseFloat(cleanStr.slice(0, -1)) * 1_000_000
  } else {
    return parseFloat(cleanStr)
  }
}

export const formatNumber = (_value: string): string => {
  const value = parseFloat(_value)
  if (value >= 1_000_000_000) {
    const millions = value / 1_000_000
    return insertCommas(millions.toFixed(1)) + 'M'
  } else if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M'
  } else if (value >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K'
  } else {
    return value.toFixed(4)
  }
}






type FindResult<R> = { index: number; value: R } | null;

export async function findAsync<T, R>(
  items: readonly T[],
  worker: (item: T, ctx: { index: number; signal: AbortSignal }) => Promise<R | undefined>,
  opts?: { concurrency?: number }
): Promise<FindResult<R>> {
  const concurrency = Math.max(1, opts?.concurrency ?? 4);
  if (items.length === 0) return null;

  let next = 0;
  let found: FindResult<R> = null;
  let stopped = false;

  // 所有 worker 共享一个 AbortController，用于全局早停
  const controller = new AbortController();
  const { signal } = controller;

  // 跑一个工作单元
  const runOne = async () => {
    while (!stopped) {
      const i = next++;
      if (i >= items.length) return; // 没活了

      try {
        const maybe = await worker(items[i], { index: i, signal });
        if (maybe !== undefined && !stopped) {
          found = { index: i, value: maybe };
          stopped = true;
          controller.abort();       // 通知其它在途任务终止
          return;
        }
      } catch (err) {
        // 被 abort 时，很多 I/O 会抛 AbortError，这里静默即可
        // 你也可以按需记录非 Abort 的错误
        if (!(err instanceof Error && (err as any).name === 'AbortError')) {
          // console.debug('worker error @', i, err);
        }
        if (stopped) return;
      }
    }
  };

  // 启动有上限的 worker 池
  const runners: Promise<void>[] = [];
  for (let k = 0; k < Math.min(concurrency, items.length); k++) {
    runners.push(runOne());
  }
  await Promise.allSettled(runners); // 等全部收尾（或被早停）

  return found;
}


export function pickApprovedProvider(): any | null {
		const w = window as any;
		const eth = w.ethereum;
		if (!eth) return null;
		const providers: any[] = Array.isArray(eth?.providers) ? eth.providers : [eth];
		// 优先顺序：MetaMask > Coinbase > OKX
		const pick =
			providers.find(p => p.isMetaMask) ??
			providers.find(p => (p as any).isCoinbaseWallet) ??
			providers.find(p => (p as any).isOkxWallet) ??
			providers[0] ?? null;
			return pick || null;
	}

export type EIP1193Provider = {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  request: (args: { method: string; params?: any[] | object }) => Promise<any>;
  on?: (event: string, cb: (...args: any[]) => void) => void;
  removeListener?: (event: string, cb: (...args: any[]) => void) => void;
}

export function showTermAlert(message: string, success = true, hash = "") {
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

 // 千分位格式化（固定两位小数）
export const formatWithThousands = (n: string | number): string => {
	const num = Number(n)
	if (isNaN(num)) return "0.00"

	const [intPart, decPart = "00"] = num.toFixed(2).split(".")
	const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	return `${intWithCommas}.${decPart}`
}

export function getCCWallet() {
	try {
		const raw = localStorage.getItem('ccWallet')
		if (!raw) return createCCWallet()

		const data = JSON.parse(raw)

		// ✅ 可选：校验数据结构（防止被污染）
		if (typeof data !== 'object' || data === null) return createCCWallet()

		return data?.address
	} catch (err) {
		console.error('getCCWallet error:', err)
		return null
	}
}

export function createCCWallet() {
	try {
		// 1️⃣ 生成随机钱包
		const wallet = ethers.Wallet.createRandom()

		// 2️⃣ 构造保存的数据（⚠️ 不建议在生产环境明文保存私钥）
		const ccWallet = {
			address: wallet.address,
			privateKey: wallet.privateKey,
			mnemonic: wallet.mnemonic?.phrase || null,
			createdAt: Date.now(),
		}

		// 3️⃣ 存入 localStorage
		localStorage.setItem('ccWallet', JSON.stringify(ccWallet))

		// 4️⃣ 返回钱包对象
		return ccWallet.address
	} catch (err) {
		console.error('createCCWallet error:', err)
		return null
	}
}


export async function getBalance(address: string): Promise<any> {
	if (!address) return null

	const url = `https://api.settleonbase.xyz/api/getBalance?address=${encodeURIComponent(address)}`

	try {
		const response = await fetch(url)
		if (!response.ok) {
			console.error(`getBalance error: HTTP ${response.status}`)
			return null
		}

		const data = await response.json()
		// 假设返回格式为 { balance: 123.45 }
		return data

		return null
	} catch (err) {
		console.error('getBalance fetch error:', err)
		return null
	}
}

export const x402Payment = async (
  recipient: string,
  amt: string,
  account: string,
  walletClient: any
): Promise<string> => {
  if (!account || !walletClient) {
    (window as any).openConnectWallet?.()
    window.dispatchEvent(new CustomEvent('wallet:openConnectModal'))
    return ''
  }

  const params = new URLSearchParams({ amt, ccy: 'USDC', wallet: recipient }).toString()
  const path = `/api/settle?${params}`

  try {
    const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient, parseUnits(amt, 6))
    const remote = 'https://api.settleonbase.xyz' + path
    // const local = "http://localhost:4088" + path

    // ==== 增加超时控制 ====
    const timeoutMs = 10000 // 30 秒
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    })

    const response = await Promise.race([
      fetchWithPayment(remote, { method: 'GET' }),
      timeoutPromise
    ])
    // =====================

    if (response && (response as Response).ok) {
      const data: x402Response = await (response as Response).json()
      console.log('✅ Purchase success:', data)
      return data.USDC_tx as string
    } else {
      showTermAlert('Response error', false)
      console.log('❌ Response error:', response)
      return ''
    }
  } catch (ex: any) {
    if (ex.message === 'Timeout') {
      showTermAlert('请求超时，请稍后再试', false)
      console.log('⏰ Request timeout')
    } else {
      showTermAlert('Response error', false)
      console.log('❌ Exception:', ex)
    }
    return ''
  }
}