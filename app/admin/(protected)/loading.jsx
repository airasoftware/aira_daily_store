import { LoadingIndicator } from '../../../components/loading-indicator';

export default function Loading() {
  return <main className="admin-main loading-screen" role="status" aria-live="polite"><LoadingIndicator label="Memuat data admin..." /></main>;
}
