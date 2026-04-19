import type { ReactNode } from 'react'

type LinkifiedTextProps = {
  text: string
  className?: string
}

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi
const TRAILING_PUNCTUATION_PATTERN = /[),.;!?]$/

function splitTrailingPunctuation(rawUrl: string) {
  let url = rawUrl
  let trailing = ''

  while (url.length > 0 && TRAILING_PUNCTUATION_PATTERN.test(url)) {
    trailing = url.slice(-1) + trailing
    url = url.slice(0, -1)
  }

  return { url, trailing }
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  if (!text) {
    return null
  }

  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const rawUrl = match[0]
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push(text.slice(cursor, start))
    }

    const { url, trailing } = splitTrailingPunctuation(rawUrl)

    if (url) {
      nodes.push(
        <a
          key={`url-${start}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff7d80] underline decoration-[#ff7d80]/60 underline-offset-2 hover:text-[#ff2a2f]"
        >
          {url}
        </a>,
      )
    }

    if (trailing) {
      nodes.push(trailing)
    }

    cursor = start + rawUrl.length
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return <span className={className}>{nodes}</span>
}
