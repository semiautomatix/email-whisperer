import ProtectedRoute from "@/app/components/ProtectedRoute";
import DashboardContent from "@/app/components/DashboardContent";

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
