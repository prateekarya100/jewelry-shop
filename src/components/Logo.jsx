import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * The site's logo — a faceted-gem monogram (fitting a jewellery brand)
 * paired with the wordmark. `variant="light"` (default) is for use on dark
 * backgrounds (header, footer, admin sidebar); `variant="dark"` inverts it
 * for light backgrounds.
 */
export default function Logo({ variant = 'light', size = 34, showWordmark = true, wordmarkSize = 21 }) {
  const mark = variant === 'light' ? '#faf1ec' : '#1c1420';
  const accent = '#b8703f';

  return (
    <Stack direction="row" alignItems="center" spacing={1.2}>
      <Box
        component="svg"
        viewBox="0 0 40 40"
        sx={{ width: size, height: size, flexShrink: 0 }}
        aria-hidden="true"
      >
        <path
          d="M20 3 L33 13 L28 33 L12 33 L7 13 Z"
          fill="none"
          stroke={accent}
          strokeWidth="1.4"
        />
        <path
          d="M20 3 L20 33 M7 13 L33 13 M20 3 L12 33 M20 3 L28 33"
          fill="none"
          stroke={accent}
          strokeWidth="0.7"
          opacity="0.55"
        />
        <text
          x="20" y="21"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Playfair Display', serif"
          fontWeight="700"
          fontSize="15"
          fill={mark}
        >
          P
        </text>
      </Box>
      {showWordmark && (
        <Typography sx={{ fontFamily: "'Playfair Display', serif", fontSize: wordmarkSize, color: mark, lineHeight: 1 }}>
          Priyasa Fashion
        </Typography>
      )}
    </Stack>
  );
}
