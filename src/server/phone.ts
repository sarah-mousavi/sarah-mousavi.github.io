/* Iranian mobile numbers arrive in many shapes: ۰۹۱۲…، 0912…، +98912…،
   0098912…. Everything is stored as +989XXXXXXXXX. */

export function normalizePhone(input: string): string | null {
  if (!input) return null;
  const latin = input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

  const digits = latin.replace(/[^\d+]/g, '');
  let core = digits.replace(/^\+?98/, '').replace(/^0098/, '').replace(/^0/, '');
  if (!/^9\d{9}$/.test(core)) return null;
  return `+98${core}`;
}

export function displayPhone(e164: string): string {
  const core = e164.replace('+98', '0');
  return core.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
}
