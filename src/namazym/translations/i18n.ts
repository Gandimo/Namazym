import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import tk from './tk.json';
import tr from './tr.json';
import ru from './ru.json';
import en from './en.json';
import fr from './fr.json';

const resources = {
    tk: { translation: tk },
    tr: { translation: tr },
    ru: { translation: ru },
    en: { translation: en },
    fr: { translation: fr },
};

const LANGUAGE_KEY = 'user_language';

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    if (!savedLanguage) {
        savedLanguage = 'tk';
    }

    await i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: savedLanguage,
            fallbackLng: 'tk',
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false,
            },
        });
};

initI18n();

export default i18n;
