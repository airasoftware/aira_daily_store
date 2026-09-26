'use client';

import Link, { useLinkStatus } from 'next/link';

function FinanceTabPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <span className="finance-tab-pending" data-pending="true" role="status" aria-label="Memuat laporan" />;
}

export function FinanceTabLink({ href, active, children }) {
  function preventRepeatNavigation(event) {
    if (event.currentTarget.querySelector('[data-pending="true"]')) event.preventDefault();
  }
  return <Link href={href} className={active ? 'active' : ''} onClick={preventRepeatNavigation}><span>{children}</span><FinanceTabPending /></Link>;
}
