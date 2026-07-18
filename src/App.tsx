import { Scheduler } from "./lib";
import { EVENTS } from "./events";
import { useRef } from "react";
import { SchedulerRef } from "./lib/types";
import { Link } from "react-router-dom";
import { Box } from "@mui/material";

function App() {
  const calendarRef = useRef<SchedulerRef>(null);

  return (
    <Box sx={{ mx: 1 }}>
      <div>
        <Link to="/1">Go to page 1</Link>
      </div>

      <Scheduler
        ref={calendarRef}
        events={EVENTS}
        navigation
        week={{
          startHour: 0,
          endHour: 23,
          step: 60,
          weekStartOn: 0,
          weekDays: [0, 1, 2, 3, 4, 5, 6],
          navigation: true,
        }}
        day={{
          startHour: 0,
          endHour: 23,
          step: 60,
          navigation: true,
        }}
      />
    </Box>
  );
}

export default App;
