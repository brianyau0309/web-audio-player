import { DatabaseProvider } from '$/database'
import { OPFSProvider } from '$/opfs'
import { AudioPlayerProvider } from './audio-player'

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
