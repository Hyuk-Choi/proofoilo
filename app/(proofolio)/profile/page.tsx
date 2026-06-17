import type { Metadata } from "next";

import { ProfileSettingsView } from "@/components/profile/profile-settings-view";

export const metadata: Metadata = {
  title: "My Profile",
};

export default function ProfilePage() {
  return <ProfileSettingsView />;
}
