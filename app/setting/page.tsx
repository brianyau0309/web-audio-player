'use client'

import { Input } from '../libs/components/Input'
import { Button } from '../libs/components/Button'
import { useContext, useEffect, useState } from 'react'
import Trash from '@/libs/components/icons/Trash'
import { AudioProviderType, DB } from '@/libs/state/db'
import { AudioProviderContext } from '@/libs/state/db/audio-provider'

const AddModal = ({
  show,
  onSubmit,
  close,
}: {
  show: boolean
  onSubmit: (
    name: string,
    url: string,
    headers: string,
    providerType: AudioProviderType,
  ) => Promise<void>
  close: () => void
}) => {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([])

  return (
    <form
      tabIndex={-1}
      className={
        'fixed left-0 right-0 top-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900 bg-opacity-50 md:inset-0' +
        (show ? '' : ' hidden')
      }
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(name, url, JSON.stringify(headers), 'selfhost').then(() => {
          close()
          setName('')
          setUrl('')
          setHeaders([])
        })
      }}
    >
      <div className="relative max-h-full w-full max-w-2xl">
        <div className="relative rounded-lg bg-white shadow dark:bg-gray-700">
          <div className="flex items-start justify-between rounded-t border-b p-4 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              New Provider
            </h3>
            <button
              type="button"
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={() => {
                close()
                setName('')
                setUrl('')
                setHeaders([])
              }}
            >
              <svg
                className="h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <div className="space-y-6 p-6">
            <div>
              <Input
                placeholder="Provider Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                placeholder="Provider URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              {headers.map(({ name: header, value }, index) => (
                <div key={index} className="grid grid-cols-5 md:gap-6">
                  <Input
                    className="col-span-2"
                    placeholder="Header name"
                    value={header}
                    onChange={(e) => {
                      const clone = JSON.parse(JSON.stringify(headers))
                      clone[index].name = e.target.value
                      setHeaders(clone)
                    }}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Header value"
                    value={value}
                    onChange={(e) => {
                      const clone = JSON.parse(JSON.stringify(headers))
                      clone[index].value = e.target.value
                      setHeaders(clone)
                    }}
                  />
                  <div className="col-span-1 flex justify-center">
                    <button
                      className="flex h-12 w-12 items-center justify-center rounded-full text-red-500 hover:text-red-700"
                      onClick={() =>
                        setHeaders((current) => {
                          return current.filter((_, i) => i !== index)
                        })
                      }
                    >
                      <svg
                        className="h-4 w-4"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 18 2"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M1 1h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <Button
                className="flex items-center justify-center"
                type="button"
                onClick={() =>
                  setHeaders((current) => {
                    return [...current, { name: '', value: '' }]
                  })
                }
              >
                <>
                  <svg
                    className="h-3 w-3 text-gray-800 dark:text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 1v16M1 9h16"
                    />
                  </svg>
                  &nbsp;&nbsp;&nbsp;Add Header
                </>
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 rounded-b border-t border-gray-200 p-6 dark:border-gray-600">
            <Button className="w-full" type="submit">
              Add
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default function SettingPage() {
  const [showModal, setShowModal] = useState(false)
  const [audioProviders, setAudioProviders] = useState<
    Pick<DB['audio_provider'], 'id' | 'name'>[]
  >([])
  const { removeAudioProvider, fetchAudioProviders, addAudioProvider } =
    useContext(AudioProviderContext)

  useEffect(() => {
    fetchAudioProviders(100)
      .then((result) => {
        setAudioProviders(result)
      })
      .catch((e) => {
        if (typeof e === 'object' && e != null && 'message' in e)
          console.warn(e?.message)
        else console.error(e)
      })
  }, [fetchAudioProviders])

  const onAdd = async (
    name: string,
    url: string,
    headers: string,
    providerType: AudioProviderType,
  ) => {
    if (fetchAudioProviders && addAudioProvider) {
      await addAudioProvider({
        name,
        url,
        headers,
        provider_type: providerType,
      })
      const updated = await fetchAudioProviders(100)
      setAudioProviders(updated)
    }
  }

  const onRemove = async (id: string) => {
    if (removeAudioProvider && fetchAudioProviders) {
      await removeAudioProvider(id)
      const updated = await fetchAudioProviders(100)
      setAudioProviders(updated)
    }
  }

  return (
    <>
      <div className="mt-5 flex flex-row-reverse">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          New Provider
        </Button>
      </div>
      <AddModal
        show={showModal}
        onSubmit={onAdd}
        close={() => setShowModal(false)}
      />

      <div>
        <h2 className="text-2xl font-bold">Providers</h2>

        <div className="mt-4">
          {audioProviders.map((ap) => (
            <div
              key={ap.id}
              className="mb-2 flex items-center justify-between rounded-lg border p-4"
            >
              {ap.name}
              <Button
                className="h-8 w-8 p-2 text-red-500 hover:text-red-700"
                onClick={() => onRemove(ap.id)}
              >
                <Trash />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
