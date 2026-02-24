import { MentorType } from '../../enums/mentor.enum';

export interface CreateUserDto {
  email: string;
  name: string;
  phone_number?: string;
  gender?: string;
  city?: string;
  birth_date?: string;
  country?: string;
  biography?: string;
  google_image?: string;
  roles?: string[];
}

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
  user: CreateUserDto;
  mentor: MentorRequestDto;
}
