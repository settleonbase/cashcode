// import bs58 from "bs58"
import { type Lang } from "../util/i18n"

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
const JA_NUM = ["零","一","二","三","四","五","六","七","八","九"];
const JA_UNITS_SMALL = ["", "十", "百", "千"];    // 個・十・百・千
const JA_UNITS_BIG   = ["", "万", "億", "兆"];    // 万・億・兆

const CN_NUM = ["零","一","二","三","四","五","六","七","八","九"];
const CN_UNITS = ["","十","百","千"];
const CN_BIG_UNITS = ["","万","亿","兆"]; // 需要更大可以继续加

/* ---------------- 中文 ---------------- */
function formatNumberToChinese(input: number | string): string {
	if (input === null || input === undefined || input === "") return "零";

	const str = String(input).trim();
	if (!/^\d+(\.\d+)?$/.test(str)) return "零";

	const [intStr, decStr] = str.split(".");
	const num = Number(intStr);
	if (num === 0) return decStr ? "零点" + decStr.split("").map(n => CN_NUM[+n]).join("") : "零";

	const parts: string[] = [];
	let sectionIdx = 0;
	let n = num;

	while (n > 0) {
		const section = n % 10000;                  // 每 4 位一组
		if (section !== 0) {
		const secText = sectionToChinese(section);
		parts.unshift(secText + CN_BIG_UNITS[sectionIdx]);
		} else {
		// 该节是 0，但如果前面已有非空段且最前不以“零”开头，补一个“零”
		if (parts.length > 0 && !parts[0].startsWith("零")) {
			parts.unshift("零");
		}
		}
		n = Math.floor(n / 10000);
		sectionIdx++;
	}

	// 合并并清理多余“零”
	let result = parts.join("")
		.replace(/零+/g, "零")
		.replace(/零$/g, "");

	// 小数部分
	if (decStr) {
		const dec = decStr.split("").map(d => CN_NUM[+d]).join("");
		result += "点" + dec;
	}
	return result;
}

/* ---------------- 英文 ---------------- */
function formatNumberToEnglish(num: number): string {
	const formatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
	return formatter.format(num); // e.g. 10200 → 10.2K
}

function sectionToJapanese(section: number): string {
	// 将 0..9999 转为日文，处理“十/百/千”前导的一省略“一”
	let res = "";
	let zeroPending = false;

	for (let i = 3; i >= 0; i--) { // 千→百→十→个
		const div = Math.pow(10, i);
		const digit = Math.floor(section / div) % 10;

		if (digit === 0) {
		// 仅当已有内容后遇到非末尾 0 时，标记待补“零”
		if (res !== "") zeroPending = true;
		} else {
		if (zeroPending) {
			res += "零";
			zeroPending = false;
		}
		// 规则：开头位置且 digit==1 且是十/百/千时，省略“一”
		if (!(res === "" && digit === 1 && i > 0)) {
			res += JA_NUM[digit];
		}
		res += JA_UNITS_SMALL[i];
		}
	}
	return res || "零";
}

function intToJapanese(n: number): string {
  // 每 4 位分一节（万进制）：XXXX | XXXX | ...
  let parts: string[] = [];
  let bigIdx = 0;
  while (n > 0) {
    const sec = n % 10000;
    if (sec !== 0) {
      const s = sectionToJapanese(sec);
      parts.unshift(s + JA_UNITS_BIG[bigIdx]);
    } else {
      // 该节为 0：仅在已有前缀时补“零”分隔，避免“零十…”
      if (parts.length > 0 && !parts[0].startsWith("零")) {
        parts.unshift("零");
      }
    }
    n = Math.floor(n / 10000);
    bigIdx++;
  }

  // 合并并清理
  let res = parts.join("");
  res = res.replace(/零+/g, "零").replace(/零$/g, "");
  return res;
}

/* ---------------- 日文 ---------------- */
function formatNumberToJapanese(input: number): string {
	  if (input === null || input === undefined) return "零";
		const raw = String(input).trim();
		if (!/^\d+(\.\d+)?$/.test(raw)) return "零";

		const [intStr, decStr] = raw.split(".");

		// 整数 0 的特殊处理
		const intNum = Number(intStr || "0");
		let intText = "";
		if (intNum === 0) {
			intText = "零";
		} else {
			intText = intToJapanese(intNum);
			// 清理“零”堆积
			intText = intText.replace(/零+/g, "零").replace(/零$/g, "");
			if (intText === "") intText = "零";
		}

		// 小数部分（逐位读出），允许保留输入中的 0：e.g. 10.090 → 「十点零九零」
		if (decStr && decStr.length > 0) {
			const dec = decStr.split("").map(ch => JA_NUM[+ch]).join("");
			return intText + "点" + dec;
		}
		return intText;
}


function sectionToChinese(section: number): string {
  // 0..9999 转中文
  let res = "";
  let zero = false; // 上一位是否为 0

  for (let i = 3; i >= 0; i--) {
    const divisor = Math.pow(10, i);
    const digit = Math.floor(section / divisor) % 10;

    if (digit === 0) {
      zero = res !== ""; // 只有前面有内容时，后续遇零才可能加“零”
    } else {
      if (zero) {
        res += "零";
        zero = false;
      }
      // 省略“ 一十 … ”中的“一”
      if (!(i === 1 && digit === 1 && res === "")) {
        res += CN_NUM[digit];
      }
      res += CN_UNITS[i];
    }
  }

  return res || "零";
}

/**
 * 根据金额数值返回人类可读形式
 * @param amount  数字或字符串金额（例如 "10200"）
 * @param lang    语言：'zh' | 'en' | 'ja'
 */
export function formatAmountReadable(amount: number | string, lang: Lang): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "";
  const num = Number(amount);

  if (lang === "en") {
    return formatNumberToEnglish(num);
  } else if (lang === "ja") {
    return formatNumberToJapanese(num);
  } else {
    return formatNumberToChinese(num);
  }
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
};