
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User } from 'lucide-react';

interface ContactInformationProps {
  firstName: string;
  email: string;
  onFirstNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

const ContactInformation: React.FC<ContactInformationProps> = ({
  firstName,
  email,
  onFirstNameChange,
  onEmailChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contact Information</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reviewFirstName" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            First Name *
          </Label>
          <Input
            id="reviewFirstName"
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
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
      </div>
    </div>
  );
};

export default ContactInformation;
