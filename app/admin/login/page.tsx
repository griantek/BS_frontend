"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import Image from "next/image";
import { Input, Button, Card, CardBody, Spinner } from "@heroui/react";
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import api from "@/services/api";
import {
  redirectToDashboard,
  isLoggedIn,
  getUserRole,
} from "@/utils/authCheck";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface LoginFormData {
  username: string;
  password: string;
}

export default function AdminLogin() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { updateAuthState } = useAuth();

  React.useEffect(() => {
    // Check if user is already logged in
    if (isLoggedIn()) {
      const userRole = getUserRole();
      if (userRole === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/business");
      }
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await api.loginAdmin(data);
      if (response.success && response.token && response.admin) {
        api.setStoredAuth(response.token, response.admin, "admin");
        updateAuthState();
        document.body.style.cursor = "wait";
        await router.replace("/admin");
      }
    } catch (error: any) {
      // Directly use the error message from the response
      const errorMsg = error.response?.data?.error || "Failed to login";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
      document.body.style.cursor = "default";
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/90 p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      <ToastContainer />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-background/70 backdrop-blur-lg border border-primary/10 shadow-xl shadow-primary/5">
          <CardBody className="px-6 py-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                <ShieldCheckIcon className="w-8 h-8 text-primary" />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-600">
                Admin Portal
              </h1>
              <Input
                label="Username"
                placeholder="Enter your username"
                {...register("username", { required: "Username is required" })}
                isInvalid={!!errors.username}
                errorMessage={errors.username?.message}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                type={isVisible ? "text" : "password"}
                {...register("password", { required: "Password is required" })}
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
                endContent={
                  <button
                    type="button"
                    onClick={toggleVisibility}
                    className="focus:outline-none p-1"
                  >
                    {isVisible ? (
                      <EyeSlashIcon className="w-4 h-4 text-default-500" />
                    ) : (
                      <EyeIcon className="w-4 h-4 text-default-500" />
                    )}
                  </button>
                }
              />

              <Button
                type="submit"
                color="primary"
                className="w-full font-medium"
                size="lg"
                variant="shadow"
                isLoading={isLoading}
                spinner={<Spinner color="current" size="sm" />}
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-default-500">
                System Administration Access Only
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
