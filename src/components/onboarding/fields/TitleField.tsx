
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubmissionData } from "@/pages/Index";

interface Props {
  title: string;
  updateData: (data: Partial<SubmissionData>) => void;
}

const TitleField: React.FC<Props> = ({ title, updateData }) => (
  <div className="space-y-2">
    <Label htmlFor="title" className="text-base font-medium">
      Title
    </Label>
    <Input
      id="title"
      type="text"
      placeholder="e.g., Senior Lecturer, Associate Professor"
      value={title}
      onChange={(e) => updateData({ title: e.target.value })}
      className="text-lg h-12"
    />
  </div>
);

export default TitleField;
