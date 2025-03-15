"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Card, CardBody, Divider } from "@nextui-org/react";
import { motion } from "framer-motion";
import { getUserRole } from "@/utils/authCheck";
import { ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<
    "executive" | "admin" | null
  >(null);

  useEffect(() => {
    const userRole = getUserRole();
    switch(userRole) {
      case "admin":
        router.replace("/admin");
        break;
      case "executive":
        router.replace("/business/executive");
        break;
      case "editor":
        router.replace("/business/editor");
        break;
      case "leads":
        router.replace("/business/leads");
        break;
      case "clients":
        router.replace("/business/clients");
        break;
      default:
        setShouldRender(true);
    }
  }, [router]);

  if (!shouldRender) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background to-background/90 overflow-hidden flex items-center justify-center">
      {/* Background Elements - Simplified */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl opacity-60"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      {/* Main Content - Centered container */}
      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center h-full max-w-5xl">
        <div className="w-full flex flex-col items-center">
          {/* Logo and Title Section - More compact */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 relative"
          >
            <Image
              src="/logo.png"
              alt="Griantek Logo"
              width={120}
              height={120}
              className="drop-shadow-glow relative z-10"
              priority
            />
            <div className="absolute inset-0 bg-primary/20 rounded-full filter blur-xl z-0 animate-pulse-slow"></div>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-8"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-600 to-secondary bg-300% animate-gradient"
            >
              Enterprise Business Suite
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-default-600 max-w-2xl mx-auto leading-relaxed"
            >
              Select your portal to access the system
            </motion.p>
          </motion.div>

          {/* Portal Selection Cards - Refactored for better viewport fit */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-full grid md:grid-cols-2 gap-6"
          >
            {/* Admin Card - Simplified */}
            <Card
              className={`group transform transition-all duration-500 hover:scale-[1.02] cursor-pointer backdrop-filter backdrop-blur-sm bg-background/50 border border-white/10 ${
                hoveredCard === "admin" ? "ring-2 ring-primary shadow-xl shadow-primary/10" : "shadow-lg"
              }`}
              onMouseEnter={() => setHoveredCard("admin")}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push("/admin")}
            >
              <CardBody className="p-6">
                <div className="flex flex-col">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="mb-4 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto"
                  >
                    <ShieldCheckIcon className="w-7 h-7 text-primary" />
                  </motion.div>
                  
                  <h2 className="text-xl font-bold text-center mb-2 group-hover:text-primary transition-colors">
                    Administration Portal
                  </h2>
                  
                  <p className="text-default-500 text-center mb-4 text-sm">
                    System management with enhanced security controls
                  </p>
                  
                  <Button
                    color="primary"
                    variant="shadow"
                    size="lg"
                    className="w-full font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/admin");
                    }}
                  >
                    Access Admin
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Executive Card - Simplified */}
            <Card
              className={`group transform transition-all duration-500 hover:scale-[1.02] cursor-pointer backdrop-filter backdrop-blur-sm bg-background/50 border border-white/10 ${
                hoveredCard === "executive" ? "ring-2 ring-secondary shadow-xl shadow-secondary/10" : "shadow-lg"
              }`}
              onMouseEnter={() => setHoveredCard("executive")}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push("/business/executive/login")}
            >
              <CardBody className="p-6">
                <div className="flex flex-col">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="mb-4 w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mx-auto"
                  >
                    <UserGroupIcon className="w-7 h-7 text-secondary" />
                  </motion.div>
                  
                  <h2 className="text-xl font-bold text-center mb-2 group-hover:text-secondary transition-colors">
                    Executive Portal
                  </h2>
                  
                  <p className="text-default-500 text-center mb-4 text-sm">
                    Business operations and workflow management
                  </p>
                  
                  <Button
                    color="secondary"
                    variant="shadow"
                    size="lg"
                    className="w-full font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/business/executive/login");
                    }}
                  >
                    Access Executive
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Minimalist Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-default-400 text-xs">
              © 2024 Griantek Business Solutions
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
