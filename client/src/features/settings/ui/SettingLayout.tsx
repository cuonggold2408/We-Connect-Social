"use client";

import { TranslationSection } from "@/features/settings/ui/sections/TranslationSection";

export function SettingLayout() {
  return (
    <div className="mx-auto w-full max-w-3xl py-2">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Cài đặt</h1>
      <TranslationSection />
    </div>
  );
}
