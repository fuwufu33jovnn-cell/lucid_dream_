import type { TodayTask } from "./models.ts";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskAttemptStatus =
  | "draft"
  | "submitting"
  | "feedback-ready"
  | "completed"
  | "failed";

export type ExamSessionStatus = "in_progress" | "submitted" | "expired";

export type ProfileRow = {
  user_id: string;
  display_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  user_id: string;
  display_name?: string;
  timezone?: string;
};

export type ProfileUpdate = {
  display_name?: string;
  timezone?: string;
};

export type DailyPlanRow = {
  id: string;
  user_id: string;
  local_date: string;
  mode: 10 | 45 | 90;
  tasks: TodayTask[];
  created_at: string;
  updated_at: string;
};

export type DailyPlanInsert = {
  id?: string;
  user_id: string;
  local_date: string;
  mode: 10 | 45 | 90;
  tasks?: TodayTask[];
};

export type DailyPlanUpdate = {
  local_date?: string;
  mode?: 10 | 45 | 90;
  tasks?: TodayTask[];
};

export type TaskAttemptRow = {
  id: string;
  user_id: string;
  plan_id: string;
  task_id: string;
  task_type: string;
  input_text: string | null;
  transcript: string | null;
  feedback_json: Json | null;
  score_json: Json | null;
  duration_seconds: number;
  status: TaskAttemptStatus;
  server_sealed_at: string | null;
  feedback_schema_version: number | null;
  created_at: string;
  completed_at: string | null;
};

export type TaskAttemptInsert = {
  id?: string;
  user_id: string;
  plan_id: string;
  task_id: string;
  task_type: string;
  input_text?: string | null;
  transcript?: string | null;
  feedback_json?: Json | null;
  score_json?: Json | null;
  duration_seconds?: number;
  status?: TaskAttemptStatus;
  completed_at?: string | null;
};

export type TaskAttemptUpdate = {
  input_text?: string | null;
  transcript?: string | null;
  feedback_json?: Json | null;
  score_json?: Json | null;
  duration_seconds?: number;
  status?: TaskAttemptStatus;
  completed_at?: string | null;
};

export type ExamMaterialRow = {
  id: string;
  user_id: string;
  title: string;
  skill: string;
  test_type: string;
  pdf_path: string | null;
  audio_path: string | null;
  question_count: number;
  duration_seconds: number;
  answer_key_json: Json | null;
  created_at: string;
  updated_at: string;
};

export type ExamMaterialInsert = {
  id?: string;
  user_id: string;
  title: string;
  skill: string;
  test_type: string;
  pdf_path?: string | null;
  audio_path?: string | null;
  question_count?: number;
  duration_seconds?: number;
  answer_key_json?: Json | null;
};

export type ExamMaterialUpdate = {
  title?: string;
  skill?: string;
  test_type?: string;
  pdf_path?: string | null;
  audio_path?: string | null;
  question_count?: number;
  duration_seconds?: number;
  answer_key_json?: Json | null;
};

export type ExamSessionRow = {
  id: string;
  user_id: string;
  material_id: string;
  started_at: string;
  end_at: string;
  submitted_at: string | null;
  current_question: number;
  status: ExamSessionStatus;
  score: number | null;
  max_score: number | null;
};

export type ExamSessionInsert = {
  id?: string;
  user_id: string;
  material_id: string;
  started_at?: string;
  end_at: string;
  submitted_at?: string | null;
  current_question?: number;
  status?: ExamSessionStatus;
  score?: number | null;
  max_score?: number | null;
};

export type ExamSessionUpdate = {
  end_at?: string;
  submitted_at?: string | null;
  current_question?: number;
  status?: ExamSessionStatus;
  score?: number | null;
  max_score?: number | null;
};

export type ExamAnswerRow = {
  id: string;
  user_id: string;
  session_id: string;
  question_number: number;
  answer: string;
  flagged: boolean;
  updated_at: string;
};

export type ExamAnswerInsert = {
  id?: string;
  user_id: string;
  session_id: string;
  question_number: number;
  answer?: string;
  flagged?: boolean;
};

export type ExamAnswerUpdate = {
  answer?: string;
  flagged?: boolean;
};

export type ProgressEventRow = {
  id: string;
  user_id: string;
  event_type: string;
  source_id: string | null;
  skill: string | null;
  minutes: number;
  score_json: Json | null;
  created_at: string;
};

export type ProgressEventInsert = {
  id?: string;
  user_id: string;
  event_type: string;
  source_id?: string | null;
  skill?: string | null;
  minutes?: number;
  score_json?: Json | null;
};

export type ProgressEventUpdate = {
  event_type?: string;
  source_id?: string | null;
  skill?: string | null;
  minutes?: number;
  score_json?: Json | null;
};

export type LearningMaterialKind = "catalogue" | "link" | "upload";
export type LearningMaterialStatus =
  | "queued"
  | "processing"
  | "ready"
  | "needs-input"
  | "failed"
  | "deleted";
export type LearningSourceHealth = "healthy" | "stale" | "unavailable";
export type VocabularyFamiliarity = "new" | "learning" | "familiar" | "mastered";
export type CareerArtifactType =
  | "resume_bullet"
  | "cover_letter"
  | "case_study"
  | "walkthrough_short"
  | "walkthrough_long"
  | "interview_answer";
export type CareerArtifactStatus = "draft" | "generated" | "accepted" | "archived" | "deleted";
export type AiProviderState = "disabled" | "available" | "exhausted" | "unhealthy" | "maintenance";
export type AiUsageStatus = "reserved" | "succeeded" | "failed" | "cancelled";

export type LearningSourceRow = {
  id: string;
  publisher: string;
  title: string;
  canonical_url: string;
  media_type: "video" | "audio" | "article" | "course" | "text";
  topics: string[];
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  expected_duration_seconds: number | null;
  skills: string[];
  has_text: boolean;
  usage_basis: string;
  last_checked_at: string | null;
  health: LearningSourceHealth;
  created_at: string;
  updated_at: string;
};
export type LearningSourceInsert = {
  id?: string;
  publisher: string;
  title: string;
  canonical_url: string;
  media_type: LearningSourceRow["media_type"];
  topics?: string[];
  cefr_level?: LearningSourceRow["cefr_level"];
  expected_duration_seconds?: number | null;
  skills?: string[];
  has_text?: boolean;
  usage_basis: string;
  last_checked_at?: string | null;
  health?: LearningSourceHealth;
};
export type LearningSourceUpdate = Partial<Omit<LearningSourceInsert, "id">>;

export type LearningMaterialRow = {
  id: string;
  user_id: string;
  source_id: string | null;
  title: string;
  kind: LearningMaterialKind;
  status: LearningMaterialStatus;
  canonical_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  duration_seconds: number | null;
  language_code: string;
  error_code: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};
export type LearningMaterialInsert = {
  id?: string;
  user_id: string;
  source_id?: string | null;
  title: string;
  kind: LearningMaterialKind;
  status?: LearningMaterialStatus;
  canonical_url?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  duration_seconds?: number | null;
  language_code?: string;
  error_code?: string | null;
  deleted_at?: string | null;
};
export type LearningMaterialUpdate = Omit<Partial<LearningMaterialInsert>, "id" | "user_id">;

export type MaterialSegmentRow = {
  id: string;
  user_id: string;
  material_id: string;
  ordinal: number;
  start_seconds: number | null;
  end_seconds: number | null;
  content: string;
  source_kind: "import" | "caption" | "transcript" | "manual";
  created_at: string;
};
export type MaterialSegmentInsert = {
  id?: string;
  user_id: string;
  material_id: string;
  ordinal: number;
  start_seconds?: number | null;
  end_seconds?: number | null;
  content: string;
  source_kind?: MaterialSegmentRow["source_kind"];
};
export type MaterialSegmentUpdate = Partial<Omit<MaterialSegmentInsert, "id" | "user_id" | "material_id">>;

export type SavedMaterialRow = { id: string; user_id: string; material_id: string; created_at: string };
export type SavedMaterialInsert = Omit<SavedMaterialRow, "id" | "created_at"> & { id?: string };
export type SavedMaterialUpdate = Record<string, never>;

export type StudySessionRow = {
  id: string;
  user_id: string;
  material_id: string;
  status: "active" | "completed" | "abandoned";
  started_at: string;
  completed_at: string | null;
  last_segment_ordinal: number | null;
  created_at: string;
  updated_at: string;
};
export type StudySessionInsert = {
  id?: string;
  user_id: string;
  material_id: string;
  status?: StudySessionRow["status"];
  started_at?: string;
  completed_at?: string | null;
  last_segment_ordinal?: number | null;
};
export type StudySessionUpdate = Partial<Omit<StudySessionInsert, "id" | "user_id" | "material_id">>;

export type StudyNoteRow = { id: string; user_id: string; material_id: string; session_id: string | null; segment_id: string | null; body: string; created_at: string; updated_at: string };
export type StudyNoteInsert = { id?: string; user_id: string; material_id: string; session_id?: string | null; segment_id?: string | null; body?: string };
export type StudyNoteUpdate = Partial<Omit<StudyNoteInsert, "id" | "user_id" | "material_id">>;

export type VocabularyEntryRow = {
  id: string; user_id: string; term: string; normalized_term: string; pronunciation: string | null;
  part_of_speech: string | null; definition_en: string | null; definition_zh: string | null;
  contextual_meaning: string | null; source_excerpt: string | null;
  source_module: "language" | "today" | "ielts" | "career"; material_id: string | null;
  segment_id: string | null; canonical_url: string | null; collocations: string[]; learner_note: string;
  tags: string[]; familiarity: VocabularyFamiliarity; review_due_at: string | null;
  review_interval_days: number; ai_provider: string | null; ai_model: string | null;
  created_at: string; updated_at: string;
};
export type VocabularyEntryInsert = {
  id?: string; pronunciation?: string | null; part_of_speech?: string | null; definition_en?: string | null;
  user_id: string; term: string; normalized_term: string;
  definition_zh?: string | null; contextual_meaning?: string | null; source_excerpt?: string | null;
  source_module: VocabularyEntryRow["source_module"];
  material_id?: string | null; segment_id?: string | null; canonical_url?: string | null; collocations?: string[];
  learner_note?: string; tags?: string[]; familiarity?: VocabularyFamiliarity; review_due_at?: string | null;
  review_interval_days?: number; ai_provider?: string | null; ai_model?: string | null;
};
export type VocabularyEntryUpdate = Partial<Omit<VocabularyEntryInsert, "id" | "user_id">>;

export type VocabularyCollectionRow = { id: string; user_id: string; name: string; description: string; created_at: string; updated_at: string };
export type VocabularyCollectionInsert = { id?: string; user_id: string; name: string; description?: string };
export type VocabularyCollectionUpdate = Partial<Omit<VocabularyCollectionInsert, "id" | "user_id">>;
export type VocabularyCollectionEntryRow = { id: string; user_id: string; collection_id: string; entry_id: string; created_at: string };
export type VocabularyCollectionEntryInsert = Omit<VocabularyCollectionEntryRow, "id" | "created_at"> & { id?: string };
export type VocabularyCollectionEntryUpdate = Record<string, never>;
export type VocabularyReviewRow = { id: string; user_id: string; entry_id: string; review_mode: "recognize" | "collocation" | "sentence" | "retell"; result: "again" | "hard" | "good" | "easy"; reviewed_at: string; next_due_at: string | null };
export type VocabularyReviewInsert = { id?: string; user_id: string; entry_id: string; review_mode: VocabularyReviewRow["review_mode"]; result: VocabularyReviewRow["result"]; reviewed_at?: string; next_due_at?: string | null };
export type VocabularyReviewUpdate = Partial<Omit<VocabularyReviewInsert, "id" | "user_id" | "entry_id">>;

export type CareerProjectRow = { id: string; user_id: string; title: string; summary: string; status: "active" | "archived" | "deleted"; deleted_at: string | null; created_at: string; updated_at: string };
export type CareerProjectInsert = { id?: string; user_id: string; title: string; summary?: string; status?: CareerProjectRow["status"]; deleted_at?: string | null };
export type CareerProjectUpdate = Partial<Omit<CareerProjectInsert, "id" | "user_id">>;
export type CareerEvidenceRow = { id: string; user_id: string; project_id: string; evidence_type: "note" | "link" | "file" | "image" | "metric" | "decision"; content: string; source_url: string | null; storage_path: string | null; provenance: "learner" | "imported" | "ai-inference"; created_at: string; updated_at: string };
export type CareerEvidenceInsert = { id?: string; user_id: string; project_id: string; evidence_type: CareerEvidenceRow["evidence_type"]; content?: string; source_url?: string | null; storage_path?: string | null; provenance?: CareerEvidenceRow["provenance"] };
export type CareerEvidenceUpdate = Partial<Omit<CareerEvidenceInsert, "id" | "user_id" | "project_id">>;
export type CareerArtifactRow = { id: string; user_id: string; project_id: string; parent_artifact_id: string | null; artifact_type: CareerArtifactType; status: CareerArtifactStatus; content: string; prompt_purpose: string | null; ai_provider: string | null; ai_model: string | null; deleted_at: string | null; created_at: string; updated_at: string };
export type CareerArtifactInsert = { id?: string; user_id: string; project_id: string; parent_artifact_id?: string | null; artifact_type: CareerArtifactType; status?: CareerArtifactStatus; content?: string; prompt_purpose?: string | null; ai_provider?: string | null; ai_model?: string | null; deleted_at?: string | null };
export type CareerArtifactUpdate = Partial<Omit<CareerArtifactInsert, "id" | "user_id" | "project_id">>;
export type CareerArtifactEvidenceRow = { id: string; user_id: string; artifact_id: string; evidence_id: string; ordinal: number; created_at: string };
export type CareerArtifactEvidenceInsert = { id?: string; user_id: string; artifact_id: string; evidence_id: string; ordinal?: number };
export type CareerArtifactEvidenceUpdate = { ordinal?: number };
export type JobTargetRow = { id: string; user_id: string; project_id: string | null; company_name: string; role_title: string; job_description: string; status: "researching" | "preparing" | "applied" | "closed" | "deleted"; deleted_at: string | null; created_at: string; updated_at: string };
export type JobTargetInsert = { id?: string; user_id: string; project_id?: string | null; company_name: string; role_title: string; job_description?: string; status?: JobTargetRow["status"]; deleted_at?: string | null };
export type JobTargetUpdate = Partial<Omit<JobTargetInsert, "id" | "user_id">>;
export type CareerPracticeAttemptRow = { id: string; user_id: string; project_id: string; job_target_id: string | null; prompt: string; response_text: string | null; transcript: string | null; feedback_json: Json | null; status: "draft" | "submitting" | "feedback-ready" | "completed" | "failed" | "deleted"; created_at: string; completed_at: string | null; deleted_at: string | null };
export type CareerPracticeAttemptInsert = { id?: string; user_id: string; project_id: string; job_target_id?: string | null; prompt: string; response_text?: string | null; transcript?: string | null; feedback_json?: Json | null; status?: CareerPracticeAttemptRow["status"]; completed_at?: string | null; deleted_at?: string | null };
export type CareerPracticeAttemptUpdate = Partial<Omit<CareerPracticeAttemptInsert, "id" | "user_id" | "project_id">>;

export type AiUsageEventRow = { id: string; user_id: string; request_id: string; idempotency_key: string; provider: string; model: string; operation: string; input_tokens: number; output_tokens: number; reserved_units: number; status: AiUsageStatus; error_code: string | null; created_at: string; finalized_at: string | null };
export type AiUsageEventInsert = { id?: string; user_id: string; request_id: string; idempotency_key: string; provider: string; model: string; operation: string; input_tokens?: number; output_tokens?: number; reserved_units?: number; status: AiUsageStatus; error_code?: string | null; finalized_at?: string | null };
export type AiUsageEventUpdate = Partial<Omit<AiUsageEventInsert, "id" | "user_id" | "request_id" | "idempotency_key">>;
export type AiProviderStateRow = { id: string; provider: string; model: string; capabilities: string[]; state: AiProviderState; allowance_label: string; configured_units: number; consumed_units: number; resets_at: string | null; last_health_checked_at: string | null; last_health_status: "unknown" | "healthy" | "unhealthy"; created_at: string; updated_at: string };
export type AiProviderStateInsert = { id?: string; provider: string; model: string; capabilities?: string[]; state?: AiProviderState; allowance_label?: string; configured_units?: number; consumed_units?: number; resets_at?: string | null; last_health_checked_at?: string | null; last_health_status?: AiProviderStateRow["last_health_status"] };
export type AiProviderStateUpdate = Partial<Omit<AiProviderStateInsert, "id">>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      daily_plans: {
        Row: DailyPlanRow;
        Insert: DailyPlanInsert;
        Update: DailyPlanUpdate;
        Relationships: [];
      };
      task_attempts: {
        Row: TaskAttemptRow;
        Insert: TaskAttemptInsert;
        Update: TaskAttemptUpdate;
        Relationships: [
          {
            foreignKeyName: "task_attempts_plan_id_user_id_fkey";
            columns: ["plan_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "daily_plans";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      exam_materials: {
        Row: ExamMaterialRow;
        Insert: ExamMaterialInsert;
        Update: ExamMaterialUpdate;
        Relationships: [];
      };
      exam_sessions: {
        Row: ExamSessionRow;
        Insert: ExamSessionInsert;
        Update: ExamSessionUpdate;
        Relationships: [
          {
            foreignKeyName: "exam_sessions_material_id_user_id_fkey";
            columns: ["material_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "exam_materials";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      exam_answers: {
        Row: ExamAnswerRow;
        Insert: ExamAnswerInsert;
        Update: ExamAnswerUpdate;
        Relationships: [
          {
            foreignKeyName: "exam_answers_session_id_user_id_fkey";
            columns: ["session_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "exam_sessions";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      progress_events: {
        Row: ProgressEventRow;
        Insert: ProgressEventInsert;
        Update: ProgressEventUpdate;
        Relationships: [];
      };
      learning_sources: { Row: LearningSourceRow; Insert: LearningSourceInsert; Update: LearningSourceUpdate; Relationships: []; };
      learning_materials: { Row: LearningMaterialRow; Insert: LearningMaterialInsert; Update: LearningMaterialUpdate; Relationships: []; };
      material_segments: { Row: MaterialSegmentRow; Insert: MaterialSegmentInsert; Update: MaterialSegmentUpdate; Relationships: []; };
      saved_materials: { Row: SavedMaterialRow; Insert: SavedMaterialInsert; Update: SavedMaterialUpdate; Relationships: []; };
      study_sessions: { Row: StudySessionRow; Insert: StudySessionInsert; Update: StudySessionUpdate; Relationships: []; };
      study_notes: { Row: StudyNoteRow; Insert: StudyNoteInsert; Update: StudyNoteUpdate; Relationships: []; };
      vocabulary_entries: { Row: VocabularyEntryRow; Insert: VocabularyEntryInsert; Update: VocabularyEntryUpdate; Relationships: []; };
      vocabulary_collections: { Row: VocabularyCollectionRow; Insert: VocabularyCollectionInsert; Update: VocabularyCollectionUpdate; Relationships: []; };
      vocabulary_collection_entries: { Row: VocabularyCollectionEntryRow; Insert: VocabularyCollectionEntryInsert; Update: VocabularyCollectionEntryUpdate; Relationships: []; };
      vocabulary_reviews: { Row: VocabularyReviewRow; Insert: VocabularyReviewInsert; Update: VocabularyReviewUpdate; Relationships: []; };
      career_projects: { Row: CareerProjectRow; Insert: CareerProjectInsert; Update: CareerProjectUpdate; Relationships: []; };
      career_evidence: { Row: CareerEvidenceRow; Insert: CareerEvidenceInsert; Update: CareerEvidenceUpdate; Relationships: []; };
      career_artifacts: { Row: CareerArtifactRow; Insert: CareerArtifactInsert; Update: CareerArtifactUpdate; Relationships: []; };
      career_artifact_evidence: { Row: CareerArtifactEvidenceRow; Insert: CareerArtifactEvidenceInsert; Update: CareerArtifactEvidenceUpdate; Relationships: []; };
      job_targets: { Row: JobTargetRow; Insert: JobTargetInsert; Update: JobTargetUpdate; Relationships: []; };
      career_practice_attempts: { Row: CareerPracticeAttemptRow; Insert: CareerPracticeAttemptInsert; Update: CareerPracticeAttemptUpdate; Relationships: []; };
      ai_usage_events: { Row: AiUsageEventRow; Insert: AiUsageEventInsert; Update: AiUsageEventUpdate; Relationships: []; };
      ai_provider_state: { Row: AiProviderStateRow; Insert: AiProviderStateInsert; Update: AiProviderStateUpdate; Relationships: []; };
    };
    Views: Record<string, never>;
    Functions: {
      complete_task_without_ai: {
        Args: {
          p_local_date: string;
          p_mode: 10 | 45 | 90;
          p_tasks: TodayTask[];
          p_task_id: string;
          p_task_type: string;
          p_input_text: string | null;
          p_skill: string;
          p_minutes: number;
        };
        Returns: string;
      };
      complete_feedback_task_attempt: {
        Args: { p_attempt_id: string };
        Returns: string;
      };
      consume_evaluate_attempt_budget: { Args: { p_user_id: string }; Returns: boolean; };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
