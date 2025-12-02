-- Create project_stages table to track the progress of projects through different stages
CREATE TABLE IF NOT EXISTS project_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  current_stage INTEGER DEFAULT 0,
  introduction_complete BOOLEAN DEFAULT FALSE,
  reviewed_by_supervisor BOOLEAN DEFAULT FALSE,
  ready_to_submit BOOLEAN DEFAULT FALSE,
  submission_status TEXT CHECK (submission_status IN ('on_hold', 'compiling', 'submitted')),
  submission_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON project_stages(project_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_stages_updated_at
  BEFORE UPDATE ON project_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stages_updated_at();

-- Add comments to document the table
COMMENT ON TABLE project_stages IS 'Tracks the progress of projects through different workflow stages';
COMMENT ON COLUMN project_stages.current_stage IS 'Current stage: 0=New Client, 1=Document Preparation, 2=Submission Review, 3=Submission, 4=Tracking, 5=Completion';
COMMENT ON COLUMN project_stages.introduction_complete IS 'Stage 0: Whether introduction task is completed';
COMMENT ON COLUMN project_stages.reviewed_by_supervisor IS 'Stage 2: Whether project has been reviewed by supervisor';
COMMENT ON COLUMN project_stages.ready_to_submit IS 'Stage 2: Whether project is ready to submit';
COMMENT ON COLUMN project_stages.submission_status IS 'Stage 3: Current submission status (on_hold, compiling, submitted)';
COMMENT ON COLUMN project_stages.submission_info IS 'Stage 4: Tracking information as JSON (type_of_submission, submission_center, date_of_submission, visa_ref, vfs_receipt, receipt_number)';
