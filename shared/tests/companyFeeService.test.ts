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

test("송금 기준을 만족하는 기업에만 송금 요청을 보낸다", async () => {
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

  assert.deepEqual(getSentFees(), [
    { bankCode: "088", fee: 100 },
    { bankCode: "020", fee: 300 },
  ]);
  assert.equal(Modal.getOpenedMessages().length, 1);
});
