import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PregnancyDetails from "../components/pregnancydetails";

function PregnancyCalendarPage() {
  const navigate = useNavigate();
  const [dueDate, setDueDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
          navigate("/login", { replace: true });
          return;
        }

        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          navigate("/login", { replace: true });
          return;
        }

        const data = await res.json();
        const dueDateStr = data?.pregnancyInfo?.dueDate;

        if (!dueDateStr) {
          // No due date set yet — send them to set one up first
          navigate("/pregnancy-setup", { replace: true });
          return;
        }

        setDueDate(new Date(dueDateStr));
      } catch (err) {
        console.error(err);
        setError("Couldn't load your pregnancy info. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [navigate]);

  const handlePregnancyUpdate = (updatedUser) => {
    const dueDateStr = updatedUser?.pregnancyInfo?.dueDate;
    if (dueDateStr) setDueDate(new Date(dueDateStr));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF6F3]">
        <p className="text-sm animate-pulse" style={{ color: "#8F8290" }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF6F3]">
        <p className="text-sm" style={{ color: "#E23670" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF6F3]">
      <div className="max-w-3xl mx-auto p-6">
        <PregnancyDetails
          dueDate={dueDate}
          apiBaseUrl="http://localhost:5000/api"
          authToken={localStorage.getItem("token")}
          onPregnancyUpdate={handlePregnancyUpdate}
          showStats={false}
        />
      </div>
    </div>
  );
}

export default PregnancyCalendarPage;