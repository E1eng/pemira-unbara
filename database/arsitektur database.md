-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action USER-DEFINED NOT NULL,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.candidates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  vision text NOT NULL,
  mission text NOT NULL,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT candidates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.election_settings (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  is_voting_open boolean DEFAULT true,
  show_live_result boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT election_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.voters (
  nik text NOT NULL,
  name text NOT NULL,
  access_code_hash text NOT NULL,
  has_voted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT voters_pkey PRIMARY KEY (nik)
);
CREATE TABLE public.votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id bigint NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);