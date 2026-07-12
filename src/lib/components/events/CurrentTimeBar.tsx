import { useEffect, useState } from "react";
import { differenceInMinutes, set } from "date-fns";
import { getTimeZonedDate } from "../../helpers/generals";
import { TimeIndicatorBar } from "../../styles/styles";

interface CurrentTimeBarProps {
  startHour: number;
  step: number;
  minuteHeight: number;
  timeZone?: string;
  zIndex?: number;
}

function calculateTop({ startHour, minuteHeight, timeZone }: CurrentTimeBarProps): number {
  const now = getTimeZonedDate(new Date(), timeZone);
  const minutesFromTop = differenceInMinutes(now, set(now, { hours: startHour, minutes: 0 }));
  return minutesFromTop * minuteHeight;
}

const CurrentTimeBar = (props: CurrentTimeBarProps) => {
  const [top, setTop] = useState(calculateTop(props));
  const { startHour, step, minuteHeight, timeZone } = props;

  useEffect(() => {
    const calcProps = { startHour, step, minuteHeight, timeZone };
    setTop(calculateTop(calcProps));

    const interval = setInterval(() => setTop(calculateTop(calcProps)), 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setTop(calculateTop(calcProps));
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startHour, step, minuteHeight, timeZone]);

  // Prevent showing bar on top of days/header
  if (top < 0) return null;

  return (
    <TimeIndicatorBar style={{ top, zIndex: props.zIndex }}>
      <div />
      <div />
    </TimeIndicatorBar>
  );
};

export default CurrentTimeBar;
