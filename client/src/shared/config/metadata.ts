import { Metadata } from "next";

// Base metadata cho toàn app
export const siteConfig = {
  name: "We Connect",
  title: {
    default: "We Connect - Kết nối mọi người với nhau không giới hạn",
    template: "%s | We Connect",
  },
  description:
    "Mạng xã hội We Connect - Nơi chia sẻ khoảnh khắc và kết nối bạn bè.",
  keywords: ["Social Network", "We Connect", "Next.js", "Realtime Chat"],
  openGraph: {
    title: "We Connect",
    description: "Tham gia mạng xã hội We Connect ngay hôm nay!",
    type: "website",
    siteName: "We Connect",
  },
};

export function createMetadata(options: {
  title: string;
  description?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  return {
    title: options.title,
    description: options.description ?? siteConfig.description,
    robots: options.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: options.title,
      description: options.description ?? siteConfig.description,
      siteName: siteConfig.name,
    },
    keywords: options.keywords ?? siteConfig.keywords,
  };
}
