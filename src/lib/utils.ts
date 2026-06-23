/**
 * Shortens an Ethereum address for display.
 * Example: 0x1234567890123456789012345678901234567890 → 0x1234...7890
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Shortens an address if it starts with 0x, otherwise returns as-is.
 */
export function shortenIfAddress(value: string): string {
  if (!value) return '';
  return value.startsWith('0x') ? shortenAddress(value) : value;
}
