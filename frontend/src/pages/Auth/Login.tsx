import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { login, register } from "../features/auth/authSlice";
import { Input, Button } from "../components";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await dispatch(login({ email, password })).unwrap();
      setError("");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 p-8 bg-rentora-card rounded-lg border border-rentora-border shadow-lg">
        <h2 className="text-2xl font-bold text-rentora-dark text-center">Welcome back</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Sign In"}
          </Button>
        </form>
        <p className="text-center text-sm text-rentora-muted">
          Don't have an account? <a href="/auth/register" className="font-medium text-rentora-accent">Register</a>
        </p>
      </div>
    </div>
  );
};

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await dispatch(register({ fullName, email, password })).unwrap();
      setError("");
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 p-8 bg-rentora-card rounded-lg border border-rentora-border shadow-lg">
        <h2 className="text-2xl font-bold text-rentora-dark text-center">Create account</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Sign Up"}
          </Button>
        </form>
        <p className="text-center text-sm text-rentora-muted">
          Already have an account? <a href="/auth/login" className="font-medium text-rentora-accent">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export { Login, Register };