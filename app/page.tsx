'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, Card, CardBody } from "@nextui-org/react";
import { ThemeSwitch } from "@/components/theme-switch";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<'executive' | 'supAdmin' | null>(null);  // Changed from 'admin'

  return (
    <div className=" w-full relative overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background">
        {/* Optional: Add subtle grid pattern or texture here */}
      </div>

      {/* Main Content */}
      <div className="relative z-10  flex flex-col items-center justify-center p-4">
        {/* Logo and Title Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            {/* Replace with your company logo */}
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={120}
              height={120}
              className="mx-auto"
            />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
          >
            Business Suite
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-default-500 max-w-md mx-auto"
          >
            Streamline your business operations with our comprehensive management suite
          </motion.p>
        </div>

        {/* Login Options */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6 w-full max-w-3xl px-4"
        >
          {/* Executive Login Card */}
          <Card
            className={`transform transition-all duration-300 hover:scale-105 cursor-pointer ${
              hoveredCard === 'executive' ? 'border-primary' : ''
            }`}
            onMouseEnter={() => setHoveredCard('executive')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardBody className="text-center p-8">
              <h2 className="text-2xl font-semibold mb-4">Executive Portal</h2>
              <p className="text-default-500 mb-6">
                Access your executive dashboard and manage daily operations
              </p>
              <Button
                color="primary"
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  router.push('/business/login');  // Changed from '/admin'
                }}
              >
                Login as Executive
              </Button>
            </CardBody>
          </Card>

          {/* Admin Login Card */}
          <Card
            className={`transform transition-all duration-300 hover:scale-105 cursor-pointer ${
              hoveredCard === 'supAdmin' ? 'border-primary' : ''
            }`}
            onMouseEnter={() => setHoveredCard('supAdmin')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardBody className="text-center p-8">
              <h2 className="text-2xl font-semibold mb-4">Admin Portal</h2>
              <p className="text-default-500 mb-6">
                Manage system settings and administrative tasks
              </p>
              <Button
                color="primary"
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  router.push('/supAdmin');
                }}
              >
                Login as Admin
              </Button>
            </CardBody>
          </Card>
        </motion.div>

        {/* Footer */}
        {/* <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-4 text-center text-default-400"
        >
          <p>© 2024 Your Company Name. All rights reserved.</p>
        </motion.footer> */}
      </div>
    </div>
  );
}
