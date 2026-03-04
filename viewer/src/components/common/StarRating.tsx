interface Props {
  rating: number | null;
  reviewCount?: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, reviewCount, size = 'sm' }: Props) {
  if (rating === null) return null;

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const starSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className={`flex items-center gap-1 ${textSize}`}>
      <div className={`flex ${starSize}`}>
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
}
