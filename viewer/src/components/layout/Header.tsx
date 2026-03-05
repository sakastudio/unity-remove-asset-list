import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  totalCount: number;
  allCount: number;
  onToggleFilters: () => void;
}

export function Header({ query, onQueryChange, totalCount, allCount, onToggleFilters }: Props) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Mobile filter button */}
        <button
          onClick={onToggleFilters}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          aria-label="Toggle filters"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>

        {/* Title */}
        <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap hidden sm:block">
          {t('header.title')}
        </h1>
        <h1 className="text-base font-bold text-gray-900 whitespace-nowrap sm:hidden">
          {t('header.titleShort')}
        </h1>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder={t('header.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-400 transition-colors"
            />
            {query && (
              <button
                onClick={() => onQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Count */}
        <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
          {t('header.assetsCount', { total: totalCount.toLocaleString(), all: allCount.toLocaleString() })}
        </span>

        {/* Language */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
