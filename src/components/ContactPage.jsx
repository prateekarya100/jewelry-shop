import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import PolicyPage from "./PolicyPage.jsx";

export default function ContactPage() {
  return (
    <PolicyPage title="Contact Us">
      <p>
        For order questions, exchanges, or anything else — reach us directly
        through any of the channels below. We aim to respond within 1 business
        day.
      </p>

      <Grid container spacing={2.5} sx={{ mt: 1, mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ContactCard icon={EmailOutlinedIcon} label="Email">
            support@priyasafashion.com
          </ContactCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ContactCard icon={PhoneOutlinedIcon} label="Phone">
            +91 9650841442
          </ContactCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ContactCard icon={PlaceOutlinedIcon} label="Registered address">
            C 25 Motikunj Extension, Mathura - UP-281001
          </ContactCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ContactCard icon={ScheduleOutlinedIcon} label="Support hours">
            Monday-Saturday, 10am-6pm IST
          </ContactCard>
        </Grid>
      </Grid>

      <p style={{ fontSize: 13, color: "rgba(36,26,31,0.5)" }}>
        Note: the phone number and address above are placeholders — replace them
        with your real business contact details in{" "}
        <code>src/components/ContactPage.jsx</code> before going live. Razorpay
        and most payment gateways require a genuine, working phone number and
        physical address here as part of website verification.
      </p>
    </PolicyPage>
  );
}

function ContactCard({ icon: Icon, label, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, height: "100%" }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Icon sx={{ color: "secondary.dark", fontSize: 22, mt: 0.25 }} />
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 600, mt: 0.25 }}>{children}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
