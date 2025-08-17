import React, { useState } from 'react';
import { Image, ImageProps } from 'react-native';
import PlaceholderImage from './PlaceholderImage';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | null;
  placeholderSize?: number;
}

export default function SafeImage({ source, placeholderSize, style, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  // If there's an error or no source, show placeholder
  if (hasError || !source || !source.uri) {
    return <PlaceholderImage size={placeholderSize} style={style} />;
  }

  return (
    <Image
      source={source}
      style={style}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
