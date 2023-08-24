import { AudioPlayerProvider } from './audio-player'
import { DatabaseProvider } from './db'
import { OPFSProvider } from './opfs'

const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <OPFSProvider>
      <DatabaseProvider>
        <AudioPlayerProvider>{children}</AudioPlayerProvider>
      </DatabaseProvider>
    </OPFSProvider>
  )
}

export default AppStateProvider
