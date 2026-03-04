interface Props {
  minRating: number | null;
  onChange: (rating: number | null) => void;
}

export function RatingFilter({ minRating, onChange }: Props) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-700 mb-2">Minimum Rating</h3>
      <div className="space-y-0.5">
        {[5, 4, 3, 2, 1].map(r => (
          <button
            key={r}
            onClick={() => onChange(minRating === r ? null : r)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
              minRating === r ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={i <= r ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </span>
            <span className="text-xs text-gray-400">& up</span>
          </button>
        ))}
      </div>
    </div>
  );
}
