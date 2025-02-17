
import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

interface AuthFormProps {
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
}

export const AuthForm = ({ isLogin, setIsLogin }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
  };

  return isLogin ? (
    <LoginForm
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      loading={loading}
      setLoading={setLoading}
      onToggleForm={() => {
        setIsLogin(false);
        resetForm();
      }}
    />
  ) : (
    <SignupForm
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      loading={loading}
      setLoading={setLoading}
      onToggleForm={() => {
        setIsLogin(true);
        resetForm();
      }}
    />
  );
};
