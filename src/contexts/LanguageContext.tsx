import { createContext, useContext, useState, type ReactNode } from "react";

export type Language = "en" | "hi" | "zh" | "ko";

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    practice: "Practice",
    mockTests: "Mock Tests",
    tools: "Tools",
    analytics: "Analytics",
    leaderboard: "Leaderboard",
    speaking: "Speaking",
    writing: "Writing",
    reading: "Reading",
    listening: "Listening",
    vocabBook: "Vocab Book",
    shadowing: "Shadowing",
    studyMaterials: "Study Materials",
    signOut: "Sign Out",
    admin: "Admin",
    welcome: "Welcome back",
    todayGoal: "Today's Goal",
    questionsCompleted: "Questions Completed",
    studyTime: "Study Time",
    currentStreak: "Current Streak",
    overallProgress: "Overall Progress",
    quickPractice: "Quick Practice",
    recentActivity: "Recent Activity",
    noActivity: "No recent activity",
    startPracticing: "Start Practicing",
    score: "Score",
    minutes: "minutes",
    days: "days",
    notifications: "Notifications",
    enableNotifications: "Enable Notifications",
    notificationsEnabled: "Notifications Enabled",
    studyReminder: "Study Reminder",
    timeToStudy: "Time to practice your PTE skills!",
    language: "Language",
    settings: "Settings",
    users: "Users",
    questions: "Questions",
    platformStats: "Platform Stats",
    totalUsers: "Total Users",
    totalQuestions: "Total Questions",
    totalSessions: "Total Sessions",
    manageQuestions: "Manage Questions",
    manageUsers: "Manage Users",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    practice: "अभ्यास",
    mockTests: "मॉक टेस्ट",
    tools: "टूल्स",
    analytics: "विश्लेषण",
    leaderboard: "लीडरबोर्ड",
    speaking: "बोलना",
    writing: "लिखना",
    reading: "पढ़ना",
    listening: "सुनना",
    vocabBook: "शब्दकोश",
    shadowing: "शैडोइंग",
    studyMaterials: "अध्ययन सामग्री",
    signOut: "साइन आउट",
    admin: "एडमिन",
    welcome: "वापसी पर स्वागत",
    todayGoal: "आज का लक्ष्य",
    questionsCompleted: "प्रश्न पूरे हुए",
    studyTime: "अध्ययन समय",
    currentStreak: "वर्तमान स्ट्रीक",
    overallProgress: "समग्र प्रगति",
    quickPractice: "त्वरित अभ्यास",
    recentActivity: "हाल की गतिविधि",
    noActivity: "कोई हाल की गतिविधि नहीं",
    startPracticing: "अभ्यास शुरू करें",
    score: "स्कोर",
    minutes: "मिनट",
    days: "दिन",
    notifications: "सूचनाएं",
    enableNotifications: "सूचनाएं सक्षम करें",
    notificationsEnabled: "सूचनाएं सक्षम हैं",
    studyReminder: "अध्ययन अनुस्मारक",
    timeToStudy: "अपने PTE कौशल का अभ्यास करने का समय!",
    language: "भाषा",
    settings: "सेटिंग्स",
    users: "उपयोगकर्ता",
    questions: "प्रश्न",
    platformStats: "प्लेटफ़ॉर्म आंकड़े",
    totalUsers: "कुल उपयोगकर्ता",
    totalQuestions: "कुल प्रश्न",
    totalSessions: "कुल सत्र",
    manageQuestions: "प्रश्न प्रबंधित करें",
    manageUsers: "उपयोगकर्ता प्रबंधित करें",
  },
  zh: {
    dashboard: "仪表板",
    practice: "练习",
    mockTests: "模拟测试",
    tools: "工具",
    analytics: "分析",
    leaderboard: "排行榜",
    speaking: "口语",
    writing: "写作",
    reading: "阅读",
    listening: "听力",
    vocabBook: "词汇本",
    shadowing: "跟读",
    studyMaterials: "学习材料",
    signOut: "退出",
    admin: "管理员",
    welcome: "欢迎回来",
    todayGoal: "今日目标",
    questionsCompleted: "已完成题目",
    studyTime: "学习时间",
    currentStreak: "当前连续天数",
    overallProgress: "总体进度",
    quickPractice: "快速练习",
    recentActivity: "最近活动",
    noActivity: "暂无最近活动",
    startPracticing: "开始练习",
    score: "分数",
    minutes: "分钟",
    days: "天",
    notifications: "通知",
    enableNotifications: "启用通知",
    notificationsEnabled: "通知已启用",
    studyReminder: "学习提醒",
    timeToStudy: "是时候练习你的PTE技能了！",
    language: "语言",
    settings: "设置",
    users: "用户",
    questions: "题目",
    platformStats: "平台统计",
    totalUsers: "总用户数",
    totalQuestions: "总题目数",
    totalSessions: "总会话数",
    manageQuestions: "管理题目",
    manageUsers: "管理用户",
  },
  ko: {
    dashboard: "대시보드",
    practice: "연습",
    mockTests: "모의고사",
    tools: "도구",
    analytics: "분석",
    leaderboard: "리더보드",
    speaking: "말하기",
    writing: "쓰기",
    reading: "읽기",
    listening: "듣기",
    vocabBook: "단어장",
    shadowing: "셰도잉",
    studyMaterials: "학습 자료",
    signOut: "로그아웃",
    admin: "관리자",
    welcome: "다시 오신 것을 환영합니다",
    todayGoal: "오늘의 목표",
    questionsCompleted: "완료한 문제",
    studyTime: "학습 시간",
    currentStreak: "현재 연속 일수",
    overallProgress: "전체 진행률",
    quickPractice: "빠른 연습",
    recentActivity: "최근 활동",
    noActivity: "최근 활동 없음",
    startPracticing: "연습 시작",
    score: "점수",
    minutes: "분",
    days: "일",
    notifications: "알림",
    enableNotifications: "알림 활성화",
    notificationsEnabled: "알림 활성화됨",
    studyReminder: "학습 알림",
    timeToStudy: "PTE 실력을 연습할 시간입니다!",
    language: "언어",
    settings: "설정",
    users: "사용자",
    questions: "문제",
    platformStats: "플랫폼 통계",
    totalUsers: "총 사용자",
    totalQuestions: "총 문제 수",
    totalSessions: "총 세션",
    manageQuestions: "문제 관리",
    manageUsers: "사용자 관리",
  },
};

const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  zh: "中文",
  ko: "한국어",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languageNames: Record<Language, string>;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        languageNames,
        availableLanguages: ["en", "hi", "zh", "ko"],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
