import React, { useEffect, useRef, useState } from 'react'


type PasscodeInputProps = {
	length?: number
	autoFocus?: boolean
	disabled?: boolean
	onChange?: (val: string) => void
	onComplete?: (val: string) => void
	className?: string
}

export default function PasscodeInput({
	length = 6,
	autoFocus = true,
	disabled = false,
	onChange,
	onComplete,
	className = ''
}: PasscodeInputProps) {
	const [values, setValues] = useState<string[]>(() => Array.from({ length }, () => ''))
	const inputsRef = useRef<Array<HTMLInputElement | null>>([])


	const setInputRef = (idx: number) => (el: HTMLInputElement | null) => {
		inputsRef.current[idx] = el
	}

	const focusAt = (idx: number) => {
		const el = inputsRef.current[idx]
		if (el) {
		el.focus()
		el.select()
		}
	}

	useEffect(() => {
		if (!disabled && autoFocus) {
		requestAnimationFrame(() => focusAt(0))
		}
	}, [autoFocus, disabled])

	// ✅ 本地函数：输入完成后的逻辑
	const finishedInput = () => {

	}

  // 监控变化
  useEffect(() => {
		const v = values.join('')
		onChange?.(v)

		if (v.length === length && !v.includes('')) {
			onComplete?.(v)
			finishedInput() // ✅ 调用本地函数
		}
  }, [values, length, onChange, onComplete])

  const setCharAt = (idx: number, ch: string) => {
	setValues(prev => {
		const next = prev.slice()
		next[idx] = ch
		return next
	})
  }

  const handleChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value
		const digit = raw.replace(/\D/g, '').slice(0, 1)
		if (!digit) {
		setCharAt(idx, '')
		return
		}
		setCharAt(idx, digit)
		if (idx < length - 1) focusAt(idx + 1)
  }

  const handleKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    const key = e.key

    if (key === 'Backspace') {
      e.preventDefault()
      if (values[idx]) {
        setCharAt(idx, '')
      } else if (idx > 0) {
        setCharAt(idx - 1, '')
        focusAt(idx - 1)
      }
      return
    }

    if (key === 'Delete') {
      e.preventDefault()
      setCharAt(idx, '')
      return
    }

    if (key === 'ArrowLeft' && idx > 0) {
      e.preventDefault()
      focusAt(idx - 1)
      return
    }

    if (key === 'ArrowRight' && idx < length - 1) {
      e.preventDefault()
      focusAt(idx + 1)
      return
    }

    if (/^\d$/.test(key)) {
      e.preventDefault()
      setCharAt(idx, key)
      if (idx < length - 1) focusAt(idx + 1)
    }
  }

  const handlePaste = (idx: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!text) return
    setValues(prev => {
      const next = prev.slice()
      let i = idx
      for (const ch of text) {
        if (i >= length) break
        next[i] = ch
        i++
      }
      const last = Math.min(idx + text.length - 1, length - 1)
      setTimeout(() => focusAt(last), 0)
      return next
    })
  }

  const boxClass =
    'w-10 h-12 md:w-12 md:h-14 rounded-2xl border border-black/20 text-center text-xl md:text-2xl font-semibold outline-none transition ' +
    'focus:border-black/60 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed bg-white'

  return (
    <div className={`flex items-center justify-center gap-2 my-8 ${className}`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={setInputRef(i)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          value={values[i]}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste(i)}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          className={boxClass}
        />
      ))}
    </div>
  )
}
