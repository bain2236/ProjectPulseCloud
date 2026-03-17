'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Concept, Evidence } from '@/lib/types';
import { X, User, Calendar, Building, ExternalLink } from 'lucide-react';
import { usePostHog } from '@/hooks/usePostHog';
import { applyHighlights } from '@/lib/highlights';

interface ConceptModalProps {
  concept: Concept | null;
  evidence: Evidence[];
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  CV: 'CV',
  'LinkedIn Recommendation': 'LinkedIn',
  'Personal Win': 'Win',
};

function getSourceLabel(source: string | null | undefined): string | null {
  if (!source || source.trim() === '' || source === '...') return null;
  return SOURCE_LABELS[source] ?? source;
}

interface EvidenceCardProps {
  evidence: Evidence;
}

function EvidenceCard({ evidence }: EvidenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncatedText = evidence.text.slice(0, 150) + '...';
  const shouldTruncate = evidence.text.length > 150;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-black/40 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-cyan-400 font-mono">
              {new Date(evidence.date).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 mb-1">
            <User className="w-3 h-3 text-pink-400" />
            <span className="text-sm text-white font-medium">{evidence.author}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Building className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{evidence.authorRole}</span>
          </div>
        </div>
        
        {getSourceLabel(evidence.source) !== null && (
          <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
            {getSourceLabel(evidence.source)}
          </div>
        )}
      </div>

      {/* Text content */}
      <motion.p
        className="text-gray-300 text-sm leading-relaxed mb-3"
        animate={{ opacity: 1 }}
      >
        {isExpanded
          ? applyHighlights(evidence.text, evidence.highlights ?? [])
          : (shouldTruncate
              ? truncatedText
              : applyHighlights(evidence.text, evidence.highlights ?? [])
            )
        }
      </motion.p>

      {/* Expand button - only show if text is truncated */}
      {shouldTruncate && (
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </motion.button>
      )}
    </motion.div>
  );
}

export default function ConceptModal({ concept, evidence, onClose }: ConceptModalProps) {
  const { capture } = usePostHog();
  const [modalStartTime] = useState(Date.now());

  useEffect(() => {
    if (concept) {
      capture('modal_opened', { modal_type: 'concept_modal' });
    }
  }, [concept, capture]);

  const handleClose = () => {
    if (concept) {
      const duration = Date.now() - modalStartTime;
      capture('modal_closed', { modal_type: 'concept_modal', duration_ms: duration });
    }
    onClose();
  };

  if (!concept) return null;

  const relatedEvidence = evidence.filter(e => 
    concept.sourceEvidenceIds.includes(e.id)
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
        onClick={handleClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-black/90 backdrop-blur-sm border border-gray-700 rounded-none md:rounded-2xl w-full md:max-w-4xl h-full md:h-auto md:max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {concept.label.replace(/-/g, ' ')}
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-cyan-400">
                  Weight: {((concept.weight || 0) * 100).toFixed(0)}%
                </span>
                <span className="text-gray-400">
                  {relatedEvidence.length} evidence
                </span>
              </div>
            </div>
            
            <motion.button
              onClick={handleClose}
              className="p-3 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="close"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
            {relatedEvidence.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Supporting Evidence
                </h3>
                
                {relatedEvidence.map((evidenceItem, index) => (
                  <motion.div
                    key={evidenceItem.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.07 }}
                  >
                    <EvidenceCard evidence={evidenceItem} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No evidence found</div>
                <div className="text-gray-600 text-sm">
                  This concept doesn&apos;t have any supporting evidence yet.
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}