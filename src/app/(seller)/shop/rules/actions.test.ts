import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/shops/service", () => ({
  publishRuleSet: vi.fn(),
  setSlotState: vi.fn(),
  RuleSetValidationError: class RuleSetValidationError extends Error {},
  NotShopOwnerError: class NotShopOwnerError extends Error {
    constructor() {
      super("You do not have permission to modify this shop.");
    }
  },
}));

import { auth } from "@/server/auth/config";
import {
  NotShopOwnerError,
  RuleSetValidationError,
  publishRuleSet,
  setSlotState,
} from "@/server/shops/service";
import { publishRuleSetAction, setSlotStateAction } from "./actions";

const mockAuth = vi.mocked(auth);
const mockPublish = vi.mocked(publishRuleSet);
const mockSetSlotState = vi.mocked(setSlotState);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
});

describe("publishRuleSetAction", () => {
  it("returns success on a valid publish", async () => {
    mockPublish.mockResolvedValue({
      id: "v1",
      shopId: "shop-1",
      version: 1,
      tiers: [],
      addOns: [],
      rulesContent: [],
      publishedAt: new Date(),
    });
    const result = await publishRuleSetAction("shop-1", {
      tiers: [{ id: "t1", name: "Sketch", description: "", priceCents: 1000 }],
      addOns: [],
      rulesContent: [],
    });
    expect(result.success).toBe(true);
  });

  it("surfaces validation errors", async () => {
    mockPublish.mockRejectedValue(new RuleSetValidationError("At least one tier is required."));
    const result = await publishRuleSetAction("shop-1", {
      tiers: [],
      addOns: [],
      rulesContent: [],
    });
    expect(result.formError).toBe("At least one tier is required.");
  });
});

describe("setSlotStateAction", () => {
  it("rejects a non-owner", async () => {
    mockSetSlotState.mockRejectedValue(new NotShopOwnerError());
    const result = await setSlotStateAction("shop-1", "open");
    expect(result.formError).toBeTruthy();
  });
});
