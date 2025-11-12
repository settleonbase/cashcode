import {
  	PaymentRequirementsSchema,
} from "x402/types"

// import {
// 	createPaymentHeader,
// 	selectPaymentRequirements
// } from "x402/client"

import { useState, useEffect } from 'react'
import {ConformSignInfo} from './conformX402Sign'
import {getCCWallet, AuthorizationSign, getCCWalletPrivateKey} from '../util/utils'
import {ethers} from 'ethers'

type Props = {
	url: string
	final: (data: any) => void
	t: (cn: string, en: string, ja?: string) => string

}

const usdc_Numeric = 6

export default function CCWallet_Sign ({url, final, t} :Props) {
	const [showSign, setShowSign] = useState(false)
	const [ccWallet] = useState(getCCWallet())
	const [requestOrigin, setRequestOrigin] = useState('')
	const [messageData, setMessageData] = useState()
	const [amount, setAmount] = useState(0)
	const [parsedPaymentRequirements, setParsedPaymentRequirements] = useState<any>()


	useEffect(() => {
		processFetch()
	}, [])

	// const origin = typeof window !== "undefined" && window?.location?.origin ? window.location.origin : "https://cashcode.app"

	
	const processFetch = async () => {
		const response = await fetch(url, {
			method: 'GET'
		})

		if (response.status !== 402) {
			return final(null)
		}
		

		const { x402Version, accepts } = await response.json()
		const parsedPaymentRequirements = accepts.map((x: any) => PaymentRequirementsSchema.parse(x))?.[0]
		setParsedPaymentRequirements(parsedPaymentRequirements)
		if (!parsedPaymentRequirements|| !parsedPaymentRequirements.maxAmountRequired || !parsedPaymentRequirements.payTo) {
			return final(null)
		}
		console.log(parsedPaymentRequirements, x402Version)
		//const urlObj = new URL(url)

		setRequestOrigin('https://settleonbase.xyz')
		const usdc = ethers.formatUnits(parsedPaymentRequirements.maxAmountRequired, usdc_Numeric)
		setAmount(Number(usdc))

		setShowSign(true)

		setMessageData(parsedPaymentRequirements)

	}

	const SelectWalletComp = () => {
		const signRequest = async () => {
			const privateKey = getCCWalletPrivateKey()
			if (parsedPaymentRequirements && parsedPaymentRequirements?.maxAmountRequired && privateKey ) {
				console.log(`SelectWalletComp doing AuthorizationSign`)
				const paymentHeader = await AuthorizationSign(parsedPaymentRequirements.maxAmountRequired, parsedPaymentRequirements.payTo)
				console.log(paymentHeader)
				const newInit = {
					method: 'GET',
					headers: {
						
						"X-PAYMENT": paymentHeader,
						"Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE"
					},
					__is402Retry: true
				}
				try {
					const secondResponse = await fetch(url, newInit)
					const body = await secondResponse.json()
					console.log(secondResponse.ok)
					if (!secondResponse.ok) {
						return final(null)
					}
					return final(body)
				} catch (ex) {
					
					return final(null)
					
				}
				
				
			}
		}
		useEffect(() => {
			const onSignFinal = (e: any) => {
				const { action } = e.detail || {}

				if (action === "sign") {
					
					signRequest()
		

					console.log("✅ 用户点击签名")
					
					return final(true)
				}
				
				console.log("❌ 用户取消签名")
				final(false)
				
			}

			window.addEventListener("sign:final", onSignFinal)

			return () => {
				window.removeEventListener("sign:final", onSignFinal)
			}
		}, [])

		return (
			<ConformSignInfo t={t} address={ccWallet} originUrl={requestOrigin} messageData={messageData} assetDelta={amount} />
		)
	}


	return (
		<>
			{
				showSign ? <SelectWalletComp /> : (
					<div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
						<span className="text-sm font-medium text-black/70">
						{
							t("处理中", "Processing", "処理中")
						}
						</span>
					</div>
				)
			}
		</>
	)
}