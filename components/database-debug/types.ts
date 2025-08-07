export interface DatabaseDebugScreenProps {
  visible: boolean;
  onClose: () => void;
}

export type TabType = 'overview' | 'conflicts' | 'actions';
