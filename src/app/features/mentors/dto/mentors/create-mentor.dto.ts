import { MentorType } from '../../enums/mentor.enum';

export interface CreateExperienceDto {
  id?: string;
  company_name: string;
  job_title: string;
  is_current: boolean;
  start_date: string;
  end_date?: string;
}

export interface MentorRequestDto {
  years_experience: number;
  expertises: string[];
  type?: MentorType;
  experiences: CreateExperienceDto[];
}

export interface CreateMentorDto {
  email: string;
  mentor: MentorRequestDto;
}
