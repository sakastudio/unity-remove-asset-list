import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AssetDetail as AssetDetailType } from '../../types';
import { AssetDetail } from './AssetDetail';

interface Props {
  asset: AssetDetailType;
  onClose: () => void;
  onCategoryClick: (cat: string) => void;
  onKeywordClick: (keyword: string) => void;
}

export function AssetModal({ asset, onClose, onCategoryClick, onKeywordClick }: Props) {
  // ESC to close + body scroll lock
  useEffect(() => {
    document.body.classList.add('modal-open');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl mx-4 my-8 max-w-3xl w-full z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          <AssetDetail
            asset={asset}
            onCategoryClick={onCategoryClick}
            onKeywordClick={onKeywordClick}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
