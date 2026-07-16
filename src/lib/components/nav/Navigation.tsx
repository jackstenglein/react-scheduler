import React, { useState } from "react";
import { Button, MenuItem, Menu } from "@mui/material";
import { WeekDateBtn } from "./WeekDateBtn";
import { DayDateBtn } from "./DayDateBtn";
import { MonthDateBtn } from "./MonthDateBtn";
import useStore from "../../hooks/useStore";
import { NavigationDiv } from "../../styles/styles";
import { getTimeZonedDate } from "../../helpers/generals";
import { ExpandMore } from "@mui/icons-material";
import { View } from "../../types";

export type { View };

const Navigation = () => {
  const {
    selectedDate,
    view,
    week,
    handleState,
    getViews,
    translations,
    navigation,
    day,
    month,
    disableViewNavigator,
    onSelectedDateChange,
    onViewChange,
    stickyNavigation,
    timeZone,
    agenda,
    toggleAgenda,
  } = useStore();
  const [viewMenuAnchor, setViewMenuAnchor] = useState<Element | null>();
  const views = getViews();

  const onToggleViewMenu = (event?: React.MouseEvent<HTMLButtonElement>) => {
    setViewMenuAnchor(event?.currentTarget);
  };

  const handleSelectedDateChange = (date: Date) => {
    handleState(date, "selectedDate");

    if (onSelectedDateChange && typeof onSelectedDateChange === "function") {
      onSelectedDateChange(date);
    }
  };

  const handleChangeView = (view: View) => {
    if (view === "agenda") {
      toggleAgenda();
      return;
    }
    handleState(view, "view");
    if (onViewChange && typeof onViewChange === "function") {
      onViewChange(view, agenda);
    }
  };

  const renderDateSelector = () => {
    switch (view) {
      case "month":
        return (
          month?.navigation && (
            <MonthDateBtn selectedDate={selectedDate} onChange={handleSelectedDateChange} />
          )
        );
      case "week":
        return (
          week?.navigation && (
            <WeekDateBtn
              selectedDate={selectedDate}
              onChange={handleSelectedDateChange}
              weekProps={week!}
            />
          )
        );
      case "day":
        return (
          day?.navigation && (
            <DayDateBtn selectedDate={selectedDate} onChange={handleSelectedDateChange} />
          )
        );
      default:
        return "";
    }
  };

  if (!navigation && disableViewNavigator) return null;

  return (
    <NavigationDiv sticky={stickyNavigation ? "1" : "0"}>
      <div data-testid="date-navigator">{navigation && renderDateSelector()}</div>

      <div
        className="rs__view_navigator"
        data-testid="view-navigator"
        style={{
          visibility: disableViewNavigator ? "hidden" : "visible",
        }}
      >
        <Button
          onClick={() => handleSelectedDateChange(getTimeZonedDate(new Date(), timeZone))}
          aria-label={translations.navigation.today}
        >
          {translations.navigation.today}
        </Button>

        {views.length > 1 && (
          <>
            <Button
              data-testid="view-button"
              endIcon={<ExpandMore />}
              onClick={onToggleViewMenu}
              sx={{ mr: 2 }}
            >
              {translations.navigation[view]}
            </Button>
            <Menu
              open={Boolean(viewMenuAnchor)}
              anchorEl={viewMenuAnchor}
              onClose={() => onToggleViewMenu()}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}
            >
              {views.map((v) => (
                <MenuItem
                  key={v}
                  selected={v === view}
                  onClick={() => {
                    handleChangeView(v);
                    onToggleViewMenu();
                  }}
                >
                  {translations.navigation[v]}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </div>
    </NavigationDiv>
  );
};

export { Navigation };
