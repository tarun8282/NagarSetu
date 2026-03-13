import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../lib/translations';

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return { t, language };
};
