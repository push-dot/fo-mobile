export const personLine = (who: { companyName?: string | null; headline?: string }) =>
  [who.companyName, who.headline].filter(Boolean).join(' · ')
