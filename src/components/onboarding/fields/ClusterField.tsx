
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClusterType, SubmissionData } from "@/pages/Index";

const clusters: ClusterType[] = [
  'Future Tech',
  'Built Environment & Sustainability',
  'Creative Industries',
  'Business & Enterprise',
  'Social Care & Health'
];

interface Props {
  value: ClusterType | "";
  updateData: (data: Partial<SubmissionData>) => void;
}

const ClusterField: React.FC<Props> = ({ value, updateData }) => (
  <div className="space-y-2">
    <Label htmlFor="cluster" className="text-base font-medium">
      Cluster *
    </Label>
    <Select value={value} onValueChange={(val: ClusterType) => updateData({ cluster: val })}>
      <SelectTrigger className="text-lg h-12">
        <SelectValue placeholder="Select your cluster" />
      </SelectTrigger>
      <SelectContent>
        {clusters.map((cluster) => (
          <SelectItem key={cluster} value={cluster}>{cluster}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default ClusterField;
