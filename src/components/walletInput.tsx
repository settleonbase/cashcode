import { useState } from 'react'
import { ethers } from 'ethers'

interface WalletInputProps {
  t: (cn: string, en: string, ja?: string) => string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function WalletInput({ t, value, onChange }: WalletInputProps) {
  const [invalid, setInvalid] = useState(false)

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        const val = e.currentTarget.value.trim()
		
        if (val.length > 0 && !ethers.isAddress(val)) {
			setInvalid(true)
			setTimeout(() => setInvalid(false), 4000)
        }
        onChange(e) // 👈 通知父组件
      }}
      
      placeholder={t(
        '请输入接收资产钱包地址',
        'Enter wallet address',
        'ウォレットアドレスを入力してください'
      )}
      className={`
        w-full outline-none border-0 border-b border-black/20
        text-sm text-slate-800 pb-1 text-center placeholder-black/30
        focus:border-black/50 transition-colors
        ${invalid ? 'bg-red-100' : 'bg-transparent'}
      `}
    />
  )
}