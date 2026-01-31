import type { IBase } from './base.model';
import type { IVenture } from './venture.model';
import type { IRole } from './role.model';
import type { IProject } from './project.model';
import type { IEvent } from './event.model';
import type { IArticle } from './article.model';
import type { IComment } from './article.model';
import { IMentorProfile } from './mentor-profile.model';

export interface IUser extends IBase {
  email: string;
  name: string;
  password: string;
  biography: string;
  phone_number: string;
  city: string;
  country: string;
  gender: string;
  birth_date: string;
  google_image: string;
  profile: string;
  referral_code: string;
  referred_by: IUser;
  referralsCount?: number;
  referrals: IUser[];
  ventures: IVenture[];
  roles: IRole[];
  participated_projects: IProject[];
  participated_events: IEvent[];
  managed_projects: IProject[];
  managed_events: IEvent[];
  articles: IArticle[];
  comments: IComment[];
  mentor_profile?: IMentorProfile | null;
}
