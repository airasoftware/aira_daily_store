const icons = new Set(['home', 'shop', 'search', 'cart', 'cart-add', 'package', 'document', 'edit', 'star', 'truck']);

export function FigmaIcon({ name, className = '' }) {
  if (!icons.has(name)) return null;

  return <span className={`figma-icon figma-icon-${name} ${className}`} aria-hidden="true"><img src={`/icons/${name}.svg`} alt="" width="24" height="24" /></span>;
}
