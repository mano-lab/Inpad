import { RGBColor } from 'react-color'

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function getColorBrighness(color: RGBColor | string | null) {
  if (typeof color === 'string') {
    color = hexToRgb(color)
  }
  if (color === null) {
    return 0
  }
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
  return brightness
}
