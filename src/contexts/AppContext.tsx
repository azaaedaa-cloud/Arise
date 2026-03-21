import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'ar';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.catalog': 'Catalog',
    'nav.wishlist': 'Wishlist',
    'nav.cart': 'Cart',
    'nav.profile': 'Profile',
    'nav.signin': 'Sign In',
    'nav.signout': 'Sign Out',
    'hero.title1': 'THE ASCENT',
    'hero.title2': 'FROM FAILURE',
    'hero.title3': 'TO',
    'hero.title4': 'SOVEREIGNTY',
    'hero.subtitle': 'Knowledge is the ultimate weapon. Rise from the ashes of mediocrity and claim your place among the elite. Your empire begins here.',
    'hero.cta1': 'Claim Your Power',
    'hero.cta2': 'The Foundation',
    'footer.rights': 'All rights reserved.',
    'footer.explore': 'Explore',
    'footer.support': 'Support',
    'footer.description': "The world's most exclusive digital and physical bookstore. Curated for the elite, powered by performance.",
    'footer.digital': 'Digital Books',
    'footer.limited': 'Limited Editions',
    'footer.contact': 'Contact Us',
    'footer.shipping': 'Shipping Policy',
    'footer.terms': 'Terms of Service',
    'common.investment': 'Investment',
    'common.availability': 'Availability',
    'common.instock': 'In Stock',
    'common.waitlist': 'Exclusive Waitlist',
    'common.details': 'View Full Details',
    'common.addvault': 'Add to Vault',
    'common.quickview': 'Quick View',
    'common.elite': 'ELITE',
    'common.selections': 'SELECTIONS',
    'common.growth': 'Growth',
    'common.wealth': 'Wealth',
    'common.power': 'Power',
    'common.by': 'by',
    'common.rating': 'Masterpiece Rating',
    'common.viewall': 'View Full Catalog',
    'home.phase1.title': 'BUILD THE FOUNDATION',
    'home.phase1.desc': 'Every empire starts with a single thought. Our "Growth" collection provides the essential wisdom needed to break the cycle and start the climb.',
    'home.phase1.feature1.title': 'Mental Clarity',
    'home.phase1.feature1.desc': 'Sharpen your mind for the battles ahead.',
    'home.phase1.feature2.title': 'Resilience',
    'home.phase1.feature2.desc': 'Develop the skin of a sovereign individual.',
    'home.phase2.title': 'ACCUMULATE ABUNDANCE',
    'home.phase2.feature1.title': 'Financial Mastery',
    'home.phase2.feature1.desc': 'The rules of money have changed. Learn the new game.',
    'home.phase2.feature2.title': 'Strategic Leverage',
    'home.phase2.feature2.desc': 'Work smarter, not harder. Use the tools of the elite.',
    'home.phase2.feature3.title': 'Network Power',
    'home.phase2.feature3.desc': 'Your network is your net worth. Connect with the best.',
    'home.phase3.title': 'ULTIMATE',
    'home.phase3.desc': 'The final stage of the journey. Sovereignty, legacy, and total control over your destiny.',
    'home.phase3.cta': 'Enter the Inner Circle',
    'home.featured.desc': 'Masterpieces curated for your current stage of growth.',
  },
  ar: {
    'nav.catalog': 'الكتالوج',
    'nav.wishlist': 'قائمة الأمنيات',
    'nav.cart': 'السلة',
    'nav.profile': 'الملف الشخصي',
    'nav.signin': 'تسجيل الدخول',
    'nav.signout': 'تسجيل الخروج',
    'hero.title1': 'الصعود',
    'hero.title2': 'من الفشل',
    'hero.title3': 'إلى',
    'hero.title4': 'السيادة',
    'hero.subtitle': 'المعرفة هي السلاح الأسمى. انهض من رماد المتوسطين وطالب بمكانك بين النخبة. إمبراطوريتك تبدأ من هنا.',
    'hero.cta1': 'طالب بقوتك',
    'hero.cta2': 'الأساس',
    'footer.rights': 'جميع الحقوق محفوظة.',
    'footer.explore': 'استكشف',
    'footer.support': 'الدعم',
    'footer.description': 'أكثر مكتبة رقمية وورقية حصرية في العالم. منسقة للنخبة، مدعومة بالأداء.',
    'footer.digital': 'الكتب الرقمية',
    'footer.limited': 'إصدارات محدودة',
    'footer.contact': 'اتصل بنا',
    'footer.shipping': 'سياسة الشحن',
    'footer.terms': 'شروط الخدمة',
    'common.investment': 'الاستثمار',
    'common.availability': 'التوفر',
    'common.instock': 'متوفر',
    'common.waitlist': 'قائمة انتظار حصرية',
    'common.details': 'عرض كامل التفاصيل',
    'common.addvault': 'أضف إلى الخزنة',
    'common.quickview': 'نظرة سريعة',
    'common.elite': 'نخبة',
    'common.selections': 'المختارات',
    'common.growth': 'نمو',
    'common.wealth': 'ثروة',
    'common.power': 'قوة',
    'common.by': 'بواسطة',
    'common.rating': 'تقييم التحفة',
    'common.viewall': 'عرض الكتالوج الكامل',
    'home.phase1.title': 'ابنِ الأساس',
    'home.phase1.desc': 'كل إمبراطورية تبدأ بفكرة واحدة. توفر مجموعة "النمو" لدينا الحكمة الأساسية اللازمة لكسر الدورة وبدء الصعود.',
    'home.phase1.feature1.title': 'الوضوح الذهني',
    'home.phase1.feature1.desc': 'اشحذ عقلك للمعارك القادمة.',
    'home.phase1.feature2.title': 'المرونة',
    'home.phase1.feature2.desc': 'طور جلد الفرد السيادي.',
    'home.phase2.title': 'تراكم الوفرة',
    'home.phase2.feature1.title': 'الإتقان المالي',
    'home.phase2.feature1.desc': 'لقد تغيرت قواعد المال. تعلم اللعبة الجديدة.',
    'home.phase2.feature2.title': 'الرافعة الاستراتيجية',
    'home.phase2.feature2.desc': 'اعمل بذكاء أكبر، وليس بجهد أكبر. استخدم أدوات النخبة.',
    'home.phase2.feature3.title': 'قوة الشبكة',
    'home.phase2.feature3.desc': 'شبكتك هي صافي ثروتك. تواصل مع الأفضل.',
    'home.phase3.title': 'الأسمى',
    'home.phase3.desc': 'المرحلة الأخيرة من الرحلة. السيادة والإرث والسيطرة الكاملة على مصيرك.',
    'home.phase3.cta': 'ادخل الدائرة الداخلية',
    'home.featured.desc': 'تحف فنية منسقة لمرحلة نموك الحالية.',
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });
  
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
