export interface NotifyParticipantsDto {
  title: string;
  body: string;
  phase_id?: string;
  notify_mentors?: boolean;
}
