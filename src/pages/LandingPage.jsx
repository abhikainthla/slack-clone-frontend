import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center"
    >
      {/* Brand Section */}
      <motion.div variants={itemVariants} className="mb-12 flex flex-col items-center">
        <img src="/SynCubeHalf.png" alt="SynCube logo" className="h-20 w-auto mx-auto mb-6" />
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Welcome to <span className="text-purple-400">SynCube</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-lg">
          The real-time workspace where work flows. Join your team and start collaborating today.
        </p>
      </motion.div>

      {/* Navigation Actions */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={() => navigate("/login")}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95"
        >
          <LogIn size={20} />
          Sign In
        </button>
        <button
          onClick={() => navigate("/register")}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 transition-all active:scale-95"
        >
          <UserPlus size={20} />
          Register
        </button>
      </motion.div>
      
      <motion.p variants={itemVariants} className="mt-12 text-gray-500 text-sm">
        © 2026 SynCube Inc.
      </motion.p>
    </motion.div>
  );
}