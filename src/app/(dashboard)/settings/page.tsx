import { ProtectedRoute } from "@/components/auth/protected-route"
import { SettingsPage } from "@/components/settings/settings-page"

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  )
}
