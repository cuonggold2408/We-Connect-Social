import { Check, X } from "lucide-react";
import { checkPasswordRules } from "../model/password.util";

interface Props {
  password: string;
}

export const PasswordChecklist = ({ password }: Props) => {
  const rulesStatus = checkPasswordRules(password);

  return (
    <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-500">
        Yêu cầu mật khẩu:
      </p>
      <ul className="space-y-1">
        {rulesStatus.map((rule) => (
          <li key={rule.id} className="flex items-center space-x-2 text-sm">
            {rule.isValid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-gray-400" />
            )}

            <span
              className={`transition-colors duration-300 ${
                rule.isValid ? "font-medium text-green-600" : "text-gray-500"
              }`}
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
