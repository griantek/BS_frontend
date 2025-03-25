"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Card, CardBody, Divider } from "@nextui-org/react";
import { motion } from "framer-motion";
import { getUserRole } from "@/utils/authCheck";
import { ShieldCheckIcon, UserGroupIcon, UserIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<
    "executive" | "admin" | "client" | null
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
        router.replace("/business/conversion");
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

  const navigateToAdmin = () => {
    router.push("/admin");
  };

  const navigateToExecutive = () => {
    router.push("/business/executive/login");
  };

  const navigateToClient = () => {
    router.push("/business/clients/login");
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background to-background/90 overflow-hidden flex items-center justify-center px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl opacity-60"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      {/* Main Content - Improved responsiveness */}
      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center h-full max-w-5xl">
        <div className="w-full flex flex-col items-center">
          {/* Logo - Improved square appearance */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 sm:mb-5 relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-primary/15 rounded-2xl filter blur-xl z-0 animate-pulse-slow"></div>
            <Image
              src="/logo.png"
              alt="Griantek Logo"
              width={80}
              height={80}
              className="drop-shadow-glow relative z-10 w-20 h-20 sm:w-24 sm:h-24 object-contain"
              priority
            />
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-6 sm:mb-8"
          >
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-600 to-secondary bg-300% animate-gradient"
            >
              Enterprise Business Suite
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-default-600 max-w-2xl mx-auto leading-relaxed"
            >
              Select your portal to access the system
            </motion.p>
          </motion.div>

          {/* Portal Selection Cards - More responsive grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-full grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3"
          >
            {/* Admin Card */}
            <Card
              isPressable
              className={`group transform transition-all duration-500 hover:scale-[1.02] cursor-pointer backdrop-filter backdrop-blur-sm bg-background/50 border border-white/10 ${
                hoveredCard === "admin" ? "ring-2 ring-primary shadow-xl shadow-primary/10" : "shadow-lg"
              }`}
              onMouseEnter={() => setHoveredCard("admin")}
              onMouseLeave={() => setHoveredCard(null)}
              onPress={navigateToAdmin}
            >
              <CardBody className="p-4 sm:p-6">
                <div className="flex flex-col">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto"
                  >
                    <ShieldCheckIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </motion.div>
                  
                  <h2 className="text-lg sm:text-xl font-bold text-center mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                    Administration Portal
                  </h2>
                  
                  <p className="text-default-500 text-center mb-3 sm:mb-4 text-xs sm:text-sm">
                    System management with enhanced security controls
                  </p>
                  
                  <Button
                    color="primary"
                    variant="shadow"
                    size="md"
                    className="w-full font-medium"
                    onPress={navigateToAdmin}
                  >
                    Access Admin
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Executive Card */}
            <Card
              isPressable
              className={`group transform transition-all duration-500 hover:scale-[1.02] cursor-pointer backdrop-filter backdrop-blur-sm bg-background/50 border border-white/10 ${
                hoveredCard === "executive" ? "ring-2 ring-secondary shadow-xl shadow-secondary/10" : "shadow-lg"
              }`}
              onMouseEnter={() => setHoveredCard("executive")}
              onMouseLeave={() => setHoveredCard(null)}
              onPress={navigateToExecutive}
            >
              <CardBody className="p-4 sm:p-6">
                <div className="flex flex-col">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mx-auto"
                  >
                    <UserGroupIcon className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
                  </motion.div>
                  
                  <h2 className="text-lg sm:text-xl font-bold text-center mb-1 sm:mb-2 group-hover:text-secondary transition-colors">
                    Executive Portal
                  </h2>
                  
                  <p className="text-default-500 text-center mb-3 sm:mb-4 text-xs sm:text-sm">
                    Business operations and workflow management
                  </p>
                  
                  <Button
                    color="secondary"
                    variant="shadow"
                    size="md"
                    className="w-full font-medium"
                    onPress={navigateToExecutive}
                  >
                    Access Executive
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Client Card - New */}
            <Card
              isPressable
              className={`group transform transition-all duration-500 hover:scale-[1.02] cursor-pointer backdrop-filter backdrop-blur-sm bg-background/50 border border-white/10 ${
                hoveredCard === "client" ? "ring-2 ring-success shadow-xl shadow-success/10" : "shadow-lg"
              }`}
              onMouseEnter={() => setHoveredCard("client")}
              onMouseLeave={() => setHoveredCard(null)}
              onPress={navigateToClient}
            >
              <CardBody className="p-4 sm:p-6">
                <div className="flex flex-col">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mx-auto"
                  >
                    <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
                  </motion.div>
                  
                  <h2 className="text-lg sm:text-xl font-bold text-center mb-1 sm:mb-2 group-hover:text-success transition-colors">
                    Client Portal
                  </h2>
                  
                  <p className="text-default-500 text-center mb-3 sm:mb-4 text-xs sm:text-sm">
                    Access your projects and submission tracking
                  </p>
                  
                  <Button
                    color="success"
                    variant="shadow"
                    size="md"
                    className="w-full font-medium text-white"
                    onPress={navigateToClient}
                  >
                    Access Executive
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 sm:mt-8 text-center"
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
