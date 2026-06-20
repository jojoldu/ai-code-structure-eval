export type SentFee = {
  bankCode: string;
  fee: number;
};

const sentFees: SentFee[] = [];

export async function axiosSendFee(bankCode: string, fee: number): Promise<void> {
  sentFees.push({ bankCode, fee });
}

export function getSentFees(): SentFee[] {
  return [...sentFees];
}

export function resetPaymentClient(): void {
  sentFees.length = 0;
}
