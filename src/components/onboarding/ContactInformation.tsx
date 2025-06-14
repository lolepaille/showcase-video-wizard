
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, User, Briefcase, Building } from 'lucide-react';
import type { ClusterType } from '@/pages/Index';

interface ContactInformationProps {
  fullName: string;
  email: string;
  title: string;
  cluster: ClusterType | '';
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onClusterChange: (value: ClusterType) => void;
}

const clusters: ClusterType[] = [
  'Future Tech',
  'Built Environment & Sustainability',
  'Creative Industries',
  'Business & Enterprise',
  'Social Care & Health'
];

const ContactInformation: React.FC<ContactInformationProps> = ({
  fullName,
  email,
  title,
  cluster,
  onFullNameChange,
  onEmailChange,
  onTitleChange,
  onClusterChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contact Information</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reviewFullName" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name *
          </Label>
          <Input
            id="reviewFullName"
            type="text"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@rmit.edu.au"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Title
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="e.g., Senior Lecturer"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cluster" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Cluster *
          </Label>
          <Select value={cluster} onValueChange={onClusterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select your cluster" />
            </SelectTrigger>
            <SelectContent>
              {clusters.map((clusterOption) => (
                <SelectItem key={clusterOption} value={clusterOption}>
                  {clusterOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ContactInformation;
