import { REGEX_PASSWORD, PASSWORD_MIN_LENGTH } from "./register.constants";

export const PASSWORD_RULES = [
  {
    id: "length",
    label: `Có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
    check: (pwd: string) => pwd.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "upper",
    label: "Có chứa chữ in hoa",
    check: (pwd: string) => REGEX_PASSWORD.HAS_UPPER.test(pwd),
  },
  {
    id: "number",
    label: "Có chứa chữ số",
    check: (pwd: string) => REGEX_PASSWORD.HAS_NUMBER.test(pwd),
  },
  {
    id: "special",
    label: "Có ký tự đặc biệt (!@#...)",
    check: (pwd: string) => REGEX_PASSWORD.HAS_SPECIAL.test(pwd),
  },
];

export const checkPasswordRules = (password: string) => {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    isValid: rule.check(password || ""),
  }));
};
