import { DialogProps, GridSize } from "@mui/material";
import { DateCalendarProps } from "@mui/x-date-pickers";
import { Locale } from "date-fns";
import { DragEvent } from "react";
import { SelectOption } from "./components/inputs/SelectInput";
import { Store } from "./store/types";
import { StateItem } from "./views/Editor";
import type { RRule, RRuleSet } from "rrule";

export type View = "month" | "week" | "day" | "agenda";

export type DayHours =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24;

export type WeekDays = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface CommonWeekViewProps {
  weekDays: WeekDays[];
  weekStartOn: WeekDays;
  disableGoToDay?: boolean;
}

interface CommonViewProps {
  startHour: DayHours;
  endHour: DayHours;
  navigation?: boolean;
  step: number;
}

export interface MonthProps extends CommonWeekViewProps, CommonViewProps {}

export interface WeekProps extends CommonWeekViewProps, CommonViewProps {}

export interface DayProps extends CommonViewProps {}

export interface CellRenderedProps {
  day: Date;
  start: Date;
  end: Date;
  height: number;
  onClick(): void;
  onDragOver(e: DragEvent<HTMLButtonElement>): void;
  onDragEnter(e: DragEvent<HTMLButtonElement>): void;
  onDragLeave(e: DragEvent<HTMLButtonElement>): void;
  onDrop(e: DragEvent<HTMLButtonElement>): void;
}

/** Recurrence definition — a single `RRule` or an `RRuleSet` (multiple rules, RDATEs, EXDATEs). */
export type EventRecurrence = RRule | RRuleSet;

interface CalendarEvent {
  event_id: number | string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  start: Date;
  end: Date;
  recurring?: EventRecurrence;
  disabled?: boolean;
  color?: string;
  textColor?: string;
  editable?: boolean;
  deletable?: boolean;
  draggable?: boolean;
  allDay?: boolean;
  /**
   * @default " "
   * passed as a children to mui <Avatar /> component
   */
  agendaAvatar?: React.ReactElement | string;
}
export interface Translations {
  navigation: Record<View, string> & { today: string; agenda: string };
  form: {
    addTitle: string;
    editTitle: string;
    confirm: string;
    delete: string;
    cancel: string;
  };
  event: Record<string, string> & {
    title: string;
    subtitle: string;
    start: string;
    end: string;
    allDay: string;
  };
  validation?: {
    required?: string;
    invalidEmail?: string;
    onlyNumbers?: string;
    min?: string | ((min: number) => string);
    max?: string | ((max: number) => string);
  };
  moreEvents: string;
  noDataToDisplay: string;
  loading: string;
}

export type InputTypes = "input" | "date" | "select" | "hidden";

export interface EventRendererProps
  extends Pick<
    React.HTMLAttributes<HTMLElement>,
    "draggable" | "onDragStart" | "onDragEnd" | "onDragOver" | "onDragEnter" | "onClick"
  > {
  event: ProcessedEvent;
}
export interface FieldInputProps {
  /** Available to all InputTypes */
  label?: string;
  /** Available to all InputTypes */
  placeholder?: string;
  /** Available to all InputTypes
   * @default false
   */
  required?: boolean;
  /** Available to all InputTypes
   * @default "outline"
   */
  variant?: "standard" | "filled" | "outlined";
  /** Available to all InputTypes */
  disabled?: boolean;
  /** Available when @input="text" ONLY - Minimum length */
  min?: number;
  /** Available when @input="text" ONLY - Maximum length */
  max?: number;
  /** Available when @input="text" ONLY - Apply email Regex */
  email?: boolean;
  /** Available when @input="text" ONLY - Only numbers(int/float) allowed */
  decimal?: boolean;
  /** Available when @input="text" ONLY - Allow Multiline input. Use @rows property to set initial rows height */
  multiline?: boolean;
  /** Available when @input="text" ONLY - initial rows height*/
  rows?: number;
  /** Available when @input="date" ONLY
   * @default "datetime"
   */
  type?: "date" | "datetime";
  /** Available when @input="select" ONLY - Multi-Select input style.
   * if you use "default" property with this, make sure your "default" property is an instance of Array
   */
  multiple?: "chips" | "default";
  /** Available when @input="select" ONLY - display loading spinner instead of expand arrow */
  loading?: boolean;
  /** Available when @input="select" ONLY - Custom error message */
  errMsg?: string;

  /* Used for Grid alignment in a single row md | sm | xs */
  md?: GridSize;
  /* Used for Grid alignment in a single row md | sm | xs */
  sm?: GridSize;
  /* Used for Grid alignment in a single row md | sm | xs */
  xs?: GridSize;
}
export interface FieldProps {
  name: string;
  type: InputTypes;
  /** Required for type="select" */
  options?: Array<SelectOption>;
  default?: string | number | Date | any;
  config?: FieldInputProps;
}
export type ProcessedEvent = CalendarEvent & Record<string, any>;
export type RecurrenceEvent = ProcessedEvent & { recurrenceId?: number };
export type EventActions = "create" | "edit";
export type RemoteQuery = {
  start: Date;
  end: Date;
  view: "day" | "week" | "month";
};
export type DefaultResource = {
  assignee?: string | number;
  text?: string;
  subtext?: string;
  avatar?: string;
  color?: string;
} & Record<string, any>;
export type ResourceFields = {
  idField: string;
  textField: string;
  subTextField?: string;
  avatarField?: string;
  colorField?: string;
} & Record<string, string>;

/** Props-or-callback form used by MUI-style `slotProps`. */
export type SlotPropsOf<P> = Partial<P> | ((ownerState: P) => Partial<P> | undefined);

export type EventSlotProps = EventRendererProps;

export type EventViewerSlotProps = {
  event: ProcessedEvent;
  close: () => void;
};

export type EventViewerTitleSlotProps = {
  event: ProcessedEvent;
};

export type EventViewerSubtitleSlotProps = {
  event: ProcessedEvent;
};

export type EventViewerExtraSlotProps = {
  event: ProcessedEvent;
  fields: FieldProps[];
};

export type LoadingOverlaySlotProps = {
  loadingLabel: string;
};

export type CellSlotProps = CellRenderedProps & {
  resourceKey: string;
  resourceVal: string | number | null;
};

export type DayHeaderSlotProps = {
  day: Date;
  events: ProcessedEvent[];
  resource?: DefaultResource;
};

export type HourLabelSlotProps = {
  hour: string;
  date: Date;
  hourFormat: "12" | "24";
};

export type ResourceHeaderSlotProps = {
  resource: DefaultResource;
};

export type NavigationExtraSlotProps = {
  view: View;
};

export type EventViewerActionsExtraSlotProps = {
  event: ProcessedEvent;
};

export interface SchedulerHelpers {
  state: Record<string, StateItem>;
  close(): void;
  loading(status: boolean): void;
  edited?: ProcessedEvent;
  onConfirm(event: ProcessedEvent | ProcessedEvent[], action: EventActions): void;
  [resourceKey: string]: unknown;
}

export type EditorSlotProps = SchedulerHelpers;

/** Replaceable UI regions (MUI slots pattern). */
export interface SchedulerSlots {
  event?: React.ComponentType<EventSlotProps>;
  eventViewer?: React.ComponentType<EventViewerSlotProps>;
  eventViewerTitle?: React.ComponentType<EventViewerTitleSlotProps>;
  eventViewerSubtitle?: React.ComponentType<EventViewerSubtitleSlotProps>;
  eventViewerExtra?: React.ComponentType<EventViewerExtraSlotProps>;
  loadingOverlay?: React.ComponentType<LoadingOverlaySlotProps>;
  cell?: React.ComponentType<CellSlotProps>;
  dayHeader?: React.ComponentType<DayHeaderSlotProps>;
  hourLabel?: React.ComponentType<HourLabelSlotProps>;
  editor?: React.ComponentType<EditorSlotProps>;
  resourceHeader?: React.ComponentType<ResourceHeaderSlotProps>;
  navigationExtra?: React.ComponentType<NavigationExtraSlotProps>;
  eventViewerActionsExtra?: React.ComponentType<EventViewerActionsExtraSlotProps>;
}

export interface SchedulerSlotProps {
  event?: SlotPropsOf<EventSlotProps>;
  eventViewer?: SlotPropsOf<EventViewerSlotProps>;
  eventViewerTitle?: SlotPropsOf<EventViewerTitleSlotProps>;
  eventViewerSubtitle?: SlotPropsOf<EventViewerSubtitleSlotProps>;
  eventViewerExtra?: SlotPropsOf<EventViewerExtraSlotProps>;
  loadingOverlay?: SlotPropsOf<LoadingOverlaySlotProps>;
  cell?: SlotPropsOf<CellSlotProps>;
  dayHeader?: SlotPropsOf<DayHeaderSlotProps>;
  hourLabel?: SlotPropsOf<HourLabelSlotProps>;
  editor?: SlotPropsOf<EditorSlotProps>;
  resourceHeader?: SlotPropsOf<ResourceHeaderSlotProps>;
  navigationExtra?: SlotPropsOf<NavigationExtraSlotProps>;
  eventViewerActionsExtra?: SlotPropsOf<EventViewerActionsExtraSlotProps>;
}
export interface SchedulerProps {
  /**Min height of table
   * @default 600
   */
  height: number;
  /** Initial view to load */
  view: View;
  /**Activate Agenda view */
  agenda?: boolean;
  /** if true, day rows without event will be shown */
  alwaysShowAgendaDays?: boolean;
  /**Month view settings */
  month: MonthProps | null;
  /**Week view settings */
  week: WeekProps | null;
  /**Day view settings */
  day: DayProps | null;
  /**Initial date selected */
  selectedDate: Date;
  /** Show/Hide date navigation */
  navigation?: boolean;
  /** Show/Hide view navigator */
  disableViewNavigator?: boolean;
  /** */
  navigationPickerProps?: Partial<
    Omit<
      DateCalendarProps,
      "open" | "onClose" | "openTo" | "views" | "value" | "readOnly" | "onChange"
    >
  >;
  /**Events to display */
  events: ProcessedEvent[];
  /**
   * MUI-style slot components for replaceable UI regions
   * (`event`, `cell`, `dayHeader`, `hourLabel`, `editor`, `resourceHeader`, …).
   */
  slots?: SchedulerSlots;
  /** Props (or ownerState callbacks) passed into each slot */
  slotProps?: SchedulerSlotProps;
  /**Async function to load remote data with current view data. */
  getRemoteEvents?(params: RemoteQuery): Promise<ProcessedEvent[] | void>;
  /**Custom additional fields with it's settings */
  fields: FieldProps[];
  /**Table loading state */
  loading?: boolean;
  /**Async function triggered when add/edit event */
  onConfirm?(event: ProcessedEvent, action: EventActions): Promise<ProcessedEvent>;
  /**Async function triggered when delete event */
  onDelete?(deletedId: string | number): Promise<string | number | void>;
  /** if true, the viewer popover will be disabled globally */
  disableViewer?: boolean;
  /**
   * Whether event items hide their start/end time.
   * @default false
   */
  hideDates?: boolean;
  /**Resources array to split event views with resources */
  resources: DefaultResource[];
  /**Map resources fields */
  resourceFields: ResourceFields;
  /** Triggered when resource tabs changes */
  onResourceChange?(resource: DefaultResource): void;
  /**Resource header view mode
   * @default "default"
   */
  resourceViewMode: "default" | "vertical" | "tabs";
  /**Direction of table */
  direction: "rtl" | "ltr";
  /**Editor dialog maxWith
   * @default "md"
   */
  dialogMaxWidth: DialogProps["maxWidth"];
  /**
   * date-fns Locale object
   */
  locale: Locale;
  /**
   * Localization
   */
  translations: Translations;
  /**
   * Hour Format
   */
  hourFormat: "12" | "24";
  /**
   * Time zone IANA ID: https://data.iana.org/time-zones/releases
   */
  timeZone?: string;
  /**
   * Triggered when event is dropped on time slot.
   */
  onEventDrop?(
    event: DragEvent<HTMLButtonElement>,
    droppedOn: Date,
    updatedEvent: ProcessedEvent,
    originalEvent: ProcessedEvent
  ): Promise<ProcessedEvent | void>;
  /**
   *
   */
  onEventClick?(event: ProcessedEvent): void;
  /**
   * Triggered when an event item is being edited from the popover
   */
  onEventEdit?(event: ProcessedEvent): void;
  /**
   * If event is deletable, applied to all events globally, overridden by event specific deletable prop
   * @default true
   */
  deletable?: boolean;
  /**
   * If calendar is editable, applied to all events/cells globally, overridden by event specific editable prop
   * @default true
   */
  editable?: boolean;
  /**
   * If event is draggable, applied to all events globally, overridden by event specific draggable prop
   * @default true
   */
  draggable?: boolean;
  /**
   * Triggered when the `selectedDate` prop changes by navigation date picker or `today` button.
   */
  onSelectedDateChange?(date: Date): void;
  /**
   * Triggered when navigation view changes.
   */
  onViewChange?(view: View, agenda?: boolean): void;
  /**
   * Overrides the default behavior of more events button
   */
  onClickMore?(date: Date, gotToDay: (date: Date) => void): void;
  /**
   *
   */
  onCellClick?(start: Date, end: Date, resourceKey?: string, resourceVal?: string | number): void;
}

export interface SchedulerRef {
  el: HTMLDivElement;
  scheduler: Store;
}

export interface Scheduler extends Partial<SchedulerProps> {}
