export interface NotifyParticipantsDto {
  title: string;
  body: string;
  phase_id?: string | null;
  notify_mentors?: boolean;
  notify_staff?: boolean;
}
