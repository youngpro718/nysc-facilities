import { Navigate } from "react-router-dom";

export default function Issues() {
  return <Navigate to="/operations?tab=issues" replace />;
}
