"use client";

import { motion } from "framer-motion";

interface MotionWrapperProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export const MotionWrapper = ({ children, className, delay = 0 }: MotionWrapperProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const MotionItem = ({ children, className, delay = 0 }: MotionWrapperProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay, ease: "easeOut" }}
            className={className}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </motion.div>
    );
};
