export default function OreumPhoto({ src, alt = '', style, className = 'rounded' }) {
  if (!src) return null
  return <img src={src} alt={alt} loading="lazy" className={className} style={{ width: '100%', height: 120, objectFit: 'cover', border: '2px solid #000', display: 'block', ...style }} />
}
