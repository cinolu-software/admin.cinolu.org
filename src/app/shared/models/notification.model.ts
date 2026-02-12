import { IBase } from './base.model';
import { IPhase } from './phase.model';
import { IUser } from './user.model';

export interface INotificationAttachment extends IBase {
  filename: string;
  url?: string;
}

export interface INotification extends IBase {
  title: string;
  body: string;
  phase?: IPhase | null;
  phase_id?: string | null;
  sender?: IUser | null;
  attachments?: INotificationAttachment[];
  /** Draft or sent; used for list actions (e.g. resend only when sent) */
  status?: 'draft' | 'sent';
}
