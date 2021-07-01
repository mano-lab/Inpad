import React from 'react'
import styled from '../../lib/styled'
import cc from 'classcat'

export interface RoundedImageProps {
  url?: string
  alt: string
  rounded?: boolean
  size?: 22 | 26 | 30
  className?: string
  color?: string
}

const RoundedImage = ({
  className,
  url,
  alt,
  rounded,
  color,
  size = 30,
}: RoundedImageProps) => {
  if (url == null) {
    return (
      <StyledFillerIcon
        className={cc([
          'rounded__image',
          `rounded__image__size--${size}`,
          rounded && `rounded__image--rounded`,
          className,
        ])}
        size={size}
        style={{ color: color, borderColor: color }}
      >
        <span className='wrapper'>{alt.substr(0, 2)}</span>
      </StyledFillerIcon>
    )
  }

  return (
    <StyledImg
      className={cc([
        'rounded__image',
        `rounded__image__size--${size}`,
        rounded && `rounded__image--rounded`,
        className,
      ])}
      size={size}
      style={{ color: color, borderColor: color }}
      src={url}
      alt={alt}
    />
  )
}

const StyledFillerIcon = styled.div<{ size: number }>`
  text-transform: capitalize;
  background: #000;
  color: #fff;
  font-weight: bold;
  display: table;
  vertical-align: middle;
  border-radius: ${({ theme }) => theme.borders.radius}px;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;

  .wrapper {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    margin: auto;
    font-size: ${({ theme }) => theme.sizes.fonts.sm}px;
    width: 100%;
    height: 100%;
    justify-content: center;
  }

  &.rounded__image--rounded {
    border-radius: 50%;
  }
`

const StyledImg = styled.img<{ size: number }>`
  object-fit: cover;
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.borders.radius}px;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;

  &.rounded__image--rounded {
    border-radius: 50%;
  }
`

export default RoundedImage
