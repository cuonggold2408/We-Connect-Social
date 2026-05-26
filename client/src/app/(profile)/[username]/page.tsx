import ProfilePage from "@/pages/profile/ProfilePage";

export default function ProfileMainPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return <ProfilePage params={params} />;
}
