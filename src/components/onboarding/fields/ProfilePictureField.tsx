
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import type { SubmissionData } from "@/pages/Index";

interface Props {
  profilePicture?: File;
  updateData: (data: Partial<SubmissionData>) => void;
}

const ProfilePictureField: React.FC<Props> = ({ profilePicture, updateData }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profilePicture) {
      const url = URL.createObjectURL(profilePicture);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [profilePicture]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateData({ profilePicture: file });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="profilePicture" className="text-base font-medium flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Profile Picture (Optional)
      </Label>
      <Input
        id="profilePicture"
        type="file"
        accept="image/*"
        onChange={handleProfilePictureChange}
        className="text-lg h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {profilePicture && (
        <p className="text-sm text-green-600">✓ {profilePicture.name}</p>
      )}
      {previewUrl && (
        <div className="mt-2 flex justify-center">
          <img
            src={previewUrl}
            alt="Profile Preview"
            className="w-28 h-28 rounded-full object-cover border border-gray-300 shadow"
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePictureField;
