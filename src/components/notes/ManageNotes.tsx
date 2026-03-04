import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { classNames } from "../../utils/core";
import { Dialog } from "@headlessui/react";
import {
  XMarkIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { XCircleIcon, UserIcon } from "@heroicons/react/20/solid";
import { Note, NoteAttachment } from "../../types/entities";
import { useRef, useState } from "react";
import { useImmer } from "use-immer";
import dayjs from "dayjs";
import { useAuth } from "../../contexts/auth/useAuth";
import { filePreload } from "../../queries/media";
import { UploadedFile } from "../forms/inputs/file-upload-input/UploadedFileTile";
import { AddNotePayload } from "../../queries/safety-management";

type PendingFile = UploadedFile & { _id: string };
let nextPendingFileId = 0;

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "heic":
    case "heif":
    case "webp":
      return PhotoIcon;
    case "mp4":
    case "mov":
    case "mkv":
    case "webm":
    case "avi":
      return FilmIcon;
    case "mp3":
    case "wav":
    case "ogg":
    case "aac":
      return MusicalNoteIcon;
    default:
      return DocumentIcon;
  }
};

const FileChip: React.FC<{
  name: string;
  url?: string;
  status: UploadedFile["uploadStatus"];
  onRemove?: () => void;
}> = ({ name, url, status, onRemove }) => {
  const Icon = getFileIcon(name);
  return (
    <div
      className={classNames(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
        status === "uploading"
          ? "border-gray-200 bg-gray-50 text-gray-400 animate-pulse"
          : status === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-gray-200 bg-gray-50 text-gray-700"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate min-w-0 max-w-[12rem]">{name}</span>
      {url && status === "uploaded" && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-gray-400 hover:text-gray-600"
          title="Download"
        >
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
        </a>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-gray-400 hover:text-gray-600"
        >
          <XCircleIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

const AttachmentChip: React.FC<{ attachment: NoteAttachment }> = ({
  attachment,
}) => (
  <FileChip
    name={attachment.filename ?? attachment.key}
    url={attachment.url}
    status="uploaded"
  />
);

interface ManageNotesProps {
  setOpen: (open: boolean) => void;
  notes: Note[] | undefined;
  addNote: (note: AddNotePayload) => Promise<unknown>;
  queryKey: QueryKey;
  mediaUploadUrl?: string;
}

const ManageNotes: React.FC<ManageNotesProps> = ({
  setOpen,
  notes,
  addNote,
  queryKey,
  mediaUploadUrl,
}) => {
  const [newNote, setNewNote] = useState("");
  const [pendingFiles, setPendingFiles] = useImmer<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const addNoteMutation = useMutation({
    mutationFn: (note: AddNotePayload) => addNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewNote("");
      setPendingFiles([]);
    },
  });

  const { keycloak } = useAuth();

  const isUploading = pendingFiles.some(
    (f) => f.uploadStatus === "uploading"
  );
  const hasContent =
    newNote.trim().length > 0 ||
    pendingFiles.some((f) => f.uploadStatus === "uploaded");
  const canSubmit = hasContent && !isUploading && !addNoteMutation.isPending;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !mediaUploadUrl) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `pending-${++nextPendingFileId}`;
      const upload: PendingFile = {
        _id: id,
        local: file,
        uploadStatus: "uploading",
      };

      setPendingFiles((draft) => {
        draft.push(upload);
      });

      filePreload(mediaUploadUrl, [file])
        .then((res) => {
          const { key, url } = res[0];
          setPendingFiles((draft) => {
            const match = draft.find((u) => u._id === id);
            if (match) {
              match.key = key;
              match.url = url;
              match.uploadStatus = "uploaded";
            }
          });
        })
        .catch(() => {
          setPendingFiles((draft) => {
            const match = draft.find((u) => u._id === id);
            if (match) {
              match.uploadStatus = "error";
            }
          });
        });
    }

    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const deletePendingFile = (file: PendingFile) => {
    setPendingFiles((draft) => draft.filter((u) => u._id !== file._id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const attachments = pendingFiles
      .filter((f) => f.uploadStatus === "uploaded" && f.key)
      .map((f) => ({
        key: f.key!,
        filename: f.local?.name ?? f.key!,
      }));

    const payload: AddNotePayload = {};
    if (newNote.trim()) payload.value = newNote;
    if (attachments.length) payload.attachments = attachments;

    addNoteMutation.mutate(payload);
  };

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
        className="relative mt-3 h-6 w-6 flex-none rounded-full bg-gray-50 shrink-0"
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
                      <span className="relative bg-gray-400 mt-3 h-6 w-6 rounded-full flex items-center justify-center ring-8 ring-white shrink-0">
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
                      {note.value && (
                        <p className="text-sm leading-6 text-gray-500">
                          {note.value}
                        </p>
                      )}
                      {!!note.attachments?.length && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {note.attachments.map((attachment) => (
                            <AttachmentChip
                              key={attachment.key}
                              attachment={attachment}
                            />
                          ))}
                        </div>
                      )}
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
                onSubmit={handleSubmit}
              >
                <div className="overflow-hidden rounded-lg shadow-xs ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-secondary-600">
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

                  {/* Pending file uploads */}
                  {pendingFiles.length > 0 && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                      {pendingFiles.map((file) => (
                        <FileChip
                          key={file._id}
                          name={file.local?.name ?? file.key ?? "file"}
                          url={file.url}
                          status={file.uploadStatus}
                          onRemove={() => deletePendingFile(file)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-2 flex justify-between items-center">
                  <div className="flex items-center space-x-5">
                    {mediaUploadUrl && (
                      <>
                        <button
                          type="button"
                          className="rounded-full p-1 text-gray-400 hover:text-gray-500"
                          onClick={() => fileInputRef.current?.click()}
                          title="Attach files"
                        >
                          <PaperClipIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Attach files</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileSelect}
                        />
                      </>
                    )}
                  </div>
                  <div className="shrink-0">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={classNames(
                        "rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300",
                        canSubmit
                          ? "hover:bg-gray-50"
                          : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isUploading ? "Uploading..." : "Add Note"}
                    </button>
                  </div>
                </div>
              </form>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex space-x-3">
            <div className="grow"></div>
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
