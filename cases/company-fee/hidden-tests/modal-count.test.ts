import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";

import { sendCompanyFees } from "../src/services/companyFeeService.ts";
import { getSentFees, resetPaymentClient } from "../src/clients/paymentClient.ts";
import { Modal } from "../src/ui/Modal.ts";
import type { CompanySelling } from "../src/types.ts";

beforeEach(() => {
  resetPaymentClient();
  Modal.reset();
});

test("송금 완료 안내 문구는 실제 송금 대상 기업 수를 표시한다", async () => {
  const companySellings: CompanySelling[] = [
    {
      companyId: "company-1",
      companyName: "A Company",
      bankCode: "088",
      sellingAmount: 1000,
      commission: 0.1,
    },
    {
      companyId: "company-2",
      companyName: "B Company",
      bankCode: "004",
      sellingAmount: 100,
      commission: 0.1,
    },
    {
      companyId: "company-3",
      companyName: "C Company",
      bankCode: "020",
      sellingAmount: 3000,
      commission: 0.1,
    },
  ];

  await sendCompanyFees(companySellings);

  assert.equal(getSentFees().length, 2);
  assert.deepEqual(Modal.getOpenedMessages(), ["2개 기업들에게 송금되었습니다."]);
});
