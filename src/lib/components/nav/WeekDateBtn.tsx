import { endOfWeek, format, startOfWeek, addDays } from "date-fns";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { WeekProps } from "../../types";
import { DateNavButton } from "./DateNavButton";

interface WeekDateBtnProps {
  selectedDate: Date;
  onChange(value: Date): void;
  weekProps: WeekProps;
}

const WeekDateBtn = ({ selectedDate, onChange, weekProps }: WeekDateBtnProps) => {
  const { locale } = useStore((s) => ({ locale: s.locale }), shallowEqual);
  const { weekStartOn } = weekProps;
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartOn });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartOn });

  return (
    <DateNavButton
      selectedDate={selectedDate}
      onChange={onChange}
      label={`${format(weekStart, "dd", { locale })} - ${format(weekEnd, "dd MMM yyyy", {
        locale,
      })}`}
      buttonLabel="selected week"
      prevLabel="previous week"
      nextLabel="next week"
      onPrev={() => onChange(addDays(weekStart, -1))}
      onNext={() => onChange(addDays(weekEnd, 1))}
      calendarOpenTo="day"
      calendarViews={["month", "day"]}
    />
  );
};

export { WeekDateBtn };
