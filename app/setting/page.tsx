"use client";

import { Input } from "../libs/components/Input";
import { Button } from "../libs/components/Button";
import { useContext, useState } from "react";
import { OPFSContext } from "../libs/opfs";

const AddModal = ({ show, close }: { show: boolean; close: () => void }) => {
  const { addProvider } = useContext(OPFSContext);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([]);

  return (
    <form
      tabIndex={-1}
      className={
        "flex justify-center items-center bg-slate-900 bg-opacity-50 fixed top-0 left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto md:inset-0 h-full" +
        (show ? "" : " hidden")
      }
      onSubmit={() => {
        if (addProvider) {
          addProvider({
            name,
            url,
            headers,
          });
        }
        close();
        setName("");
        setUrl("");
        setHeaders([]);
      }}
    >
      <div className="relative w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              New Provider
            </h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={() => {
                close();
                setName("");
                setUrl("");
                setHeaders([]);
              }}
            >
              <svg
                className="w-3 h-3"
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
          <div className="p-6 space-y-6">
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
                      const clone = JSON.parse(JSON.stringify(headers));
                      clone[index].name = e.target.value;
                      setHeaders(clone);
                    }}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Header value"
                    value={value}
                    onChange={(e) => {
                      const clone = JSON.parse(JSON.stringify(headers));
                      clone[index].value = e.target.value;
                      setHeaders(clone);
                    }}
                  />
                  <div className="flex justify-center col-span-1">
                    <button
                      className="w-12 h-12 text-red-500 hover:text-red-700 rounded-full flex justify-center items-center"
                      onClick={() =>
                        setHeaders((current) => {
                          return current.filter((_, i) => i !== index);
                        })
                      }
                    >
                      <svg
                        className="w-4 h-4"
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
                className="flex justify-center items-center"
                type="button"
                onClick={() =>
                  setHeaders((current) => {
                    return [...current, { name: "", value: "" }];
                  })
                }
              >
                <>
                  <svg
                    className="w-3 h-3 text-gray-800 dark:text-white"
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
          <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
            <Button className="w-full" type="submit">
              Add
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default function SettingPage() {
  const { providers, removeProvider } = useContext(OPFSContext);
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div className="flex flex-row-reverse mt-5">
        <Button
          onClick={() => {
            setShowModal(true);
          }}
        >
          New Provider
        </Button>
      </div>
      <AddModal
        show={showModal}
        close={() => {
          setShowModal(false);
        }}
      />

      <div>
        <h2 className="text-2xl font-bold">Providers</h2>
        <div className="mt-4">
          {providers?.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              {provider.name}
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  if (removeProvider) removeProvider(provider);
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>{" "}
      </div>
    </>
  );
}
