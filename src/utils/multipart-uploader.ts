import axios, { AxiosInstance } from "axios";
import { pathJoin } from "./core";
import { API_BASE_URL } from "../contexts/core/constants";

interface Part {
	PartNumber: number;
	ETag?: string;
	signedUrl?: string;
}

export interface MultipartUploadProgress {
	sent: number;
	total: number;
	percentage: number;
}

export interface FinalizeResponse {
	cloudfrontUrl?: string;
	key?: string;
}

export interface OnCompleteEvent {
	fileId: string | null;
	fileKey: string | null;
	completionData: FinalizeResponse;
}

export interface MultipartUploaderOptions {
	/** File to upload. */
	file: File;

	/** File name. */
	fileName: string;

	/** Axios instance. */
	client?: AxiosInstance;

	/** Part size in bytes. */
	chunkSize?: number;

	/** Number of concurrent uploads. */
	concurrentUploads?: number;

	/** Base path of all requests. */
	basePath?: string;
}

export const MINIMUM_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
export const MAXIMUM_CHUNK_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
export const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

export const MAXIMUM_CONCURRENT_UPLOADS = 15;

// original source: https://github.com/pilovm/multithreaded-uploader/blob/master/frontend/uploader.js
export class MultipartUploader {
	public get aborted() {
		return this.isAborted;
	}

	private client: AxiosInstance;
	private basePath: string;
	private chunkSize: number;
	private concurrentUploads: number;
	private file: File;
	private fileName: string;
	private initialized = false;
	private uploadedSize = 0;
	private progressCache: Record<number, number> = {};
	private activeConnections: Record<string, XMLHttpRequest> = {};
	private parts: Part[] = [];
	private uploadedParts: Part[] = [];
	private fileId: string | null = null;
	private fileKey: string | null = null;
	private isAborted = false;
	private onProgressFn: (progress?: MultipartUploadProgress) => void = () => {};
	private onErrorFn: (e?: unknown) => void = () => {};
	private onAbortFn: () => void = () => {};
	private onCompleteFn: (e: OnCompleteEvent) => void = () => {};

	constructor(options: MultipartUploaderOptions) {
		if (options.chunkSize && options.chunkSize < MINIMUM_CHUNK_SIZE) {
			// AWS enforces a minimum part size of 5MB.
			throw Error('"chunkSize" must be greater than or equal to 5MB');
		}

		this.client = options.client || axios;
		this.basePath = options.basePath || "media";
		this.chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
		this.concurrentUploads = Math.min(
			options.concurrentUploads || 5,
			MAXIMUM_CONCURRENT_UPLOADS,
		);
		this.file = options.file;
		this.fileName = options.fileName;
	}

	/**
	 * Starts the multipart upload.
	 */
	public async start() {
		return await this.initialize();
	}

	/**
	 * Sets the onProgress callback.
	 */
	public onProgress(onProgress: (progress?: MultipartUploadProgress) => void) {
		this.onProgressFn = onProgress;
		return this;
	}

	/**
	 * Sets the onError callback.
	 */
	public onError(onError: (e?: unknown) => void) {
		this.onErrorFn = onError;
		return this;
	}

	/**
	 * Sets the onAbort callback.
	 */
	public onAbort(onAbort: () => void) {
		this.onAbortFn = onAbort;
		return this;
	}

	/**
	 * Sets the onComplete callback.
	 */
	public onComplete(onComplete: (e: OnCompleteEvent) => void) {
		this.onCompleteFn = onComplete;
		return this;
	}

	/**
	 * Aborts the multipart upload.
	 */
	public async abort() {
		if (this.isAborted) {
			return;
		}
		this.isAborted = true;

		this.onAbortFn();

		Object.keys(this.activeConnections)
			.map(Number)
			.forEach((id) => {
				this.activeConnections[id].abort();
			});

		await this.client.post(this.buildUrl("/multipart-upload/abort"), {
			fileId: this.fileId,
			fileKey: this.fileKey,
		});
	}

	private buildUrl(path: string) {
		return API_BASE_URL + pathJoin("/api", this.basePath, path);
	}

	private async initialize() {
		if (!this.initialized) {
			this.initialized = true;
			try {
				// adding the the file extension (if present) to fileName
				let fileName = this.fileName;
				const ext = this.file.name.split(".").pop();
				if (ext) {
					fileName += `.${ext}`;
				}

				// initializing the multipart request
				const initializeData = await this.client
					.post(this.buildUrl("/multipart-upload/initialize"), {
						key: fileName,
					})
					.then((r) => r.data);

				this.fileId = initializeData.fileId;
				this.fileKey = initializeData.fileKey;

				// retrieving the pre-signed URLs
				const partsCount = Math.ceil(this.file.size / this.chunkSize);

				this.client
					.post(this.buildUrl("/multipart-upload/get-presigned-urls"), {
						fileId: this.fileId,
						fileKey: this.fileKey,
						partsCount,
					})
					.then((r) => r.data)
					.then((presignedUrlsData) => {
						this.parts.push(...presignedUrlsData.parts);
						this.sendNext();
					})
					.catch((error) => {
						this.complete(error);
					});
			} catch (error) {
				await this.complete(error);
			}
		}

		return {
			fileId: this.fileId,
			fileKey: this.fileKey,
		};
	}

	private sendNext() {
		const activeConnections = Object.keys(this.activeConnections).length;

		if (activeConnections >= this.concurrentUploads) {
			return;
		}

		if (!this.parts.length) {
			if (!activeConnections) {
				this.complete();
			}

			return;
		}

		const part = this.parts.pop();
		if (this.file && part) {
			const sentSize = (part.PartNumber - 1) * this.chunkSize;
			const chunk = this.file.slice(sentSize, sentSize + this.chunkSize);

			const sendChunkStarted = () => {
				this.sendNext();
			};

			this.sendChunk(chunk, part, sendChunkStarted)
				.then(() => {
					this.sendNext();
				})
				.catch((error) => {
					this.parts.push(part);

					this.complete(error);
				});
		}
	}

	// terminating the multipart upload request on success or failure
	private async complete(error?: any) {
		if (error && !this.isAborted) {
			this.onErrorFn(error);
			return;
		}

		if (error) {
			this.onErrorFn(error);
			return;
		}

		try {
			await this.sendCompleteRequest();
		} catch (error) {
			this.onErrorFn(error);
		}
	}

	// finalizing the multipart upload request on success by calling
	// the finalization API
	private async sendCompleteRequest() {
		if (this.fileId && this.fileKey) {
			const r = await this.client.post<FinalizeResponse>(
				this.buildUrl("/multipart-upload/finalize"),
				{
					fileId: this.fileId,
					fileKey: this.fileKey,
					parts: this.uploadedParts,
				},
			);

			this.onCompleteFn({
				fileId: this.fileId,
				fileKey: this.fileKey,
				completionData: r.data,
			});
		}
	}

	private sendChunk(chunk: Blob, part: Part, sendChunkStarted: () => void) {
		return new Promise<void>((resolve, reject) => {
			this.upload(chunk, part, sendChunkStarted)
				.then((status) => {
					if (status !== 200) {
						reject(new Error("Failed chunk upload"));
						return;
					}

					resolve();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	// calculating the current progress of the multipart upload request
	private handleProgress(
		partNumber: number,
		event: ProgressEvent<XMLHttpRequestEventTarget>,
	) {
		if (this.file) {
			if (
				event.type === "progress" ||
				event.type === "error" ||
				event.type === "abort"
			) {
				this.progressCache[partNumber] = event.loaded;
			}

			if (event.type === "uploaded") {
				this.uploadedSize += this.progressCache[partNumber] || 0;
				delete this.progressCache[partNumber];
			}

			const inProgress = Object.keys(this.progressCache)
				.map(Number)
				.reduce((memo, id) => (memo += this.progressCache[id]), 0);

			const sent = Math.min(this.uploadedSize + inProgress, this.file.size);

			const total = this.file.size;

			const percentage = Math.round((sent / total) * 100);

			this.onProgressFn({
				sent: sent,
				total: total,
				percentage: percentage,
			});
		}
	}

	// uploading a part through its pre-signed URL
	private upload(chunk: Blob, part: Part, sendChunkStarted: () => void) {
		// uploading each part with its pre-signed URL
		return new Promise((resolve, reject) => {
			if (this.fileId && this.fileKey && part.signedUrl) {
				// - 1 because PartNumber is an index starting from 1 and not 0
				const xhr = (this.activeConnections[part.PartNumber - 1] =
					new XMLHttpRequest());

				sendChunkStarted();

				const progressListener = this.handleProgress.bind(
					this,
					part.PartNumber - 1,
				);

				xhr.upload.addEventListener("progress", progressListener);

				xhr.addEventListener("error", progressListener);
				xhr.addEventListener("abort", progressListener);
				xhr.addEventListener("loadend", progressListener);

				xhr.open("PUT", part.signedUrl ?? "");

				xhr.onreadystatechange = () => {
					if (xhr.readyState === 4 && xhr.status === 200) {
						// retrieving the ETag parameter from the HTTP headers
						const ETag = xhr.getResponseHeader("ETag");

						if (ETag) {
							const uploadedPart = {
								PartNumber: part.PartNumber,
								// removing the " enclosing carachters from
								// the raw ETag
								ETag: ETag.replace(/"/g, ""),
							};

							this.uploadedParts.push(uploadedPart);

							resolve(xhr.status);
							delete this.activeConnections[part.PartNumber - 1];
						} else {
							reject(
								new Error(
									"Part upload did not have ETag header. Does the CORS policy expose the ETag header?",
								),
							);
							delete this.activeConnections[part.PartNumber - 1];
						}
					}
				};

				xhr.onerror = (error) => {
					reject(error);
					delete this.activeConnections[part.PartNumber - 1];
				};

				xhr.onabort = () => {
					reject(new Error("Upload cancelled by user"));
					delete this.activeConnections[part.PartNumber - 1];
				};

				xhr.send(chunk);
			}
		});
	}
}
