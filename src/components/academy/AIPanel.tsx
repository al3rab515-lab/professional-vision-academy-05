import { EnhancedAIPanel } from "./EnhancedAIPanel";

interface AIPanelProps {
  userType: 'student' | 'trainer' | 'admin';
}

export function AIPanel({ userType }: AIPanelProps) {
  return <EnhancedAIPanel userType={userType} />;
}