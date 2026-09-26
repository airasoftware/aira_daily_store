const JAKARTA_OFFSET = '+07:00';

function datePartsInJakarta(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
}

function isDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function financePeriod(params = {}, now = new Date()) {
  const todayParts = datePartsInJakarta(now);
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  const monthStart = `${todayParts.year}-${todayParts.month}-01`;
  const requestedStart = typeof params.from === 'string' ? params.from : '';
  const requestedEnd = typeof params.to === 'string' ? params.to : '';
  const start = isDateInput(requestedStart) ? requestedStart : monthStart;
  const end = isDateInput(requestedEnd) ? requestedEnd : today;

  if (start > end) return { start: end, end, adjusted: true };
  return { start, end, adjusted: false };
}

export function jakartaDayStart(date) {
  return new Date(`${date}T00:00:00${JAKARTA_OFFSET}`);
}

export function jakartaDayAfter(date) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return new Date(`${day.toISOString().slice(0, 10)}T00:00:00${JAKARTA_OFFSET}`);
}

function amount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rawBalance(rows, accountId) {
  const row = rows.find(item => String(item.account_id) === String(accountId));
  return row ? amount(row.debit) - amount(row.credit) : 0;
}

function naturalBalance(account, raw) {
  return account.normal_balance === 'debit' ? raw : -raw;
}

export function buildLedgerReport(accounts, periodLines, closingRows, openingRows = []) {
  const enrichedAccounts = accounts.map(account => {
    const openingRaw = rawBalance(openingRows, account.id);
    const closingRaw = rawBalance(closingRows, account.id);
    const periodDebit = periodLines.filter(line => String(line.account_id) === String(account.id)).reduce((sum, line) => sum + amount(line.debit), 0);
    const periodCredit = periodLines.filter(line => String(line.account_id) === String(account.id)).reduce((sum, line) => sum + amount(line.credit), 0);
    return { ...account, openingRaw, closingRaw, periodDebit, periodCredit, balance: naturalBalance(account, closingRaw) };
  });
  const revenues = enrichedAccounts.filter(account => account.type === 'revenue');
  const expenses = enrichedAccounts.filter(account => account.type === 'expense');
  const periodRevenue = revenues.reduce((sum, account) => sum + account.periodCredit - account.periodDebit, 0);
  const periodExpense = expenses.reduce((sum, account) => sum + account.periodDebit - account.periodCredit, 0);
  const cumulativeRevenue = revenues.reduce((sum, account) => sum + account.balance, 0);
  const cumulativeExpense = expenses.reduce((sum, account) => sum + account.balance, 0);
  const assets = enrichedAccounts.filter(account => account.type === 'asset');
  const liabilities = enrichedAccounts.filter(account => account.type === 'liability');
  const equityAccounts = enrichedAccounts.filter(account => account.type === 'equity');
  const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0);
  const baseEquity = equityAccounts.reduce((sum, account) => sum + account.balance, 0);
  const currentEarnings = cumulativeRevenue - cumulativeExpense;
  const debitTotal = periodLines.reduce((sum, line) => sum + amount(line.debit), 0);
  const creditTotal = periodLines.reduce((sum, line) => sum + amount(line.credit), 0);
  const entryCount = new Set(periodLines.map(line => String(line.journal_entry_id))).size;

  return {
    accounts: enrichedAccounts,
    periodLines,
    revenues,
    expenses,
    assets,
    liabilities,
    equityAccounts,
    periodRevenue,
    periodExpense,
    periodProfit: periodRevenue - periodExpense,
    totalAssets,
    totalLiabilities,
    baseEquity,
    currentEarnings,
    totalEquity: baseEquity + currentEarnings,
    cash: enrichedAccounts.find(account => account.code === '1000')?.balance ?? 0,
    inventory: enrichedAccounts.find(account => account.code === '1100')?.balance ?? 0,
    debitTotal,
    creditTotal,
    entryCount,
  };
}
