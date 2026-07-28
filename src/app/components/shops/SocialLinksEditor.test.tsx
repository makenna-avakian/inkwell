import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SocialLinksEditor from "./SocialLinksEditor";

describe("SocialLinksEditor", () => {
  it("shows no rows and an empty-state add button when there are no links", () => {
    render(<SocialLinksEditor socialLinks={[]} onChange={vi.fn()} />);
    expect(screen.queryByTestId("social-links-editor-label-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("social-links-editor-add-button")).toBeInTheDocument();
  });

  it("adds a new blank link", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SocialLinksEditor socialLinks={[]} onChange={onChange} />);

    await user.click(screen.getByTestId("social-links-editor-add-button"));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ label: "", url: "" }),
    ]);
  });

  it("updates a link's label", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SocialLinksEditor
        socialLinks={[{ id: "1", label: "", url: "" }]}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByTestId("social-links-editor-label-input"), "I");

    expect(onChange).toHaveBeenCalledWith([{ id: "1", label: "I", url: "" }]);
  });

  it("removes a link", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SocialLinksEditor
        socialLinks={[{ id: "1", label: "Instagram", url: "https://instagram.com/x" }]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByTestId("social-links-editor-remove-button"));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
