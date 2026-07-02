import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { ButtonTabs } from "./Tabs";

function TabsHarness() {
  const [tab, setTab] = useState<string | number>("one");
  return (
    <ButtonTabs
      tab={tab}
      setTab={setTab}
      tabs={[
        { id: "one", label: "Tab One", component: <div>Panel One</div> },
        { id: "two", label: "Tab Two", component: <div>Panel Two</div> },
      ]}
    />
  );
}

describe("ButtonTabs", () => {
  it("renders tab labels", () => {
    renderWithProviders(<TabsHarness />);
    expect(screen.getByRole("tab", { name: "Tab One" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab Two" })).toBeInTheDocument();
  });

  it("shows the first tab panel by default", () => {
    renderWithProviders(<TabsHarness />);
    expect(screen.getByText("Panel One")).toBeInTheDocument();
    expect(screen.queryByText("Panel Two")).not.toBeInTheDocument();
  });

  it("switches panels when a tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TabsHarness />);

    await user.click(screen.getByRole("tab", { name: "Tab Two" }));
    expect(screen.getByText("Panel Two")).toBeInTheDocument();
    expect(screen.queryByText("Panel One")).not.toBeInTheDocument();
  });
});
