export interface CreateUserDto {
  email: string;
  name: string;
  phone_number?: string;
  gender?: string;
  city?: string;
  birth_date?: Date;
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
  start_date: Date;
  end_date?: Date;
}

export interface MentorRequestDto {
  years_experience: number;
  expertises: string[];
  type?: string;
  experiences: CreateExperienceDto[];
}

export interface CreateMentorDto {
  user: CreateUserDto;
  mentor: MentorRequestDto;
}
