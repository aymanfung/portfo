import { useEffect, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { EyeTracker } from "./EyeTracker"
import { HotelKeyToggle } from "./HotelKeyToggle"
import { playSound } from "@/lib/sfx"
import "./lost-key-cards.css"

/**
 * The key card switch with a limited supply of cards (CARDS). The cards you have left show in a small "Wallet" row whenever the count
 * changes. Throw the last one away and a phone rings; answer it and the eye-tracking ball turns up as a police officer, takes the report
 * (stolen or lost) and then "finds" the cards, and a fresh set comes back.
 */
const CARDS = 3
/** Beat between the last card falling away and the phone ringing. */
const RING_DELAY = 1300
/** How long the wallet stays up once it has shown, if nothing else happens. */
const WALLET_MS = 3000

type Node = { say: string; choices?: { label: string; next: string; primary?: boolean }[]; done?: boolean }
const SCRIPT: Record<string, Node> = {
  start: {
    say: "Police department. I hear you're out of key cards. What happened?",
    choices: [
      { label: "They were stolen!", next: "stolen" },
      { label: "I think I lost them…", next: "lost" },
    ],
  },
  stolen: {
    say: "Stolen?! All of them? Okay, stay calm. I'm checking with the front desk…",
    choices: [{ label: "Hurry, please", next: "found", primary: true }],
  },
  lost: {
    say: "Lost them all, hm? It happens more than you'd think. Let me check lost and found…",
    choices: [{ label: "Thank you", next: "found", primary: true }],
  },
  found: {
    say: "Wait a second… a guest just handed in a bundle of key cards. Scuffed corners, a hotel logo. Found it! Sending them straight back. Hold on tighter this time.",
    choices: [{ label: "Thank you, officer!", next: "end", primary: true }],
  },
}

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" />
  </svg>
)

/** A police cap, drawn to sit on top of the ball. */
const Cap = () => (
  <svg className="pt-cap" viewBox="0 0 96 48" aria-hidden="true">
    <path d="M10 34c2-16 18-26 38-26s36 10 38 26z" fill="#1c2b4a" />
    <path d="M4 34h88c0 6-6 10-14 10H18C10 44 4 40 4 34z" fill="#101a30" />
    <rect x="8" y="30" width="80" height="6" rx="3" fill="#0b1224" />
    <path d="M48 12l3.2 6.4 7 1-5.1 5 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5.1-5 7-1z" fill="#f2c94c" stroke="#b8902a" strokeWidth="1" strokeLinejoin="round" />
  </svg>
)

/** `restockToken` / `bottomOffset`: a test page can change the number to put the cards back; `bottomOffset` lifts the phone and the call
 *  clear of whatever is pinned to the bottom of the screen (the site's dock). */
export function LostKeyCards({ restockToken = 0, bottomOffset = 0 }: { restockToken?: number; bottomOffset?: number }) {
  const [left, setLeft] = useState(CARDS)
  // The wallet (the cards you have left) shows when the count changes, then dismisses itself if nothing else happens.
  const [walletOpen, setWalletOpen] = useState(false)
  const walletTimer = useRef<number | undefined>(undefined)
  const leftRef = useRef(CARDS)
  const cardsLeft = (n: number) => {
    if (n !== leftRef.current) {
      setWalletOpen(true)
      window.clearTimeout(walletTimer.current)
      walletTimer.current = window.setTimeout(() => setWalletOpen(false), WALLET_MS)
    }
    leftRef.current = n
    setLeft(n)
  }
  const [phase, setPhase] = useState<"play" | "ringing" | "call">("play")
  const [node, setNode] = useState("start")
  const [bump, setBump] = useState(0) // the officer finding the cards: a new set
  const ringTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => { window.clearTimeout(ringTimer.current); window.clearTimeout(walletTimer.current) }, [])

  const current = SCRIPT[node]
  const [said, setSaid] = useState(false) // the whole line has been typed, so the answers can show

  const outOfCards = () => {
    window.clearTimeout(ringTimer.current)
    ringTimer.current = window.setTimeout(() => setPhase("ringing"), RING_DELAY)
  }
  const answer = () => {
    playSound("ui-audio/click2")
    setNode("start")
    setSaid(false)
    setPhase("call")
  }
  const choose = (next: string) => {
    if (next === "end") {
      playSound("ui-audio/switch10")
      setPhase("play")
      setBump((r) => r + 1)
      return
    }
    playSound("ui-audio/click1")
    setSaid(false)
    setNode(next)
  }
  // A test page can put everything back with a new `restockToken`.
  useEffect(() => {
    if (restockToken === 0) return
    window.clearTimeout(ringTimer.current)
    setPhase("play")
    setNode("start")
  }, [restockToken])

  const lift = { "--lk-bottom": `${bottomOffset}px` } as CSSProperties
  return (
    <div className="mx-auto w-full">
      <HotelKeyToggle maxCards={CARDS} onCardsLeft={cardsLeft} onOutOfCards={outOfCards} restockToken={restockToken + bump} />

      {/* no height of its own, so it never changes the space around the switch */}
      <div className="relative h-0"><div
        className="absolute inset-x-0 flex -translate-y-1/2 justify-center"
        // Centred in the gap between the bottom of the switch plate and the title below: the switch's box has about 42 design units of
        // empty room under the plate, scaled by --hk-s, and the title sits 48px below the box.
        style={{ top: "calc(24px - var(--hk-s, 1) * 21px)" }}
      >
        <div className="pt-wallet flex items-center gap-3 font-mono text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase" data-open={walletOpen || undefined}>
          Wallet
          <span className="pt-cards" aria-label={`${left} of ${CARDS} cards left`}>
            {Array.from({ length: CARDS }, (_, i) => <span key={i} className="pt-pip" data-gone={i >= left || undefined} />)}
          </span>
        </div></div>
      </div>

      {/* the phone and the call go on <body>: the page sits in a transformed wrapper, which would stop `fixed` pinning to the screen */}
      {phase === "ringing" && createPortal(
        <button type="button" className="pt-phone" style={lift} autoFocus onClick={answer} aria-label="Phone ringing. Answer to call the police.">
          <span className="pt-phone-body"><PhoneIcon /></span>
          <span className="pt-phone-label">Call the police</span>
        </button>,
        document.body,
      )}

      {phase === "call" && current && createPortal(
        <div className="pt-call" style={lift} role="dialog" aria-label="Call with the police">
          <div className="pt-call-inner">
            <div className="pt-officer">
              <Cap />
              {/* the ball's own speech bubble does the talking */}
              <EyeTracker shape="Circle" size={64} eyeScale={1.2} follow={70} bounce={45} within="html" say={current.say} sayTint="#1c2b4a" onSaid={() => setSaid(true)} />
            </div>
            <div className="pt-choices">
              {said && current.choices?.map((c, i) => (
                <button key={c.label} type="button" autoFocus={i === 0} className={`pt-btn${c.primary ? " primary" : ""}`} onClick={() => choose(c.next)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
