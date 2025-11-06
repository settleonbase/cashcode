import { pickByRDNS } from "./eip6963"

export type WalletKind = "metamask" | "coinbase" | "okx";

const RDNS_MAP: Record<WalletKind, string[]> = {
  metamask: ["io.metamask", "io.metamask.flask"],
  coinbase: ["com.coinbase.wallet", "com.coinbase.wallet.extension"],
  okx: ["com.okex.wallet", "com.okx.wallet"],
};

export function pickProvider(kind: WalletKind): any | undefined {
  const w = window as any;
  const eth = w.ethereum;

  // A) EIP-6963 by RDNS（ConnectWallet.tsx 就靠这个成功了）
  const byRdns = pickByRDNS(RDNS_MAP[kind] || []);
  if (byRdns) return byRdns;

  // B) OKX 专有挂点（很多场景有）
  if (kind === "okx" && w.okxwallet?.ethereum) return w.okxwallet.ethereum;

  // C) 多 provider（MetaMask + OKX + Coinbase 并存）
  if (Array.isArray(eth?.providers)) {
    const arr = eth.providers as any[];
    const match = arr.find(p =>
      kind === "metamask" ? p?.isMetaMask
      : kind === "coinbase" ? p?.isCoinbaseWallet
      : /* okx */           p?.isOkxWallet || p?.isOKExWallet || /okx|okex/i.test(String(p?.id ?? p?._name ?? ""))
    );
    if (match) return match;
  }

  // D) 单一 provider
  if (eth) {
    if (kind === "metamask" && eth.isMetaMask) return eth;
    if (kind === "coinbase" && eth.isCoinbaseWallet) return eth;
    if (kind === "okx" && (eth as any).isOkxWallet) return eth;
  }

  // E) coinbaseWalletExtension 兜底
  if (kind === "coinbase" && w.coinbaseWalletExtension?.isCoinbaseWallet) {
    return w.coinbaseWalletExtension;
  }

  // F) Trust Wallet 假阳性兜底
  if ((eth as any)?.isTrust) return undefined;

  return undefined;
}

// 调试：打印当前注入
export function debugProviders(tag = "wallet") {
  const w = window as any;
  const eth = w.ethereum;
  const list = (Array.isArray(eth?.providers) ? eth.providers : [eth]).filter(Boolean);
  console.table(list.map((p: any, i: number) => ({
    idx: i,
    isMetaMask: !!p?.isMetaMask,
    isCoinbaseWallet: !!p?.isCoinbaseWallet,
    isOkxWallet: !!p?.isOkxWallet || !!p?.isOKExWallet,
    id: p?.id ?? p?._name ?? "",
    hasRequest: typeof p?.request === "function",
  })));
  console.log(`[${tag}] okxwallet`, !!w.okxwallet, w.okxwallet?.ethereum);
}