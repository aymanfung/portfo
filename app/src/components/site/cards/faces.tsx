import "./cards.css"

/** The cards that can be in the slot. The first is the hotel key; the rest turn up, at random, after one has been dropped. All are invented designs
 *  (no real logos, crests or numbers), just in the manner of the real thing. */
export const FACES = ["hotel", "coral", "gold", "licence", "transit", "ace", "peri", "critter"] as const
export type FaceName = (typeof FACES)[number]

const Contactless = () => (
  <svg className="hk-nfc" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4 4.5a5 5 0 0 1 0 7M7 2.5a8 8 0 0 1 0 11M10 0.5a11 11 0 0 1 0 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

/** An n-pointed star, as an SVG polygon `points` string. */
const star = (cx: number, cy: number, R: number, r: number, n = 8) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2
    const rad = i % 2 ? r : R
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`
  }).join(" ")

/** The back of the playing card: a red frame, a lattice of diamonds, a star on a disc in the middle and a small star in each corner. */
function AceBack() {
  return (
    <svg className="hk-ace-back" viewBox="0 0 66 105" aria-hidden="true">
      <defs>
        <pattern id="hk-lattice" width="6" height="6" patternUnits="userSpaceOnUse" style={{ visibility: "visible" }}>
          <path d="M0 3 L3 0 L6 3 L3 6 Z M0 0 L6 6 M6 0 L0 6" fill="none" stroke="#e8141c" strokeWidth=".85" />
        </pattern>
      </defs>
      <rect x="3" y="3" width="60" height="99" rx="3" fill="#fff" stroke="#e8141c" strokeWidth="1" />
      <rect x="6" y="6" width="54" height="93" fill="#e8141c" />
      <rect x="9.5" y="9.5" width="47" height="86" fill="#fff" />
      <rect x="10.5" y="10.5" width="45" height="84" fill="url(#hk-lattice)" />
      <circle cx="33" cy="52.5" r="15" fill="#fff" stroke="#e8141c" strokeWidth="1.2" />
      <circle cx="33" cy="52.5" r="12" fill="#e8141c" />
      <polygon points={star(33, 52.5, 14, 5)} fill="#fff" stroke="#e8141c" strokeWidth="1" strokeLinejoin="round" />
      {[[10, 10], [56, 10], [10, 95], [56, 95]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="6" fill="#fff" stroke="#e8141c" strokeWidth="1" />
          <polygon points={star(x, y, 4.6, 1.8)} fill="#e8141c" />
        </g>
      ))}
    </svg>
  )
}

/** The back of the licence: the table of vehicle categories with their dates and codes (all invented), a signal-light mark, the licence number. */
const LICENCE_ROWS = [
  ["AM", "19.01.13", "10.03.46", "01"],
  ["A", "11.03.96", "10.03.46", "01"],
  ["B1", "11.03.96", "10.03.46", "01,15,20"],
  ["B", "11.03.98", "10.03.46", "01,15,20"],
  ["C1", "", "", ""],
  ["C", "", "", ""],
  ["D", "", "", ""],
]
function LicenceBack() {
  return (
    <div className="hk-dl-back">
      <span className="hk-dlb-13">13.</span>
      <span className="hk-dlb-light"><i /><i /><i /></span>
      <span className="hk-dlb-12">12. 115</span>
      <div className="hk-dlb-table">
        <div className="hk-dlb-row hk-dlb-head"><b>9.</b><b>10.</b><b>11.</b><b>12.</b></div>
        {LICENCE_ROWS.map(([c, a, b, d]) => (
          <div className="hk-dlb-row" key={c}><span>{c}</span><span>{a}</span><span>{b}</span><span>{d}</span></div>
        ))}
      </div>
      <span className="hk-dlb-no">ZA00506027</span>
    </div>
  )
}

/** The back of the travel card: white, the "use where you see this symbol" mark, small print, a number. Drawn landscape and turned like the front. */
function TransitBack() {
  return (
    <div className="hk-tr-back">
      <i className="hk-trb-sym" />
      <span className="hk-trb-use">Use where you<br />see this symbol</span>
      <span className="hk-trb-no">0553 6937 08 98</span>
      <span className="hk-trb-fine">The issue and use of this card is subject to the Conditions of Carriage, available online or by calling the number on your statement. Found cards should be returned to any station ticket office.</span>
      <span className="hk-trb-brand">Transport pass</span>
      <span className="hk-trb-ring"><i /></span>
      <span className="hk-trb-code">GXDR2293</span>
    </div>
  )
}

/** What is printed on the front of each card. The bank-style cards are landscape, as the real ones are (see .hk-card[data-face] in the CSS). */
export function CardFace({ name }: { name: FaceName }) {
  switch (name) {
    case "coral":
      return (<>
        <span className="hk-bank">bank</span>
        <span className="hk-chip" />
        <Contactless />
        <span className="hk-holder">M AU-YEUNG</span>
        <span className="hk-rings"><i /><i /></span>
      </>)
    case "gold":
      return (<>
        <span className="hk-gold-title">GOLD CARD</span>
        <span className="hk-gold-seal" />
        <span className="hk-chip" />
        <Contactless />
        <span className="hk-num">7997</span>
        <span className="hk-holder">M AU-YEUNG</span>
        <span className="hk-since">MEMBER SINCE 09</span>
      </>)
    case "licence":
      return (<>
        <span className="hk-dl-head"><b>UK</b> DRIVING LICENCE</span>
        <span className="hk-dl-photo"><i /><b /></span>
        <span className="hk-dl-line" style={{ top: 19 }}><em>1.</em> AU-YEUNG</span>
        <span className="hk-dl-line" style={{ top: 26 }}><em>2.</em> MATTHEW</span>
        <span className="hk-dl-line" style={{ top: 33 }}><em>4c.</em> LONDON</span>
        <span className="hk-dl-line" style={{ top: 40 }}><em>5.</em> AUYEU0M99AB</span>
        <span className="hk-dl-sign">M. Au-Yeung</span>
      </>)
    case "transit":
      return (<>
        <span className="hk-tr-band" />
        <span className="hk-tr-title">travel</span>
        <span className="hk-tr-ring"><i /></span>
        <span className="hk-tr-sub">Transport pass</span>
        <span className="hk-tr-sub2">Issued subject to conditions</span>
      </>)
    case "critter":
      return <img className="hk-crit" src="/cards/critter-front.webp" alt="" draggable={false} />
    case "peri":
      return (<>
        <svg className="hk-peri-art" viewBox="0 0 92 58" aria-hidden="true">
          <path d="M66 6c-9 4-13 14-11 26 2 10 8 17 15 20 1-9-1-14-5-20-4-7-3-17 1-26z" fill="rgba(255,255,255,.16)" />
          <path d="M34 50c-14-2-22-12-18-24 3-9 12-12 19-8" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M44 14c6-6 16-5 18 2" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="hk-peri-title">Peri Chicken</span>
        <span className="hk-peri-mark" />
        <span className="hk-peri-sub">FLAME GRILLED</span>
      </>)
    case "ace":
      return (<>
        <span className="hk-pc-corner hk-pc-tl">A<br />♠</span>
        <span className="hk-pc-big">♠</span>
        <span className="hk-pc-corner hk-pc-br">A<br />♠</span>
      </>)
    default:
      return (<>
        <span className="hk-mono">HOTEL</span>
        <span className="hk-rule" />
        <span className="hk-chip" />
        <span className="hk-room">ROOM<br />1A · W</span>
      </>)
  }
}

/** What is printed on the back of each card (seen while it tumbles). Most are just the front's colour; those with a design have a component. */
export function CardBack({ name }: { name: FaceName }) {
  switch (name) {
    case "ace":
      return <AceBack />
    case "critter":
      return <img className="hk-crit" src="/cards/critter-back.png" alt="" draggable={false} />
    case "transit":
      return <TransitBack />
    case "licence":
      return <LicenceBack />
    case "hotel":
      return <span className="hk-back-text">KEY</span>
    default:
      return null
  }
}
