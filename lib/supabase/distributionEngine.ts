export const DISTRIBUTION = {
  PLATFORM: 0.30,
  DIRECTOR: 0.20,
  HOST: 0.50,
};

export const ITEM_PRICES: Record<string, number> = {
  bouquet: 1000,
  bouquet_x5: 4500,
  bouquet_x10: 8000,
  champagne: 3000,
  champagne_premium: 10000,
  spotlight: 500,
  vip_entry: 5000,
  black_entry: 20000,
};

export interface DistributionResult {
  platformCut: number;
  directorCut: number;
  hostCut: number;
  total: number;
}

export function calculateDistribution(
  totalCredits: number,
  hasDirector: boolean = true
): DistributionResult {
  const total = totalCredits;

  if (!hasDirector) {
    // No director: platform takes 50%, host takes 50%
    const platformCut = Math.floor(total * 0.50);
    const hostCut = total - platformCut;
    return { platformCut, directorCut: 0, hostCut, total };
  }

  // Standard split: 30/20/50
  // Platform floors (unfavorable), host ceils (favorable)
  const platformCut = Math.floor(total * DISTRIBUTION.PLATFORM);
  const directorCut = Math.floor(total * DISTRIBUTION.DIRECTOR);
  const hostCut = total - platformCut - directorCut; // host gets remainder (ceil)

  return { platformCut, directorCut, hostCut, total };
}

export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `LOX-${timestamp}-${random}`;
}

export function generateIdempotencyKey(
  userId: string,
  itemType: string,
  timestamp: number
): string {
  return `${userId}-${itemType}-${timestamp}`;
}

export function creditsToKRW(credits: number): number {
  return credits * 10; // 1 credit = 10 KRW
}

export function krwToCredits(krw: number): number {
  return Math.floor(krw / 10);
}

export function calculateVAT(amountKRW: number): number {
  return Math.floor(amountKRW * 0.1);
}

export function calculateWithholdingTax(amountKRW: number): number {
  // 3.3% withholding tax for freelance income
  return Math.floor(amountKRW * 0.033);
}
