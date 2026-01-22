import { CreateExperienceDto } from './experience.dto';

export interface CreateMentorProfileDto {
  years_experience: number;
  expertises: string[];
  experiences: CreateExperienceDto[];
}
