import { IBase } from './base.model';
import { IEvent } from './event.model';
import { IPhase } from './phase.model';
import { IProject } from './project.model';
import { IUser } from './user.model';
import { IVenture } from './venture.model';

export interface IProjectParticipation extends IBase {
  user: IUser;
  project: IProject;
  venture: IVenture | null;
  phase: IPhase[];
}

export interface IEventParticipation extends IBase {
  user: IUser;
  event: IEvent;
}
