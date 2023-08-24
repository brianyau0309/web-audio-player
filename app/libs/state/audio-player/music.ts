export type Music = {
  musicId: string
  path: string
  filename: string
  ext: string
  title: string
  artist?: string
  album?: string
  covers?: {
    type: string
    format: string
    data: string
  }[]
  container: string
  codec: string
  lossless?: boolean
  numberOfChannels?: number
  bitsPerSample?: number
  sampleRate?: number
  duration?: number
  bitrate?: number
  url: string
  thumbnail?: string
}
