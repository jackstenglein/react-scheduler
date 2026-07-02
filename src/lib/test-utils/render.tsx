import { createTheme, ThemeProvider } from "@mui/material";
import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import DateProvider from "../components/hoc/DateProvider";
import { StoreProvider } from "../store/provider";

const theme = createTheme();

type ProviderProps<P> = {
  children: ReactNode;
  initial?: Partial<P>;
};

function AllProviders<P>({ children, initial = {} }: ProviderProps<P>) {
  return (
    <ThemeProvider theme={theme}>
      <StoreProvider initial={initial}>
        <DateProvider>{children}</DateProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}

type RenderWithProvidersOptions<P> = Omit<RenderOptions, "wrapper"> & {
  initial?: Partial<P>;
};

export function renderWithProviders<P>(
  ui: ReactElement<P>,
  options: RenderWithProvidersOptions<P> = {}
) {
  const { initial, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => <AllProviders initial={initial}>{children}</AllProviders>,
    ...renderOptions,
  });
}
