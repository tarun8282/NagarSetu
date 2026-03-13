import React, { useState, useEffect, useRef } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';

const ALL_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
];

const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if a language is currently active in the translation cookie
    const checkCurrentLang = () => {
      const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
      if (match && match[1]) {
        setSelectedLang(match[1]);
      }
    };
    checkCurrentLang();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    setIsOpen(false);
    
    if (langCode === 'en') {
      // If switching back to English, clear the cookie entirely
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      if (window.location.hostname !== 'localhost') {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      }
      // Force reload to cleanly reset the DOM from Google's mutations
      window.location.reload();
      return;
    }

    // Set cookie so UI persists correctly on reload
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    if (window.location.hostname !== 'localhost') {
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${window.location.hostname};`;
    }

    // Trigger Google Translate hidden select
    try {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = langCode;
        selectElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      } else {
        console.warn("Google Translate widget not ready yet. Reloading to apply.");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  const activeLang = ALL_LANGUAGES.find(l => l.code === selectedLang) || ALL_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-saffron/30"
      >
        <Languages size={18} className="text-india-green" />
        <span className="font-semibold text-sm tracking-wide">{activeLang.code.toUpperCase()}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 ring-1 ring-black ring-opacity-5 z-50 py-1.5 max-h-80 overflow-y-auto custom-translate-scrollbar">
          {ALL_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${
                selectedLang === lang.code 
                  ? 'bg-orange-50 text-saffron dark:bg-slate-700/60 dark:text-saffron-400 font-semibold' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="font-deva tracking-wide">{lang.label}</span>
              {selectedLang === lang.code && <Check size={16} className="text-saffron" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
