import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when everything fits on one page", () => {
    const { container } = render(
      <Pagination page={1} pageSize={24} totalCount={10} basePath="/gallery" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows next but not previous on the first page", () => {
    render(<Pagination page={1} pageSize={24} totalCount={50} basePath="/gallery" />);
    expect(screen.getByTestId("pagination-next-link")).toBeInTheDocument();
    expect(screen.queryByTestId("pagination-prev-link")).not.toBeInTheDocument();
  });

  it("shows both prev and next on a middle page", () => {
    render(<Pagination page={2} pageSize={24} totalCount={100} basePath="/gallery" />);
    expect(screen.getByTestId("pagination-prev-link")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-next-link")).toBeInTheDocument();
  });
});
