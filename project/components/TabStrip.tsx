'use client';

import { motion } from 'framer-motion';
import { Tab } from '@/lib/types';

interface TabStripProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabStrip({ tabs, activeTab, onTabChange }: TabStripProps) {
  const sortedTabs = [...tabs].sort((a, b) => a.order - b.order);

  if (!sortedTabs.length) {
    return null;
  }
  
  return (
    <div className="flex space-x-1 bg-black/30 backdrop-blur-sm rounded-xl p-1 border border-gray-700">
      {sortedTabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`
              relative px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200
              ${isActive 
                ? 'text-white' 
                : 'text-gray-300 hover:text-white'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Active background */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 rounded-lg border border-cyan-500/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            {/* Hover effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-lg opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            
            <span className="relative z-10">{tab.title}</span>
          </motion.button>
        );
      })}
    </div>
  );
}