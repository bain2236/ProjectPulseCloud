'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProfileData, Concept } from '@/lib/types';
import ProfileCard from '@/components/ProfileCard';
import TabStrip from '@/components/TabStrip';
import VoronoiCloud from '@/components/VoronoiCloud';
import ConceptModal from '@/components/ConceptModal';
import AboutMeTab from '@/components/AboutMeTab';
import PrivacyFooter from '@/components/PrivacyFooter';
import SiteRating from '@/components/SiteRating';
import { useAnalyticsEvents } from '@/hooks/useAnalytics';

function HomePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView } = useAnalyticsEvents();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const activeTab = searchParams.get('tab') || 'about';

  // Load profile data and set initial state from URL
  useEffect(() => {
    fetch('/profile.json')
      .then(res => res.json())
      .then((data: ProfileData) => {
        setProfileData(data);
        
        const conceptIdFromUrl = searchParams.get('concept');
        if (conceptIdFromUrl) {
          const concept = data.concepts.find(c => c.id === conceptIdFromUrl);
          if (concept) {
            setSelectedConcept(concept);
          }
        }
      })
      .catch(console.error);
  }, [searchParams]);

  // Track page view on mount
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('voronoi-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setDimensions({
          width: Math.max(300, rect.width),
          height: Math.max(300, rect.height)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  console.log(profileData);

  // Filter concepts by active tab
  const filteredConcepts = useMemo(() => {
    if (!profileData) return [];
    return profileData.concepts.filter(concept => concept.tabId === activeTab);
  }, [profileData, activeTab]);

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleConceptClick = (concept: Concept | null) => {
    setSelectedConcept(concept);
    const params = new URLSearchParams(searchParams.toString());
    if (concept) {
      params.set('concept', concept.id);
    } else {
      params.delete('concept');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleModalClose = () => {
    handleConceptClick(null);
  };

  if (!profileData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen theme-${profileData.profile.theme} flex flex-col`}>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column - Profile Card */}
        <motion.aside 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full lg:w-80 p-4 lg:p-6 flex flex-col"
        >
          <ProfileCard profile={profileData.profile} />
        </motion.aside>

        {/* Right Column - Main Canvas */}
        <motion.main 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex-1 flex flex-col p-4 lg:p-6 lg:pl-0 min-h-0"
        >
          {/* Tab Strip */}
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <TabStrip
              tabs={profileData.tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </motion.div>

          {/* Main Content Area */}
          <motion.div 
            id="voronoi-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, type: "spring" }}
            className="flex-1 min-h-0"
          >
            {activeTab === 'about' && profileData.aboutMe ? (
              <AboutMeTab content={profileData.aboutMe} />
            ) : (
              <VoronoiCloud
                concepts={filteredConcepts}
                evidence={profileData.evidence}
                width={dimensions.width}
                height={dimensions.height}
                onConceptClick={handleConceptClick}
                recencyDecayDays={profileData.settings.recencyDecayDays}
              />
            )}
          </motion.div>
        </motion.main>
      </div>

      {/* Privacy Footer */}
      <PrivacyFooter />

      {/* Site Rating Widget */}
      <SiteRating />

      {/* Concept Modal */}
      <ConceptModal
        concept={selectedConcept}
        evidence={profileData.evidence}
        onClose={handleModalClose}
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(0,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,20,147,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 40%, rgba(0,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 60% 60%, rgba(255,20,147,0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(0,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,20,147,0.1) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}