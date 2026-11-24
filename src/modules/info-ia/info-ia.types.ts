import { Bed } from "../../types";

export interface InfoIAProps {
  bed: Bed;
  onBack: () => void;
  onSelectBed?: (bed: Bed) => void;
}

export interface CopilotMessage {
  text: string;
  timestamp: string;
}
