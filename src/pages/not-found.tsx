import { Link } from "wouter";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/motion/variants";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center bg-[#F5F5F5] px-4 py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md text-center"
      >
        <motion.div
          variants={staggerItem}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0289E8]/10 text-[#0289E8]"
        >
          <SearchX className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
        </motion.div>

        <motion.h1 variants={staggerItem} className="mb-3 text-3xl font-semibold text-[#1B004E]">
          Page Not Found
        </motion.h1>

        <motion.p variants={staggerItem} className="mb-8 text-lg text-[#777777]">
          The page you are looking for may have moved or no longer exists. Our care team is available 24/7 if you need help.
        </motion.p>

        <motion.div variants={staggerItem} className="flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-[80px] bg-[#0289E8] hover:bg-[#0289E8] px-7 py-6 font-semibold text-white">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button
            asChild
            className="rounded-[80px] border border-[#0289E8] bg-white px-7 py-6 font-semibold text-[#0289E8] hover:bg-[#F5F5F5]"
          >
            <a href="tel:051111111567">Call 051-111-111-567</a>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
