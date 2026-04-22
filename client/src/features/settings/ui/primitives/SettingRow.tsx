interface Props {
  title: string;
  description?: string;
  control: React.ReactNode;
  icon?: React.ReactNode;
}

export function SettingRow({ title, description, control, icon }: Props) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3.5">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
