'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function PrivacyFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
      className="bg-black/40 backdrop-blur-sm border-t border-gray-700/50 p-4"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Privacy & Analytics</span>
        </div>
        
        <div className="text-center sm:text-right">
          <p className="mb-1">
            Anonymous analytics via PostHog EU — no cookies, no personal data, data stored in Frankfurt.
          </p>
          <p className="text-xs text-gray-500">
            Page views and interactions are tracked anonymously. No identifiers are stored or sold.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
