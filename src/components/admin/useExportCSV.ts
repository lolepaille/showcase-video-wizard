
import type { Submission } from './SubmissionForms';

export function useExportCSV(submissions: Submission[]) {
  return () => {
    const columns = [
      "id", "full_name", "email", "title", "cluster", "profile_picture_url", "video_url",
      "is_published", "created_at"
    ];

    const csvHeader = columns.join(",") + "\n";
    const csvRows = submissions.map(sub => 
      columns.map(field => {
        let val = sub[field as keyof Submission];
        if (typeof val === "string") {
          val = '"' + val.replace(/"/g, '""') + '"';
        } else if (typeof val === "boolean") {
          val = val ? "TRUE" : "FALSE";
        } else if (val === null || val === undefined) {
          val = "";
        }
        return val;
      }).join(",")
    );

    const csvContent = csvHeader + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
}
