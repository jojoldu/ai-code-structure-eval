import { axiosSendFee } from "../clients/paymentClient.ts";
import type { CompanyFee, CompanySelling } from "../types.ts";
import { Modal } from "../ui/Modal.ts";

export function getCompanyFees(companySellings: CompanySelling[]): CompanyFee[] {
  return companySellings
    .map((companySelling) => ({
      companyId: companySelling.companyId,
      companyName: companySelling.companyName,
      bankCode: companySelling.bankCode,
      fee: companySelling.sellingAmount * companySelling.commission,
    }))
    .filter((companyFee) => companyFee.fee >= 100);
}

export async function sendCompanyFees(companySellings: CompanySelling[]): Promise<void> {
  const companyFees = getCompanyFees(companySellings);

  for (const companyFee of companyFees) {
    await axiosSendFee(companyFee.bankCode, companyFee.fee);
  }

  Modal.open(`${companySellings.length}개 기업들에게 송금되었습니다.`);
}
