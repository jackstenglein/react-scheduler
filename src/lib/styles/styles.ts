import { Paper, alpha } from "@mui/material";
import { styled } from "@mui/material/styles";

export const Wrapper = styled("div")<{ dialog: number }>(({ theme, dialog }) => ({
  position: "relative",
  "& .rs__table_loading": {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999999,
    "& .rs__table_loading_internal": {
      background: dialog ? "" : alpha(theme.palette.background.paper, 0.4),
      height: "100%",
      "& > span": {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        "& >span": {
          marginBottom: 15,
        },
      },
    },
  },
}));

export const Table = styled("div")<{ resource_count: number }>(({ resource_count }) => ({
  position: "relative",
  display: "flex",
  flexDirection: resource_count > 1 ? "row" : "column",
  width: "100%",
  boxSizing: "content-box",
  "& > div": {
    flexShrink: 0,
    flexGrow: 1,
  },
}));

export const NavigationDiv = styled(Paper)<{ sticky?: string }>(({ sticky = "0" }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: sticky === "1" ? "sticky" : "relative",
  top: sticky === "1" ? 0 : undefined,
  zIndex: sticky === "1" ? 999 : undefined,
  boxShadow: "none",
  padding: "2px 0",
  "& > .rs__view_navigator": {
    display: "flex",
    alignItems: "center",
  },
}));

export const AgendaDiv = styled("div")(({ theme }) => ({
  borderStyle: "solid",
  borderColor: (theme.vars || theme).palette.grey[300],
  borderWidth: "1px 1px 0 0",
  "& > .rs__agenda_row": {
    display: "flex",
    "& >.rs__agenda__cell": {
      padding: 4,
      width: "100%",
      maxWidth: 60,
      "& > .MuiTypography-root": {
        position: "sticky",
        top: 0,
        "&.rs__hover__op": {
          cursor: "pointer",
          "&:hover": {
            opacity: 0.7,
            textDecoration: "underline",
          },
        },
      },
    },
    "& .rs__cell": {
      borderStyle: "solid",
      borderColor: (theme.vars || theme).palette.grey[300],
      borderWidth: "0 0 1px 1px",
    },
    "& > .rs__agenda_items": {
      flexGrow: 1,
    },
  },
}));

export const TableGrid = styled("div")<{
  days: number;
  sticky?: string;
  indent?: string;
  /** Use `hidden` on sticky headers so only the body shows a horizontal scrollbar. */
  overflowX?: "auto" | "hidden";
}>(({ days, sticky = "0", indent = "1", overflowX = "auto", theme }) => ({
  display: "grid",
  boxSizing: "border-box",
  gridTemplateColumns:
    +indent > 0 ? `68px repeat(${days}, minmax(65px, 1fr))` : `repeat(${days}, minmax(65px, 1fr))`,
  overflowX,
  overflowY: "hidden",
  // Best-effort; wheel/touch clamping in useSyncScroll is the reliable edge fix.
  overscrollBehaviorX: "none",
  position: sticky === "1" ? "sticky" : "relative",
  // Offset below the sticky navigation bar
  top: sticky === "1" ? 40.5 : undefined,
  zIndex: sticky === "1" ? 99 : undefined,
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns:
      +indent > 0
        ? `30px repeat(${days}, minmax(65px, 1fr))`
        : `repeat(${days}, minmax(65px, 1fr))`,
  },
  border: "1px solid",
  borderColor: (theme.vars || theme).palette.divider,
  "&:first-of-type": {
    background: (theme.vars || theme).palette.background.paper,
    borderTopLeftRadius: theme.spacing(1),
    borderTopRightRadius: theme.spacing(1),
  },
  "&:last-of-type": {
    borderTopWidth: "0",
    borderBottomLeftRadius: theme.spacing(1),
    borderBottomRightRadius: theme.spacing(1),
  },
  "& .rs__cell": {
    background: (theme.vars || theme).palette.background.paper,
    position: "relative",
    borderStyle: "solid",
    borderColor: (theme.vars || theme).palette.grey[300],
    borderWidth: "0 1px 1px 0",
    "& .rs__hover__op": {
      cursor: "pointer",
      "&:hover": {
        opacity: 0.7,
        textDecoration: "underline",
      },
    },
  },
}));

export const EventItemPaper = styled(Paper)<{ disabled?: boolean }>(({ disabled }) => ({
  height: "100%",
  display: "block",
  cursor: disabled ? "not-allowed" : "pointer",
  overflow: "hidden",
  "& .MuiButtonBase-root": {
    width: "100%",
    height: "100%",
    display: "block",
    textAlign: "left",
    "& > div": {
      height: "100%",
    },
  },
}));

export const PopperInner = styled("div")(({ theme }) => ({
  maxWidth: "100%",
  width: 400,
  "& > div": {
    padding: "5px 10px",
    "& .rs__popper_actions": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      "& .MuiIconButton-root": {
        color: (theme.vars || theme).palette.primary.contrastText,
      },
    },
  },
}));

export const EventActions = styled("div")(({ theme }) => ({
  display: "inherit",
  "& .MuiIconButton-root": {
    color: (theme.vars || theme).palette.primary.contrastText,
  },
  "& .MuiButton-root": {
    "&.delete": {
      color: (theme.vars || theme).palette.error.main,
    },
    "&.cancel": {
      color: (theme.vars || theme).palette.action.disabled,
    },
  },
}));

export const TimeIndicatorBar = styled("div")(({ theme }) => ({
  position: "absolute",
  zIndex: 9,
  width: "100%",
  display: "flex",
  "& > div:first-of-type": {
    height: 12,
    width: 12,
    borderRadius: "50%",
    background: (theme.vars || theme).palette.error.light,
    marginLeft: -6,
    marginTop: -5,
  },
  "& > div:last-of-type": {
    borderTop: `solid 2px ${(theme.vars || theme).palette.error.light}`,
    width: "100%",
  },
}));
