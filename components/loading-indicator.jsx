export function LoadingIndicator({ label }) {
  return <div className="loading-content"><span className="loading-spinner" aria-hidden="true" /><span className="loading-label">{label}</span></div>;
}
