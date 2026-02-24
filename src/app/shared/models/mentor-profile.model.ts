import type { IBase } from './base.model';
import type { IUser } from './user.model';
import type { IExpertise } from './expertise.model';
import type { MentorType } from '@features/mentors/enums/mentor.enum';

export interface IExperience extends IBase {
  company_name: string;
  job_title: string;
  is_current: boolean;
  start_date: Date;
  end_date?: Date;
}

export interface IMentorProfile extends IBase {
  years_experience: number;
  type?: MentorType;
  status: string;
  cv?: string;
  owner: IUser;
  expertises: IExpertise[];
  experiences: IExperience[];
}
