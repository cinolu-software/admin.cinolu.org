export interface CreateExperienceDto {
  id?: string;
  company_name: string;
  job_title: string;
  is_current: boolean;
  start_date: Date;
  end_date?: Date;
}
