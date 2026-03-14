import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { RecurringEditMode } from "../../types";

interface RecurringEditDialogProps {
  open: boolean;
  action: "edit" | "delete";
  onConfirm(mode: RecurringEditMode): void;
  onCancel(): void;
}

const RecurringEditDialog = ({ open, action, onConfirm, onCancel }: RecurringEditDialogProps) => {
  const [mode, setMode] = useState<RecurringEditMode>("this");
  const verb = action === "delete" ? "Delete" : "Edit";

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{verb} recurring event</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {action === "delete"
            ? "Which events would you like to delete?"
            : "Which events would you like to edit?"}
        </Typography>
        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as RecurringEditMode)}>
          <FormControlLabel value="this" control={<Radio />} label="This event" />
          <FormControlLabel
            value="following"
            control={<Radio />}
            label="This and following events"
          />
          <FormControlLabel value="all" control={<Radio />} label="All events" />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={action === "delete" ? "error" : "primary"}
          onClick={() => onConfirm(mode)}
        >
          {verb}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringEditDialog;
