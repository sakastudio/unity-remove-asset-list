import { useState } from 'react';

interface Props {
  src: string | null;
  alt: string;
  className?: string;
}

export function Thumbnail({ src, alt, className = '' }: Props) {
  const [error, setError] = useState(false);
  const base = import.meta.env.BASE_URL;
  const imgSrc = !src || error ? `${base}placeholder.svg` : `${base}${src}`;

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={`w-full aspect-[4/3] object-cover bg-gray-200 ${className}`}
    />
  );
}
