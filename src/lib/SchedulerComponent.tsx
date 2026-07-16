import { CircularProgress, Typography } from "@mui/material";
import { forwardRef, useMemo } from "react";
import { Navigation } from "./components/nav/Navigation";
import useStore, { shallowEqual, useStoreApi } from "./hooks/useStore";
import { PositionProvider } from "./positionManager/provider";
import { Table, Wrapper } from "./styles/styles";
import { SchedulerRef } from "./types";
import Editor from "./views/Editor";
import { Month } from "./views/Month";
import { Week } from "./views/Week";

const SchedulerComponent = forwardRef<SchedulerRef, unknown>(function SchedulerComponent(_, ref) {
  const storeApi = useStoreApi();
  const { view, dialog, loading, loadingComponent, resourceViewMode, resources, translations } =
    useStore(
      (s) => ({
        view: s.view,
        dialog: s.dialog,
        loading: s.loading,
        loadingComponent: s.loadingComponent,
        resourceViewMode: s.resourceViewMode,
        resources: s.resources,
        translations: s.translations,
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

  const LoadingComp = useMemo(() => {
    return (
      <div className="rs__table_loading">
        {loadingComponent || (
          <div className="rs__table_loading_internal">
            <span>
              <CircularProgress size={50} />
              <Typography align="center">{translations.loading}</Typography>
            </span>
          </div>
        )}
      </div>
    );
  }, [loadingComponent, translations.loading]);

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
        // Temp resources/default `sticky` wontfix
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
