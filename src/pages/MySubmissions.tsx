
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MySubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMySubmissions(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchMySubmissions = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }
  if (!user) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 bg-white shadow rounded">
        <h2 className="text-lg font-bold text-center">Sign in to view your submissions</h2>
        <a href="/auth" className="underline text-blue-600 hover:text-blue-800 block text-center mt-4">Go to Auth</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Submissions</h1>
      {submissions.length === 0 ? (
        <div className="text-gray-600">No submissions yet.</div>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <Card key={sub.id} className="p-4">
              <h3 className="font-semibold">{sub.full_name}</h3>
              <p className="text-sm text-gray-600">{sub.title}</p>
              <p className="text-xs text-gray-400">{new Date(sub.created_at).toLocaleString()}</p>
              <div>
                <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
                  View Video
                </a>
              </div>
              <div className="text-xs mt-2">Published: {sub.is_published ? "Yes" : "No"}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubmissions;
