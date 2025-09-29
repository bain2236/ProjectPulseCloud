'use client';

import { motion } from 'framer-motion';
import { Shield, Mail } from 'lucide-react';

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
            I use lightweight analytics to understand how visitors interact with this portfolio.
          </p>
          <p className="text-xs text-gray-500">
            No personal data is collected or sold. 
            <a 
              href="mailto:privacy@yourdomain.com" 
              className="text-cyan-400 hover:text-cyan-300 transition-colors ml-1 inline-flex items-center"
            >
              <Mail className="w-3 h-3 mr-1" />
              Contact for data removal
            </a>
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
