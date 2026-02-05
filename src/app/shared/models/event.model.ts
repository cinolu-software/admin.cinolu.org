import { IBase } from './base.model';
import { IUser } from './user.model';
import { ICategory } from './category.model';
import { IImage } from './image.model';
import { ISubprogram } from './program.model';
import { EventParticipation } from './participation.model';

export interface IEvent extends IBase {
  name: string;
  slug: string;
  is_highlighted: boolean;
  cover: string;
  place: string;
  description: string;
  context: string;
  objectives: string;
  duration_hours: number;
  event_manager?: IUser;
  selection_criteria: string;
  started_at: string;
  is_published: boolean;
  ended_at: string;
  program: ISubprogram;
  categories: ICategory[];
  gallery: IImage[];
  participations: EventParticipation[];
}
