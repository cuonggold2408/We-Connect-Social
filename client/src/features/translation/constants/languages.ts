export interface LangOption {
  code: string;
  label: string;
  labelVi: string;
  flag: string;
}

export const LANGUAGES: LangOption[] = [
  { code: "vi", label: "Tiếng Việt", labelVi: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", labelVi: "Tiếng Anh", flag: "🇬🇧" },
  { code: "ja", label: "日本語", labelVi: "Tiếng Nhật", flag: "🇯🇵" },
  { code: "zh", label: "中文", labelVi: "Tiếng Trung", flag: "🇨🇳" },
];

export const AUTO_LANGUAGE: LangOption = {
  code: "auto",
  label: "Phát hiện ngôn ngữ",
  labelVi: "Phát hiện ngôn ngữ",
  flag: "🌐",
};
