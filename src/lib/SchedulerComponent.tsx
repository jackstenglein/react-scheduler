import { CircularProgress, Typography } from "@mui/material";
import { forwardRef, useMemo } from "react";
import { Navigation } from "./components/nav/Navigation";
import useStore, { shallowEqual, useStoreApi } from "./hooks/useStore";
import { PositionProvider } from "./positionManager/provider";
import { renderSlot } from "./slots/resolveSlot";
import { Table, Wrapper } from "./styles/styles";
import { LoadingOverlaySlotProps, SchedulerRef } from "./types";
import Editor from "./views/Editor";
import { Month } from "./views/Month";
import { Week } from "./views/Week";

function DefaultLoadingOverlay({ loadingLabel }: LoadingOverlaySlotProps) {
  return (
    <div className="rs__table_loading_internal">
      <span>
        <CircularProgress size={50} />
        <Typography align="center">{loadingLabel}</Typography>
      </span>
    </div>
  );
}

const SchedulerComponent = forwardRef<SchedulerRef, unknown>(function SchedulerComponent(_, ref) {
  const storeApi = useStoreApi();
  const { view, dialog, loading, resourceViewMode, resources, translations, slots, slotProps } =
    useStore(
      (s) => ({
        view: s.view,
        dialog: s.dialog,
        loading: s.loading,
        resourceViewMode: s.resourceViewMode,
        resources: s.resources,
        translations: s.translations,
        slots: s.slots,
        slotProps: s.slotProps,
      }),
      shallowEqual
    );

  const Views = useMemo(() => {
    switch (view) {
      case "month":
        return <Month />;
      case "week":
      case "day":
        return <Week />;
      default:
        return "";
    }
  }, [view]);

  const loadingOwnerState: LoadingOverlaySlotProps = useMemo(
    () => ({ loadingLabel: translations.loading }),
    [translations.loading]
  );

  const LoadingComp = (
    <div className="rs__table_loading">
      {renderSlot({
        slot: slots?.loadingOverlay,
        slotProps: slotProps?.loadingOverlay,
        ownerState: loadingOwnerState,
        defaultElement: <DefaultLoadingOverlay {...loadingOwnerState} />,
      })}
    </div>
  );

  return (
    <Wrapper
      dialog={dialog ? 1 : 0}
      data-testid="rs-wrapper"
      ref={(el) => {
        const calendarRef = ref as React.MutableRefObject<SchedulerRef | null> | null;
        if (calendarRef) {
          calendarRef.current = {
            el: el as HTMLDivElement,
            get scheduler() {
              return storeApi.getState();
            },
          };
        }
      }}
    >
      {loading ? LoadingComp : null}
      <Navigation />
      <Table
        resource_count={resourceViewMode === "default" ? resources.length : 1}
        // Temp resources/default `sticky` wont fix
        sx={{
          overflowX: resourceViewMode === "default" && resources.length > 1 ? "auto" : undefined,
          flexDirection: resourceViewMode === "vertical" ? "column" : undefined,
        }}
        data-testid="grid"
      >
        <PositionProvider>{Views}</PositionProvider>
      </Table>
      {dialog && <Editor />}
    </Wrapper>
  );
});

export default SchedulerComponent;
