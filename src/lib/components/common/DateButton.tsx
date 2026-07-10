import { Button, Typography } from "@mui/material";
import { format, Locale } from "date-fns";
import { isTimeZonedToday } from "../../helpers/generals";
import useStore from "../../hooks/useStore";

interface DateButtonProps {
  date: Date;
  onClick?: (date: Date) => void;
  locale: Locale;
}

/**
 * Renders a DateButton in the header of the calendar.
 */
export function DateButton({ date, onClick, locale }: DateButtonProps) {
  const { timeZone } = useStore();
  const isToday = isTimeZonedToday({ dateLeft: date, timeZone });
  return (
    <Button
      onClick={() => onClick?.(date)}
      sx={{
        height: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        padding: 1.5,
        background: "none",
      }}
    >
      <Typography
        variant="subtitle1"
        component="span"
        color={isToday ? "primary" : "textSecondary"}
        sx={{ fontSize: "0.875rem", textTransform: "capitalize" }}
      >
        {format(date, "EEE", { locale })}
      </Typography>
      <Typography
        component="span"
        color={isToday ? "primary.contrastText" : "textPrimary"}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          backgroundColor: isToday ? "primary.main" : undefined,
          "button:hover &": {
            backgroundColor: isToday
              ? "primary.dark"
              : "var(--mui-palette-action-hover, rgba(25, 118, 210, 0.04))",
          },
        }}
      >
        {format(date, "d", { locale })}
      </Typography>
    </Button>
  );
}
