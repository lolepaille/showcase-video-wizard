
import { useState } from "react";

export interface QualityChecked {
  audioVisual: boolean;
  questionsAddressed: boolean;
  timeLimit: boolean;
}

export function useReviewQualityChecks(initial: QualityChecked = {
  audioVisual: false,
  questionsAddressed: false,
  timeLimit: false,
}) {
  const [qualityChecked, setQualityChecked] = useState<QualityChecked>(initial);

  const handleQualityCheck = (key: keyof QualityChecked, checked: boolean) => {
    setQualityChecked((prev) => ({ ...prev, [key]: checked }));
  };

  const allChecked = Object.values(qualityChecked).every(Boolean);

  return { qualityChecked, handleQualityCheck, allChecked, setQualityChecked };
}
