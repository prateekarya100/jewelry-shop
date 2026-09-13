import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Fade from '@mui/material/Fade';

/**
 * Renders an image (or arbitrary media via children) inside a fixed
 * aspect-ratio box so galleries, cards and thumbnails always line up,
 * regardless of the source image's native dimensions. Shows a skeleton
 * until the image has actually loaded.
 */
export default function AspectMedia({
  ratio = '1 / 1',
  src,
  alt = '',
  children,
  sx = {},
  imgSx = {},
  radius = 1,
}) {
  const [loaded, setLoaded] = useState(!src); // no src => rendering children (e.g. video)

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: ratio,
        overflow: 'hidden',
        borderRadius: radius,
        bgcolor: '#f2e2d8',
        ...sx,
      }}
    >
      {!loaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}
      {src ? (
        <Fade in={loaded} timeout={350}>
          <Box
            component="img"
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              ...imgSx,
            }}
          />
        </Fade>
      ) : (
        <Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {children}
        </Box>
      )}
    </Box>
  );
}
