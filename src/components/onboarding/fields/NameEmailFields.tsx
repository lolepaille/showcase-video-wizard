
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import type { SubmissionData } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  fullName: string;
  email: string;
  updateData: (data: Partial<SubmissionData>) => void;
  emailChecked: string;
  alreadySubmitted: boolean;
  checkingEmail: boolean;
  validateEmail: (email: string) => boolean;
}

const NameEmailFields: React.FC<Props> = ({
  fullName,
  email,
  updateData,
  emailChecked,
  alreadySubmitted,
  checkingEmail,
  validateEmail,
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="fullName" className="text-base font-medium">
        Full Name *
      </Label>
      <Input
        id="fullName"
        type="text"
        placeholder="Enter your full name"
        value={fullName}
        onChange={(e) => updateData({ fullName: e.target.value })}
        required
        className="text-lg h-12"
        autoComplete="name"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="email" className="text-base font-medium">
        Email Address *
      </Label>
      <Input
        id="email"
        type="email"
        placeholder="your.email@rmit.edu.au"
        value={email}
        onChange={(e) => updateData({ email: e.target.value })}
        required
        className="text-lg h-12"
        autoComplete="email"
      />
      {checkingEmail && !!email && validateEmail(email) && (
        <p className="text-blue-600 text-sm mt-1">Checking for previous submission...</p>
      )}
      {!!email &&
        alreadySubmitted &&
        !checkingEmail &&
        emailChecked === email && (
        <div className="flex items-start bg-amber-100 border-l-4 border-amber-500 rounded-md p-3 mt-2 gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="text-amber-800 text-sm font-semibold mb-1">
              Submission already received!
            </p>
            <p className="text-amber-800 text-sm">
              Our records show a submission with this email. If you need to replace your video or update your profile, please contact{' '}
              <a
                href="mailto:dmd.cove@rmit.edu.au"
                className="underline text-blue-700 hover:text-blue-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                dmd.cove@rmit.edu.au
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default NameEmailFields;
