import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from 'react-router'
import { ToastProvider } from './context/ToastProvider'
import { ToastContainer } from './components/layout/ToastContainer'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './components/home/HomePage'
import { DiscordPage } from './components/discord/DiscordPage'
import { ConnectedServersTab } from './components/discord/tabs/ConnectedServersTab'
import { SlashCommandsTab } from './components/discord/tabs/SlashCommandsTab'
import { BackendHealthTab } from './components/discord/tabs/BackendHealthTab'
import { SettingsPage } from './components/settings/SettingsPage'
import { NotFoundPage } from './components/NotFoundPage'
import { ROUTES } from './routes'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppShell />}>
      <Route index element={<HomePage />} handle={{ title: 'Overview' }} />

      <Route
        path="discordbot"
        element={<DiscordPage />}
        handle={{ title: 'Discord Bot' }}
      >
        <Route
          index
          element={<Navigate to={ROUTES.DISCORD.SERVERS} replace />}
        />
        <Route path="servers" element={<ConnectedServersTab />} />
        <Route path="commands" element={<SlashCommandsTab />} />
        <Route path="health" element={<BackendHealthTab />} />
      </Route>

      <Route
        path="settings"
        element={<SettingsPage />}
        handle={{ title: 'Settings' }}
      />

      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
)

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
      <ToastContainer />
    </ToastProvider>
  )
}
