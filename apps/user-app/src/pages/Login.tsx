import { useState } from "react";
import { Navigate } from "react-router-dom";
import { App, Button, Input, Spin } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { message, modal } = App.useApp();
  const { requestOTP, verifyOTP, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSendOtp() {
    if (!isValidEmail) {
      message.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const result = await requestOTP(email.trim());
      setStep("otp");
      if (result.devOtp) {
        modal.info({
          title: "Development Code",
          content: `Use this code to sign in: ${result.devOtp}`,
        });
      } else {
        message.success("OTP sent to your email");
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(code.trim())) {
      message.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await verifyOTP(email.trim(), code.trim());
      message.success("Welcome back!");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 via-white to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-xl bg-gray-800 text-white text-xl font-bold">
              A
            </div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-1">
              Article Platform
            </h1>
            <p className="text-sm text-gray-500">
              {step === "email"
                ? "Sign in with your work email"
                : "Enter the 6-digit code sent to your email"}
            </p>
          </div>

          {step === "email" ? (
            <div className="space-y-4">
              <Input
                size="large"
                placeholder="you@company.com"
                prefix={<MailOutlined className="text-gray-400" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onPressEnter={handleSendOtp}
                disabled={loading}
              />
              <Button
                type="primary"
                size="large"
                block
                onClick={handleSendOtp}
                loading={loading}
              >
                Send OTP
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                >
                  &larr; Change email
                </button>
                <span className="text-gray-400 truncate max-w-[50%]">{email}</span>
              </div>
              <Input
                size="large"
                placeholder="6-digit code"
                prefix={<LockOutlined className="text-gray-400" />}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                onPressEnter={handleVerify}
                disabled={loading}
                className="text-center tracking-[0.5em]"
              />
              <Button
                type="primary"
                size="large"
                block
                onClick={handleVerify}
                loading={loading}
              >
                Verify
              </Button>
            </div>
          )}

          {loading && (
            <div className="mt-6 flex justify-center">
              <Spin size="small" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}