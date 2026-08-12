-- Optional Supabase tables for Email Center (run in SQL editor if using Supabase)
-- Local dev uses data/email/*.json when tables are missing.

create table if not exists email_threads (
  id uuid primary key,
  subject text not null default '',
  account_email text not null default '',
  participants jsonb not null default '[]',
  folder text not null default 'inbox',
  starred boolean not null default false,
  unread_count int not null default 0,
  last_message_at timestamptz not null default now(),
  last_preview text not null default '',
  last_from_name text not null default '',
  last_from_email text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_messages (
  id uuid primary key,
  thread_id uuid not null references email_threads(id) on delete cascade,
  resend_email_id text,
  message_id text,
  from_email text not null,
  from_name text not null default '',
  to_emails jsonb not null default '[]',
  cc_emails jsonb,
  bcc_emails jsonb,
  subject text not null default '',
  body_html text not null default '',
  body_text text not null default '',
  direction text not null default 'inbound',
  sent_by_user_id text,
  sent_by_user_name text,
  read_at timestamptz,
  starred boolean not null default false,
  in_reply_to text,
  message_references jsonb,
  attachments jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_threads_folder_idx on email_threads(folder);
create index if not exists email_threads_last_message_idx on email_threads(last_message_at desc);
create index if not exists email_messages_thread_idx on email_messages(thread_id);
create index if not exists email_messages_resend_id_idx on email_messages(resend_email_id);

-- Store email account config in settings (required when deployed — local JSON is not persistent on Vercel)
alter table settings add column if not exists email_accounts jsonb default '[]'::jsonb;
alter table settings add column if not exists resend_webhook_secret text;
