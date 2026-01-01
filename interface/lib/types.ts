export interface Form {
  id: string;
  formType: number;
  creator: string;
  title: string;
  description: string;
  options: string[];
  votes: string[];
  totalParticipants: string;
  accessType: number;
  authMethod: number;
}
