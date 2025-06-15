
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface VideoUploadOptionProps {
  onVideoFile: (file: File | null) => void;
}

const VideoUploadOption: React.FC<VideoUploadOptionProps> = ({ onVideoFile }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.startsWith("video/")) {
        alert("Please choose a video file.");
        onVideoFile(null);
        e.target.value = "";
        return;
      }
      onVideoFile(file);
    }
  };

  return (
    <div className="space-y-1">
      <Button variant="outline" type="button" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        Upload a Video Instead
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-gray-500 mt-1">
        Optional: Upload a video file if you do not wish to record one live.
      </p>
    </div>
  );
};

export default VideoUploadOption;
