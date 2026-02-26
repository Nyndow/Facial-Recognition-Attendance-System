import { useState } from "react";
import api from "@/lib/api";

export const useExportAttendance = () => {
  const [loading, setLoading] = useState(false);

  const exportPDF = async (session: any, students: any) => {
    if (!session || !students) return;
    setLoading(true);
    try {
      const res = await api.post(
        "/export-attendance",
        { session, students },
        { responseType: "blob" } 
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${session.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF", err);
      alert("Failed to export PDF");
    } finally {
      setLoading(false);
    }
  };

  return { exportPDF, loading };
};