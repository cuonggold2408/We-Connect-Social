interface Props {
  title: string;
  children: React.ReactNode;
}

export function SettingSection({ title, children }: Props) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 ml-1 text-xs font-medium tracking-wide text-gray-500">
        {title}
      </h2>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {children}
      </div>
    </section>
  );
}
