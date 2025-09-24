'use client';

import { motion } from 'framer-motion';
import { Profile } from '@/lib/types';
import { MapPin, Globe, User } from 'lucide-react';
import Image from 'next/image';

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-black/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6 shadow-xl"
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
        className="relative mb-6"
      >
        {profile.avatar ? (
          <Image
            src={profile.avatar}
            alt={profile.displayName}
            width={96}
            height={96}
            quality={100}
            className="w-24 h-24 rounded-full mx-auto border-2 border-gradient-to-r from-cyan-400 to-pink-500 p-0.5 object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center">
            <User className="w-12 h-12 text-black" />
          </div>
        )}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px #00FFFF40",
              "0 0 30px #FF149340",
              "0 0 20px #00FFFF40"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
        />
      </motion.div>

      {/* Name */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-2xl font-bold text-center mb-2 text-white"
      >
        {profile.displayName}
      </motion.h1>

      {/* Bio */}
      {profile.bio && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-gray-300 text-center mb-6 leading-relaxed"
        >
          {profile.bio}
        </motion.p>
      )}

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="space-y-3"
      >
        {profile.location && (
          <div className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">{profile.location}</span>
          </div>
        )}

        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-400 hover:text-pink-400 transition-colors group"
          >
            <Globe className="w-4 h-4 mr-2" />
            <span className="text-sm group-hover:underline">{profile.website}</span>
          </a>
        )}

        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Created</span>
            <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}