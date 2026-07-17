import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { DefaultResource } from "../../types";
import useStore, { shallowEqual } from "../../hooks/useStore";
import { renderSlot } from "../../slots/resolveSlot";

interface ResourceHeaderProps {
  resource: DefaultResource;
}
const ResourceHeader = ({ resource }: ResourceHeaderProps) => {
  const { slots, slotProps, resourceFields, direction, resourceViewMode } = useStore(
    (s) => ({
      slots: s.slots,
      slotProps: s.slotProps,
      resourceFields: s.resourceFields,
      direction: s.direction,
      resourceViewMode: s.resourceViewMode,
    }),
    shallowEqual
  );
  const theme = useTheme();

  const text = resource[resourceFields.textField];
  const subtext = resource[resourceFields.subTextField || ""];
  const avatar = resource[resourceFields.avatarField || ""];
  const color = resource[resourceFields.colorField || ""];

  if (slots?.resourceHeader) {
    return (
      <>
        {renderSlot({
          slot: slots.resourceHeader,
          slotProps: slotProps?.resourceHeader,
          ownerState: { resource },
          defaultElement: null,
        })}
      </>
    );
  }

  return (
    <ListItem
      sx={{
        padding: "2px 10px",
        textAlign: direction === "rtl" ? "right" : "left",
        ...(resourceViewMode === "tabs"
          ? {}
          : resourceViewMode === "vertical"
            ? {
                display: "block",
                textAlign: "center",
                position: "sticky",
                top: 4,
              }
            : {
                borderColor: (theme.vars || theme).palette.grey[300],
                borderStyle: "solid",
                borderWidth: 1,
              }),
      }}
      component="div"
    >
      <ListItemAvatar>
        <Avatar sx={{ background: color, margin: "auto" }} alt={text} src={avatar} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="body2" noWrap={resourceViewMode !== "vertical"}>
            {text}
          </Typography>
        }
        secondary={
          <Typography
            variant="caption"
            color="textSecondary"
            noWrap={resourceViewMode !== "vertical"}
          >
            {subtext}
          </Typography>
        }
      />
    </ListItem>
  );
};

export { ResourceHeader };
