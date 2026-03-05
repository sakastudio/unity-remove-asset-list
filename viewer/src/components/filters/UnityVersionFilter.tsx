import { useTranslation } from 'react-i18next';

interface Props {
  versions: string[];
  selected: string[];
  onChange: (versions: string[]) => void;
}

export function UnityVersionFilter({ versions, selected, onChange }: Props) {
  const { t } = useTranslation();

  const toggle = (v: string) => {
    if (selected.includes(v)) {
      onChange(selected.filter(s => s !== v));
    } else {
      onChange([...selected, v]);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-700 mb-2">{t('filters.unityVersion')}</h3>
      <div className="space-y-0.5">
        {versions.map(v => (
          <label
            key={v}
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(v)}
              onChange={() => toggle(v)}
              className="rounded text-blue-600"
            />
            {v}
          </label>
        ))}
      </div>
    </div>
  );
}
