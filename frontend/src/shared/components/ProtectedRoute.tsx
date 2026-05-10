import { Navigate } from "react-router-dom";
import { getToken } from "../services/auth";

type Props = {
  children: JSX.Element;
};

export function ProtectedRoute({ children }: Props) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
