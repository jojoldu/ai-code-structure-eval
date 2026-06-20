import { axiosSendFee } from "../clients/paymentClient.ts";
import type { CompanySelling } from "../types.ts";
import { Modal } from "../ui/Modal.ts";

export async function sendCompanyFees(companySellings: CompanySelling[]): Promise<void> {
  for (const companySelling of companySellings) {
    const fee = companySelling.sellingAmount * companySelling.commission;

    if (fee >= 100) {
      await axiosSendFee(companySelling.bankCode, fee);
    }
  }

  Modal.open(`${companySellings.length}개 기업들에게 송금되었습니다.`);
}
