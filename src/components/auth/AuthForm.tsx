import { useState } from "react";
import { SecureLoginForm } from "./SecureLoginForm";
import { SimpleSignupForm } from "./SimpleSignupForm";

export interface AuthFormProps {
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
}

export function AuthForm({ isLogin, setIsLogin }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLogin) {
    return (
      <SimpleSignupForm
        onToggleForm={() => setIsLogin(true)}
      />
    );
  }

  return (
    <SecureLoginForm 
      loading={loading}
      setLoading={setLoading}
      onToggleForm={() => setIsLogin(false)}
    />
  );
}