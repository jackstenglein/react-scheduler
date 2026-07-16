import { format, addDays } from "date-fns";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { DateNavButton } from "./DateNavButton";

interface DayDateBtnProps {
  selectedDate: Date;
  onChange(value: Date): void;
}

const DayDateBtn = ({ selectedDate, onChange }: DayDateBtnProps) => {
  const { locale } = useStore((s) => ({ locale: s.locale }), shallowEqual);

  return (
    <DateNavButton
      selectedDate={selectedDate}
      onChange={onChange}
      label={format(selectedDate, "dd MMMM yyyy", { locale })}
      buttonLabel="selected date"
      prevLabel="previous day"
      nextLabel="next day"
      onPrev={() => onChange(addDays(selectedDate, -1))}
      onNext={() => onChange(addDays(selectedDate, 1))}
      calendarOpenTo="day"
      calendarViews={["month", "day"]}
    />
  );
};

export { DayDateBtn };
