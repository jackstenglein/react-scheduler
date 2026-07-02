import { DayProps, Translations, WeekProps } from "../../types";
import { defaultProps } from "../default";

describe("defaultProps", () => {
  it("applies default view configuration", () => {
    const props = defaultProps({});
    expect(props.view).toBe("week");
    expect(props.height).toBe(600);
    expect(props.events).toEqual([]);
    expect(props.editable).toBe(true);
    expect(props.deletable).toBe(true);
    expect(props.draggable).toBe(true);
  });

  it("merges custom view settings with defaults", () => {
    const props = defaultProps({
      week: { startHour: 8, endHour: 20 } as WeekProps,
    });
    expect(props.week?.startHour).toBe(8);
    expect(props.week?.endHour).toBe(20);
  });

  it("disables views when set to null", () => {
    const props = defaultProps({
      month: null,
      week: null,
      day: { startHour: 7, endHour: 19, step: 30 },
    });
    expect(props.month).toBeNull();
    expect(props.week).toBeNull();
    expect(props.view).toBe("day");
  });

  it("falls back to first available view when default view is disabled", () => {
    const props = defaultProps({
      view: "week",
      month: null,
      week: null,
      day: {} as DayProps,
    });
    expect(props.view).toBe("day");
  });

  it("merges custom translations", () => {
    const props = defaultProps({
      translations: {
        navigation: { today: "Now" },
        form: { confirm: "Save" },
      } as Translations,
    });
    expect(props.translations.navigation.today).toBe("Now");
    expect(props.translations.navigation.month).toBe("Month");
    expect(props.translations.form.confirm).toBe("Save");
    expect(props.translations.form.addTitle).toBe("Add Event");
  });

  it("merges resource field configuration", () => {
    const props = defaultProps({
      resourceFields: { idField: "owner", textField: "name" },
    });
    expect(props.resourceFields.idField).toBe("owner");
    expect(props.resourceFields.textField).toBe("name");
    expect(props.resourceFields.colorField).toBe("color");
  });

  it("respects explicit configuration overrides", () => {
    const props = defaultProps({
      hourFormat: "24",
      direction: "rtl",
      dialogMaxWidth: "lg",
      resourceViewMode: "vertical",
      editable: false,
      agenda: false,
    });
    expect(props.hourFormat).toBe("24");
    expect(props.direction).toBe("rtl");
    expect(props.dialogMaxWidth).toBe("lg");
    expect(props.resourceViewMode).toBe("vertical");
    expect(props.editable).toBe(false);
    expect(props.agenda).toBe(false);
  });

  it("enables agenda by default", () => {
    expect(defaultProps({}).enableAgenda).toBe(true);
  });

  it("uses provided selectedDate", () => {
    const selectedDate = new Date(2025, 5, 1);
    const props = defaultProps({ selectedDate });
    expect(props.selectedDate).toBeInstanceOf(Date);
  });
});
