import { LoadingIndicator } from '../components/loading-indicator';

export default function Loading() {
  return <main className="page-shell loading-screen" role="status" aria-live="polite"><LoadingIndicator label="Memuat halaman..." /></main>;
}
