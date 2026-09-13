import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

const TrackerConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 16 },
  [`& .${stepConnectorClasses.line}`]: {
    borderTopWidth: 2,
    borderColor: '#e8dcd2',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.secondary.main,
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.secondary.main,
  },
}));

function TrackerStepIcon({ active, completed, icon: Icon }) {
  return (
    <Box sx={{
      width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: completed || active ? 'secondary.main' : '#efe3da',
      color: completed || active ? 'secondary.contrastText' : '#b8a99c',
      transition: 'background-color 0.2s ease',
    }}>
      {completed ? <CheckIcon sx={{ fontSize: 18 }} /> : <Icon sx={{ fontSize: 18 }} />}
    </Box>
  );
}

const TRACKER_STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckIcon },
  { key: 'shipped', label: 'Shipped', icon: LocalShippingOutlinedIcon },
  { key: 'delivered', label: 'Delivered', icon: HomeOutlinedIcon },
];

/** A visual progress tracker (like Amazon/Flipkart order tracking), shared
 * by the Admin Dashboard's order view and the customer's My Orders page, so
 * both always show identical progress. Purely illustrative — the actual
 * status control (where one exists) lives elsewhere. Not shown for
 * cancelled orders, since a linear tracker doesn't make sense there. */
export default function OrderProgressTracker({ status }) {
  const activeIndex = TRACKER_STEPS.findIndex((s) => s.key === status);
  const currentIndex = activeIndex === -1 ? -1 : activeIndex;

  return (
    <Stepper alternativeLabel activeStep={currentIndex} connector={<TrackerConnector />} sx={{ px: { xs: 0, sm: 2 } }}>
      {TRACKER_STEPS.map((step, idx) => (
        <Step key={step.key} completed={idx < currentIndex}>
          <StepLabel StepIconComponent={() => (
            <TrackerStepIcon active={idx === currentIndex} completed={idx < currentIndex} icon={step.icon} />
          )}>
            <Typography variant="caption" sx={{ fontWeight: idx <= currentIndex ? 700 : 500, color: idx <= currentIndex ? 'text.primary' : 'text.secondary' }}>
              {step.label}
            </Typography>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
