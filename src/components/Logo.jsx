import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import iconGold from '../assets/icon-gold.png';
import iconCream from '../assets/icon-cream.png';

/**
 * The site's logo — a hand-drawn hand-and-necklace mark (designed
 * externally, not generated code) paired with the wordmark. `variant="light"`
 * (default) is for use on dark backgrounds (header, footer, admin sidebar)
 * and uses the cream-colored icon; `variant="dark"` is for light backgrounds
 * (login cards, etc.) and uses the gold-colored icon.
 */
export default function Logo({ variant = 'light', size = 34, showWordmark = true, wordmarkSize = 21, wordmarkSx = {} }) {
  const mark = variant === 'light' ? '#faf1ec' : '#1c1420';
  const icon = variant === 'light' ? iconCream : iconGold;

  return (
    <Stack direction="row" alignItems="center" spacing={1.2}>
      <Box
        component="img"
        src={icon}
        alt=""
        aria-hidden="true"
        sx={{ height: size, width: 'auto', flexShrink: 0, display: 'block' }}
      />
      {showWordmark && (
        <Typography sx={{ fontFamily: "'Playfair Display', serif", fontSize: wordmarkSize, letterSpacing: '0.01em', color: mark, lineHeight: 1, ...wordmarkSx }}>
          Priyasa Fashion
        </Typography>
      )}
    </Stack>
  );
}
