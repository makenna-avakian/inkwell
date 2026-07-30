import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/server/discovery/service", () => ({
  getShopPageData: vi.fn(),
}));
vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));

import { notFound } from "next/navigation";
import { getShopPageData } from "@/server/discovery/service";
import { auth } from "@/server/auth/config";
import PublicShopPage from "./PublicShopPage";

const mockGetShopPageData = vi.mocked(getShopPageData);
const mockAuth = vi.mocked(auth);
const mockNotFound = vi.mocked(notFound);

const BASE_SHOP = {
  id: "shop-1",
  userId: "owner-1",
  displayName: "Jane's Studio",
  bio: null,
  bannerImageUrl: null,
  avatarImageUrl: null,
  socialLinks: [] as unknown,
};

function baseData(overrides: Partial<Parameters<typeof mockGetShopPageData.mockResolvedValue>[0]> = {}) {
  return {
    shop: BASE_SHOP,
    portfolio: [],
    publishedRules: null,
    availableListings: [],
    galleryWallSettings: undefined,
    ...overrides,
  } as never;
}

describe("PublicShopPage", () => {
  it("calls notFound() when the shop doesn't exist", async () => {
    mockGetShopPageData.mockResolvedValue(null);
    mockAuth.mockResolvedValue(null as never);

    await expect(PublicShopPage({ shopId: "missing" })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("shows a 'no rules published' message when the shop has no published rules", async () => {
    mockGetShopPageData.mockResolvedValue(baseData());
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("public-shop-page-no-rules")).toBeInTheDocument();
  });

  it("renders social links when present", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({ shop: { ...BASE_SHOP, socialLinks: [{ label: "Instagram", url: "https://instagram.com/x" }] } }),
    );
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("public-shop-page-social-links")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
  });

  it("hides the Gallery Wall link when no layout has been saved", async () => {
    mockGetShopPageData.mockResolvedValue(baseData());
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.queryByTestId("public-shop-page-gallery-wall-link")).not.toBeInTheDocument();
  });

  it("shows the Gallery Wall link once at least one piece is placed", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        galleryWallSettings: {
          shopId: "shop-1",
          frameColor: "black",
          frameStyle: "classic",
          pieces: [{ portfolioImageId: "img-1", x: 50, y: 15 }],
          updatedAt: new Date(),
        },
      }),
    );
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("public-shop-page-gallery-wall-link")).toHaveAttribute(
      "href",
      "/shops/shop-1/gallery",
    );
  });

  it("prompts sign-in for a signed-out visitor when the slot is open", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        publishedRules: {
          version: { tiers: [], addOns: [], rulesContent: [] } as never,
          slotState: "open",
          maxQueue: null,
        },
      }),
    );
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByText(/to request a commission/)).toBeInTheDocument();
  });

  it("shows the commission request form for a signed-in visitor when the slot is open", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        publishedRules: {
          version: { tiers: [], addOns: [], rulesContent: [] } as never,
          slotState: "open",
          maxQueue: null,
        },
      }),
    );
    mockAuth.mockResolvedValue({ user: { id: "buyer-1" } } as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("commission-request-form")).toBeInTheDocument();
  });

  it("shows the waitlist button for a signed-in visitor when the slot is waitlist", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        publishedRules: {
          version: { tiers: [], addOns: [], rulesContent: [] } as never,
          slotState: "waitlist",
          maxQueue: null,
        },
      }),
    );
    mockAuth.mockResolvedValue({ user: { id: "buyer-1" } } as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("waitlist-join-button")).toBeInTheDocument();
  });

  it("shows a closed message when the slot is closed", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        publishedRules: {
          version: { tiers: [], addOns: [], rulesContent: [] } as never,
          slotState: "closed",
          maxQueue: null,
        },
      }),
    );
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("public-shop-page-closed")).toBeInTheDocument();
  });

  it("renders a Buy Now button per listing for a signed-in visitor", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        availableListings: [{ id: "l1", title: "Piece", priceCents: 1000, styleTags: [] }] as never,
      }),
    );
    mockAuth.mockResolvedValue({ user: { id: "buyer-1" } } as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("buy-now-button-l1")).toBeInTheDocument();
  });

  it("prompts sign-in instead of Buy Now for a signed-out visitor", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        availableListings: [{ id: "l1", title: "Piece", priceCents: 1000, styleTags: [] }] as never,
      }),
    );
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.queryByTestId("buy-now-button-l1")).not.toBeInTheDocument();
    expect(screen.getByText(/to buy now/)).toBeInTheDocument();
  });

  it("shows the portfolio empty state when the shop has no pieces", async () => {
    mockGetShopPageData.mockResolvedValue(baseData());
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("portfolio-gallery-empty")).toBeInTheDocument();
  });

  it("renders portfolio pieces as clickable thumbnails", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        portfolio: [
          {
            id: "img-1",
            imageUrl: "https://media/1.png",
            title: "Autumn Study",
            caption: "Gouache",
            tags: ["watercolor"],
            listingId: null,
            featured: true,
          },
        ] as never,
      }),
    );
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    render(jsx);

    expect(screen.getByTestId("portfolio-gallery-thumb-img-1")).toBeInTheDocument();
  });

  it("gives each available listing an anchor id so the portfolio lightbox can link to it", async () => {
    mockGetShopPageData.mockResolvedValue(
      baseData({
        availableListings: [{ id: "l1", title: "Piece", priceCents: 1000, styleTags: [] }] as never,
      }),
    );
    mockAuth.mockResolvedValue(null as never);

    const jsx = await PublicShopPage({ shopId: "shop-1" });
    const { container } = render(jsx);

    expect(container.querySelector("#listing-l1")).toBeInTheDocument();
  });
});
