import Header from "@/shared/components/layout/Header";
import LeftSidebar from "@/shared/components/layout/LeftSidebar";
import RightSidebar from "@/shared/components/layout/RightSidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto flex max-w-360">
        <LeftSidebar />
        <main className="min-w-0 flex-1 px-4 py-4">{children}</main>
        <RightSidebar />
      </div>
    </div>
  );
}
