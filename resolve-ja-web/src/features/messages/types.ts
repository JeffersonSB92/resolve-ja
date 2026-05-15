export type RequestMessage = {
  id: string;
  request_id: string;
  sender_id: string;
  body: string | null;
  attachment_path: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type CreateMessageInput = {
  body?: string;
  attachmentPath?: string | null;
};
