// 轻量把 EIP-1193 provider 封成 viem 的 WalletClient
import { createWalletClient, custom, type WalletClient } from "viem";
import { base } from "viem/chains";

export function toWalletClient(
	provider: any,
	account: string,
	// chainIdHex?: string
): WalletClient {
  // 如果不是 Base，你也可以根据 chainIdHex 动态选择链；当前项目固定 Base:
  const chain = base;

	return createWalletClient({
		account: account as any,
		chain,
		transport: custom(provider),
	});
}