import { format, getMonth, setMonth } from "date-fns";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { DateNavButton } from "./DateNavButton";

interface MonthDateBtnProps {
  selectedDate: Date;
  onChange(value: Date): void;
}

const MonthDateBtn = ({ selectedDate, onChange }: MonthDateBtnProps) => {
  const { locale } = useStore((s) => ({ locale: s.locale }), shallowEqual);
  const currentMonth = getMonth(selectedDate);

  return (
    <DateNavButton
      selectedDate={selectedDate}
      onChange={onChange}
      label={format(selectedDate, "MMMM yyyy", { locale })}
      buttonLabel="selected month"
      prevLabel="previous month"
      nextLabel="next month"
      onPrev={() => onChange(setMonth(selectedDate, currentMonth - 1))}
      onNext={() => onChange(setMonth(selectedDate, currentMonth + 1))}
      calendarOpenTo="month"
      calendarViews={["year", "month"]}
    />
  );
};

export { MonthDateBtn };
