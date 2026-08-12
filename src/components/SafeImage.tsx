import Image, { type ImageProps } from 'next/image'

function isRemoteSrc(src: ImageProps['src']) {
  return typeof src === 'string' && /^https?:\/\//i.test(src)
}

/**
 * next/image wrapper for CMS/user-provided URLs.
 * Remote hosts render with a native img so an unlisted domain cannot crash the page.
 */
export default function SafeImage({ unoptimized, fill, src, alt, className, style, sizes, ...props }: ImageProps) {
  if (isRemoteSrc(src) && typeof src === 'string') {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || ''}
          className={className}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...style,
          }}
        />
      )
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ''}
        className={className}
        style={style}
        width={typeof props.width === 'number' ? props.width : undefined}
        height={typeof props.height === 'number' ? props.height : undefined}
      />
    )
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      style={style}
      sizes={sizes}
      unoptimized={unoptimized}
    />
  )
}
