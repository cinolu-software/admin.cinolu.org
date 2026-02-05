import { IBase } from './base.model';
import { IEvent } from './event.model';
import { IPhase } from './phase.model';
import { IProject } from './project.model';
import { IUser } from './user.model';
import { IVenture } from './venture.model';

export interface ProjectParticipation extends IBase {
  user: IUser;
  project: IProject;
  venture: IVenture | null;
  phase: IPhase[];
}

export interface EventParticipation extends IBase {
  user: IUser;
  event: IEvent;
}
