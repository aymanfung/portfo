import type { CSSProperties } from "react"

/* ══ The key card's geometry and rules ═══════════════════════════
   Plain numbers and pure functions, no React and no DOM, so the rules for where the card may go and when it counts as "in the
   slot" can be read (and tested) on their own. All distances are in the plate's own units: the plate is 150 × 200, its centre line is
   x = 0 and its top edge is y = 0; a card's position is its top-left, so its centre is at (x, y + CARD_H / 2).
   ═══════════════════════════════════════════════════════════════ */

/** Where the card's top sits when slotted in, and when pulled out. */
export const CARD_IN = 40
export const CARD_OUT = -32
/** The card's height, and the slot's centre line. The card starts going in the moment its bottom edge passes that line. */
export const CARD_H = 105
export const SLOT_LINE = 88
/** The card is positioned inside a clip box that starts this far above the plate's top edge (so it can be pulled well above the plate). */
export const CLIP_TOP = 150

/** These numbers are the only place the card's resting spots and sizes are written: they are handed to the CSS as variables on the stage,
 *  so the script and the stylesheet can never disagree about where the card sits (they once did, by 6 units, and the card jumped on release). */
export const STAGE_VARS = { "--card-in": CARD_IN, "--card-out": CARD_OUT, "--card-h": CARD_H, "--slot-line": SLOT_LINE, "--clip-top": CLIP_TOP } as CSSProperties

/** How far the card may be dragged: right out of the plate and across the page, so this is wide. Sideways there is no limit of its own: the screen's edges are the walls (see the move handler). */
export const DRAG_Y = { min: -320, max: 700 }
/** In the slot the card goes no lower than fully slotted in, which is exactly its resting place (so it never moves on release). */
const IN_SLOT_MAX_Y = CARD_IN
/** How far off the slot's centre line the card may be and still go in. The slot is 80 wide and the card 66, so physically it only has 7
 *  to spare; this is a little more forgiving. */
const SLOT_ALIGN_X = 14
/** The card counts as in the slot from this height down while it is going in, and as still in it until it is pulled up past PULLED_OUT_Y. */
const SLOT_REACH_Y = 0
const PULLED_OUT_Y = 10
/** The card's top when its bottom edge reaches the slot line, and over how many units of travel past that it eases onto the slot's centre line. */
const ENTER_Y = SLOT_LINE - CARD_H
const ENTER_EASE = 27
/** How far a press may wobble and still be a tap, not a drag. */
export const TAP_SLOP = 5

/** Let go with the card's centre past a side, below the bottom, or well above the top of the plate and it is thrown away. */
const PLATE_HALF_W = 75
const PLATE_H = 200
const OUTSIDE_ABOVE = 50

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** What a drag knows about the card: whether it is held in the slot, and whether a drop from here could go in. */
export type DragFlags = { locked: boolean; armed: boolean; entering: boolean }

/** The flags at the start of a drag. A slotted-in card starts out locked in the slot; a card that starts above the slot is already
 *  "armed", so a fast flick straight down can jump the slot line in one step. */
export function startFlags(inserted: boolean, yStart: number): DragFlags {
  const locked = inserted && yStart >= PULLED_OUT_Y
  return { locked, armed: !locked && yStart <= ENTER_Y, entering: false }
}

/** Is the card in the slot? True if it is still locked in it (and not pulled most of the way out), or on its way in from above and
 *  centred. Pulled clear of the slot, or let go beside it, it is out. The room follows this live while dragging, and it decides the release. */
export function inSlot(d: DragFlags, y: number): boolean {
  return d.locked ? y >= PULLED_OUT_Y : d.entering && y >= SLOT_REACH_Y
}

/** In the slot, or going into it from above (as opposed to held out over the plate, where nothing hides any of it). */
export const goingIn = (d: DragFlags) => d.locked || d.entering

/**
 * The slot only takes the card from the middle top. The card can only go in by dropping straight down into the slot from above it,
 * centred. "Armed" means it is above the slot line, so a drop from here can go in. Crossing the line while centred starts it going in:
 * it eases to the slot's centre line over ENTER_EASE units, then is held there (locked) and cannot go left or right until it is pulled
 * back up clear of the slot (on the way out it picks up the pointer from where it is, no jump: x0 is re-based). Brought down BESIDE the
 * slot instead, it is not armed, so sliding it sideways into line does nothing: it is just a card held over the plate.
 *
 * Takes the pointer's wanted position (y, x) and returns where the card actually goes. Updates the drag's flags (and x0) as it goes.
 */
export function constrainDrag(d: DragFlags & { x0: number }, wantY: number, wantX: number, clientX: number): { x: number; y: number } {
  let x = wantX
  let y = wantY
  if (d.locked) {
    if (y <= ENTER_Y) {
      d.locked = false
      d.armed = true
      d.entering = false
      d.x0 = clientX
    }
    x = 0
  } else if (y <= ENTER_Y) {
    d.armed = true
    d.entering = false
  } else if (d.armed && Math.abs(x) <= SLOT_ALIGN_X) {
    d.entering = true
    const t = clamp((y - ENTER_Y) / ENTER_EASE, 0, 1)
    x *= 1 - t
    if (t >= 1) d.locked = true
  } else {
    d.armed = false // came down beside the slot (or swung out of line before it was in): not going in
    d.entering = false
  }
  if (goingIn(d)) y = Math.min(y, IN_SLOT_MAX_Y) // in the slot it goes no deeper than fully in
  return { x, y }
}

/** Is a card let go here clear of the plate, so it is thrown away rather than sprung back? */
export function isThrownAway(x: number, y: number): boolean {
  const cy = y + CARD_H / 2
  return Math.abs(x) > PLATE_HALF_W || cy > PLATE_H || cy < -OUTSIDE_ABOVE
}
