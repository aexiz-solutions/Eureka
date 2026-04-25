import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DashboardPage from "@/app/dashboard/page";
import { api } from "@/lib/api";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("@/store/authStore", () => ({
  useAuthStore: () => ({
    initializeAuth: jest.fn(),
    user: {
      id: "admin-id",
      email: "admin@example.com",
      role: "admin",
      subscription_tier: "admin",
      created_at: "2026-04-25T00:00:00Z",
    },
    logout: jest.fn(),
  }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("Dashboard admin plan limits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: [
          { tier: "individual-plus", annual_planogram_limit: 15, is_unlimited: false },
          { tier: "individual-pro", annual_planogram_limit: 45, is_unlimited: false },
        ],
        message: "ok",
      },
    });
    (api.patch as jest.Mock).mockResolvedValue({
      data: {
        data: { tier: "individual-plus", annual_planogram_limit: 20, is_unlimited: false },
        message: "saved",
      },
    });
  });

  it("loads limits and saves an updated value", async () => {
    render(<DashboardPage />);

    expect(await screen.findByText("Admin Plan Limits")).toBeInTheDocument();
    expect(await screen.findByLabelText("individual-plus-annual-limit")).toBeInTheDocument();

    const input = screen.getByLabelText("individual-plus-annual-limit");
    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]);

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/api/v1/admin/plan-limits/individual-plus", {
        annual_planogram_limit: 20,
        is_unlimited: false,
      }),
    );
  });
});