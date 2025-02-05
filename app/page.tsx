"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Card, CardBody } from "@nextui-org/react";
import { motion } from "framer-motion";
import { getUserRole } from "@/utils/authCheck";

export default function Home() {
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<
    "executive" | "supAdmin" | null
  >(null);

  useEffect(() => {
    const userRole = getUserRole();
    if (userRole === "supAdmin") {
      router.replace("/supAdmin");
    } else if (userRole === "executive") {
      router.replace("/business");
    } else {
      setShouldRender(true);
    }
  }, [router]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-background via-background/95 to-background">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-[800px] h-[800px] rounded-full bg-secondary/5 blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto flex flex-col items-center justify-start min-h-screen p-4 pt-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-6"
          >
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={130}
              height={130}
              className="mx-auto drop-shadow-lg"
            />
          </motion.div>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-300% animate-gradient"
          >
            Business Suite
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-default-600 max-w-xl mx-auto leading-relaxed"
          >
            Experience seamless business management with our comprehensive enterprise solution
          </motion.p>
        </div>

        {/* Login Options - adjusted margin */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 gap-6 w-full max-w-4xl px-4"
        >
          {/* Super Admin Card */}
          <Card
            className={`group transform transition-all duration-500 hover:scale-102 cursor-pointer backdrop-blur-sm bg-background/60 border-1 ${
              hoveredCard === "supAdmin" ? "border-primary shadow-lg shadow-primary/20" : "border-border"
            }`}
            onMouseEnter={() => setHoveredCard("supAdmin")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardBody className="text-center p-10">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mb-6"
              >
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                  {/* Add an icon here */}
                  <svg className="w-8 h-8 text-primary" /* Add your SVG icon here *//>
                </div>
              </motion.div>
              <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors">
                Super Admin Portal
              </h2>
              <p className="text-default-500 mb-8">
                Access system controls and administrative functions with enhanced security
              </p>
              <Button
                color="primary"
                variant="shadow"
                size="lg"
                className="w-full font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/supAdmin");
                }}
              >
                Access Admin Dashboard
              </Button>
            </CardBody>
          </Card>

          {/* Executive Card (similar structure with different content) */}
          <Card
            className={`group transform transition-all duration-500 hover:scale-102 cursor-pointer backdrop-blur-sm bg-background/60 border-1 ${
              hoveredCard === "executive" ? "border-secondary shadow-lg shadow-secondary/20" : "border-border"
            }`}
            onMouseEnter={() => setHoveredCard("executive")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardBody className="text-center p-10">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mb-6"
              >
                <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-2xl flex items-center justify-center">
                  {/* Add an icon here */}
                  <svg className="w-8 h-8 text-secondary" /* Add your SVG icon here *//>
                </div>
              </motion.div>
              <h2 className="text-2xl font-semibold mb-4 group-hover:text-secondary transition-colors">
                Executive Portal
              </h2>
              <p className="text-default-500 mb-8">
                Access your executive dashboard and manage daily operations
              </p>
              <Button
                color="secondary"
                variant="shadow"
                size="lg"
                className="w-full font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/business/login");
                }}
              >
                Access Executive Dashboard
              </Button>
            </CardBody>
          </Card>
        </motion.div>

        {/* Footer - adjusted position */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-auto py-6 w-full text-center"
        >
          <div className="flex flex-col items-center gap-2">
            <p className="text-default-500">© 2024 Graintek Business Solutions</p>
            <div className="flex gap-4 text-default-400">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
