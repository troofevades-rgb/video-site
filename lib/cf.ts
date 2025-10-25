export type Env = {
  WASABI_ENDPOINT: string;
  WASABI_REGION: string;
  WASABI_BUCKET: string;
  WASABI_KEY: string;
  WASABI_SECRET: string;
  DAILY_UPLOAD_BYTES?: string;
  MAX_FILE_BYTES?: string;
  VIDEOS_DB: any; // Cloudflare D1 binding
};
