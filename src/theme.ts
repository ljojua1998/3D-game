export const PALETTE = {
  pastelPurple: 0xa58fff,
  pastelOrange: 0xffb152,
}

// Vivid neon "tech-maze" theme (reference: isometric synthwave maze).
export const WALL_COLOR = '#8ea2ff' // fallback wall body (top of gradient)

// Walls fade vertically: vivid periwinkle-blue at the top → hot pink at the
// base, like the reference render.
export const WALL_TOP_COLOR = '#8ea2ff' // vivid periwinkle-blue
export const WALL_BOTTOM_COLOR = '#ff6ec7' // hot pink

export const GROUND_COLOR = '#eae4fb' // soft lilac-white floor
export const FOG_COLOR = '#c3b6f0' // lilac haze
export const SKY_TOP_COLOR = 0xb7a3f5 // saturated lilac up high
export const SKY_BOTTOM_COLOR = 0xffb3e6 // hot-pink horizon

// Neon accent colors used for edge glow + floor path traces.
export const NEON_PINK = '#ff2fd0'
export const NEON_YELLOW = '#ffd11a'
export const NEON_GREEN = '#5dff7a' // wall circuit lines