import { ReactNode, useState } from "react";
import DateProvider from "../hoc/DateProvider";
import { Button, Popover } from "@mui/material";
import { LocaleArrow } from "../common/LocaleArrow";
import useStore, { shallowEqual } from "../../hooks/useStore";
import useArrowDisable from "../../hooks/useArrowDisable";
import { DateView, DateCalendar } from "@mui/x-date-pickers";

type Props = {
  selectedDate: Date;
  onChange(value: Date): void;
  label: ReactNode;
  buttonLabel: string;
  prevLabel: string;
  nextLabel: string;
  onPrev(): void;
  onNext(): void;
  calendarOpenTo?: DateView;
  calendarViews?: readonly DateView[];
};

/**
 * Shared prev / label / calendar popover / next chrome for day/week/month nav.
 */
export const DateNavButton = ({
  selectedDate,
  onChange,
  label,
  buttonLabel,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  calendarOpenTo = "day",
  calendarViews = ["month", "day"],
}: Props) => {
  const { navigationPickerProps } = useStore(
    (s) => ({ navigationPickerProps: s.navigationPickerProps }),
    shallowEqual
  );
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { prevDisabled, nextDisabled } = useArrowDisable();

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleChange = (e: Date | null) => {
    onChange(e || new Date());
    handleClose();
  };

  return (
    <>
      <LocaleArrow type="prev" onClick={onPrev} disabled={prevDisabled} aria-label={prevLabel} />
      <Button style={{ padding: 4 }} onClick={handleOpen} aria-label={buttonLabel}>
        {label}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <DateProvider>
          <DateCalendar
            {...navigationPickerProps}
            openTo={calendarOpenTo}
            views={[...calendarViews]}
            value={selectedDate}
            onChange={handleChange}
          />
        </DateProvider>
      </Popover>
      <LocaleArrow type="next" onClick={onNext} disabled={nextDisabled} aria-label={nextLabel} />
    </>
  );
};
