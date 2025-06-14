import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadFieldProps {
  label: string;
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  endpoint: string;
  accept: string;
  fileType: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  currentUrl,
  onUrlChange,
  endpoint,
  accept,
  fileType
}) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log(`Uploading file via API: ${endpoint}`);

      // Get the session to include authorization headers
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      headers['apikey'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cHJ6dXdicGtuYnpndGJteml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3OTM0ODUsImV4cCI6MjA2NTM2OTQ4NX0.sywWkN89zNLlTl69XGwN13xqb-OT-__UBlVSaHYKlTM';

      const res = await fetch(
        `https://mzprzuwbpknbzgtbmzix.supabase.co/functions/v1/${endpoint}`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      const result = await res.json();
      if (!res.ok || !result.url) {
        throw new Error(result.error || "Failed to upload file");
      }
      console.log(`Upload successful. Public URL: ${result.url}`);
      return result.url;
    } catch (error) {
      console.error(`Failed to upload ${fileType}:`, error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadFile(file);
      if (uploadedUrl) {
        setUrlInput(uploadedUrl);
        onUrlChange(uploadedUrl);
        toast({
          title: "Success",
          description: `${fileType} uploaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: `Failed to upload ${fileType.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the input so the same file can be uploaded again
      event.target.value = '';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlInput(newUrl);
    onUrlChange(newUrl);
  };

  const clearUrl = () => {
    setUrlInput('');
    onUrlChange('');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={urlInput}
          onChange={handleUrlChange}
          placeholder={`Enter ${fileType.toLowerCase()} URL or upload a file`}
          className="flex-1"
        />
        {urlInput && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearUrl}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept={accept}
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id={`file-${endpoint}`}
        />
        <Label
          htmlFor={`file-${endpoint}`}
          className="cursor-pointer"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? `Uploading...` : `Upload ${fileType}`}
            </span>
          </Button>
        </Label>
      </div>
      {urlInput && (
        <div className="text-sm text-gray-500">
          Current: {urlInput.length > 50 ? `${urlInput.substring(0, 50)}...` : urlInput}
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
