import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

/** A password TextField with a show/hide eye icon — a drop-in replacement
 * for `<TextField type="password" ... />`. Accepts every normal TextField
 * prop (value, onChange, label, helperText, autoFocus, fullWidth, etc.)
 * and just adds the toggle on top. Uses `slotProps.input` (not the older
 * `InputProps`, which MUI v6+ deprecated and this project's MUI v9 no
 * longer honors at all). */
export default function PasswordField({ slotProps, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((v) => !v)}
                edge="end"
                size="small"
                aria-label={visible ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {visible ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
              {slotProps?.input?.endAdornment}
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
