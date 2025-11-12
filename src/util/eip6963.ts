export type EIP1193Provider = {
  request: (args: { method: string; params?: any[] | object }) => Promise<any>;
  on?: (event: string, cb: (...args: any[]) => void) => void;
  removeListener?: (event: string, cb: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
};

type EIP6963ProviderDetail = {
  info: {
    uuid: string;      // wallet instance id
    name: string;      // "MetaMask" / "Trust Wallet" / ...
    icon: string;      // data url
    rdns: string;      // reverse-dns id, 用来精准识别
  };
  provider: EIP1193Provider;
};

const discovered = new Map<string, EIP6963ProviderDetail>(); // key: rdns

export function initEIP6963Discovery() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__EIP6963_INIT__) return; // 避免重复初始化
  w.__EIP6963_INIT__ = true;

  const onAnnounce = (ev: any) => {
    const detail: EIP6963ProviderDetail | undefined = ev?.detail;
    if (!detail?.info?.rdns) return;
    discovered.set(detail.info.rdns, detail);
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce as any);
  // 主动请求所有钱包广播自己
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function pickByRDNS(rdnsList: string[]): EIP1193Provider | undefined {
  for (const rdns of rdnsList) {
    const hit = discovered.get(rdns);
    if (hit) return hit.provider;
  }
  return undefined;
}

export type x402Response = {
	timestamp: string
	network: string
	payer: string
	success: boolean
	USDC_tx?: string
	SETTLE_tx?: string
}