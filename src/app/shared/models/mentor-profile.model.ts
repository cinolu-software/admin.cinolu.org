import type { IBase } from './base.model';
import type { IUser } from './user.model';
import type { IExpertise } from './expertise.model';

export interface IExperience extends IBase {
  job_title: string;
  is_current: boolean;
  start_date: Date;
  end_date?: Date;
}

export interface IMentorProfile extends IBase {
  years_experience: number;
  status: string;
  cv?: string;
  owner: IUser;
  expertises: IExpertise[];
  experiences: IExperience[];
}
