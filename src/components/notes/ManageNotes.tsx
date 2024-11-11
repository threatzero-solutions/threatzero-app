import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { classNames } from "../../utils/core";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Note } from "../../types/entities";
import { useState } from "react";
import dayjs from "dayjs";
import { UserIcon } from "@heroicons/react/20/solid";
import { useAuth } from "../../contexts/auth/useAuth";

interface ManageNotesProps {
  setOpen: (open: boolean) => void;
  notes: Note[] | undefined;
  addNote: (note: Partial<Note>) => Promise<unknown>;
  queryKey: QueryKey;
}

const ManageNotes: React.FC<ManageNotesProps> = ({
  setOpen,
  notes,
  addNote,
  queryKey,
}) => {
  const [newNote, setNewNote] = useState("");

  const queryClient = useQueryClient();
  const addNoteMutation = useMutation({
    mutationFn: (note: Partial<Note>) => addNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewNote("");
    },
  });

  const { keycloak } = useAuth();

  const profileImg = (u: {
    picture?: string | null;
    name?: string | null;
    email?: string | null;
  }) => {
    const name = u.name ?? u.email ?? "Unknown user";
    return (
      <img
        src={u.picture ?? ""}
        alt={name}
        title={name}
        className="relative mt-3 h-6 w-6 flex-none rounded-full bg-gray-50"
        onError={(e) => (e.currentTarget.src = "/img/default-user.svg")}
      />
    );
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          {/* HEADER */}
          <div className="bg-gray-50 px-4 py-6 sm:px-6">
            <div className="flex items-start justify-between space-x-3">
              <div className="space-y-1">
                <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                  Notes
                </Dialog.Title>
                <p className="text-sm text-gray-500">View or add notes here</p>
              </div>
              <div className="flex h-7 items-center">
                <button
                  type="button"
                  className="relative text-gray-400 hover:text-gray-500"
                  onClick={() => setOpen(false)}
                >
                  <span className="absolute -inset-2.5" />
                  <span className="sr-only">Close panel</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <ul className="grid grid-cols-1 mt-6 gap-6 px-4 sm:px-6">
            {notes &&
              [...notes].reverse().map((note, idx) => (
                <li key={note.id} className="relative flex gap-x-4">
                  <div
                    className={classNames(
                      idx === notes.length - 1 ? "h-6" : "-bottom-6",
                      idx === 0 ? "top-3" : "top-0",
                      "absolute left-0 flex w-6 justify-center"
                    )}
                  >
                    <div className="w-px bg-gray-200" />
                  </div>
                  <>
                    {note.user?.picture ? (
                      profileImg(note.user)
                    ) : (
                      <span className="relative bg-gray-400 mt-3 h-6 w-6 rounded-full flex items-center justify-center ring-8 ring-white">
                        <UserIcon
                          className="h-4 w-4 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    )}
                    <div className="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200">
                      <div className="flex justify-between gap-x-4">
                        <div className="py-0.5 text-xs leading-5 text-gray-500">
                          {/* TODO: Tie user ID to person name */}
                          <span className="font-medium text-gray-900">
                            {note.user?.externalId ===
                            keycloak?.tokenParsed?.sub
                              ? "Me"
                              : note.user?.name ?? "Unknown"}
                          </span>
                        </div>
                        <time
                          dateTime={note.createdOn}
                          className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                        >
                          {dayjs(note.createdOn).fromNow()}
                        </time>
                      </div>
                      <p className="text-sm leading-6 text-gray-500">
                        {note.value}
                      </p>
                    </div>
                  </>
                </li>
              ))}

            {/* New note form */}
            <li className="mt-6 flex gap-x-3">
              {keycloak?.tokenParsed?.picture ? (
                profileImg(
                  keycloak.tokenParsed as {
                    picture?: string | null;
                  }
                )
              ) : (
                <span className="relative bg-gray-400 h-6 w-6 rounded-full flex items-center justify-center ring-8 ring-white">
                  <UserIcon className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
              )}
              <form
                action="#"
                className="relative flex-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  addNoteMutation.mutate({ value: newNote });
                }}
              >
                <div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-secondary-600">
                  <label htmlFor="comment" className="sr-only">
                    Add your note
                  </label>
                  <textarea
                    rows={3}
                    name="note"
                    id="note"
                    className="block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Add your note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
                  <div className="flex items-center space-x-5">
                    {/* Add extra buttons here */}
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      type="submit"
                      className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              </form>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex space-x-3">
            <div className="grow"></div>
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageNotes;
