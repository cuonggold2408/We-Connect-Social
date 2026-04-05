import ProfilePage from "@/features/profile/ui/ProfilePage";

export default function ProfileMainPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return <ProfilePage params={params} />;
}
