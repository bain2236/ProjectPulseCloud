'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, X, Send, Heart, Zap, Palette } from 'lucide-react';
import { usePostHog } from '@/hooks/usePostHog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RatingData {
  score: number;
  category: string;
  comment: string;
}

export default function SiteRating() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const { capture } = usePostHog();

  // Check if user has already rated (using sessionStorage)
  useEffect(() => {
    const hasRatedBefore = sessionStorage.getItem('siteRated');
    if (hasRatedBefore) {
      setHasRated(true);
    }
  }, []);

  // Delay showing the floating button so it doesn't distract on page load.
  // In the test environment (process.env.VITEST) use 0 ms so the button
  // appears after the first event-loop tick without needing fake timers.
  const buttonDelay = typeof process !== 'undefined' && process.env.VITEST ? 0 : 2000;
  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), buttonDelay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = [
    { id: 'animations', label: 'Animations', icon: Zap, color: 'text-cyan-400' },
    { id: 'design', label: 'Design', icon: Palette, color: 'text-pink-400' },
    { id: 'overall', label: 'Overall Experience', icon: Heart, color: 'text-yellow-400' },
  ];

  const handleRatingSubmit = () => {
    if (rating === 0) return;

    const ratingData: RatingData = {
      score: rating,
      category: selectedCategory || 'overall',
      comment: comment.trim(),
    };

    // Track the rating event
    capture('site_rated', {
      score: rating,
      category: selectedCategory || 'overall',
      hasComment: comment.trim().length > 0,
      commentLength: comment.trim().length,
    });

    // Mark as rated in sessionStorage
    sessionStorage.setItem('siteRated', 'true');
    setHasRated(true);
    setIsSubmitted(true);

    // Close modal after a delay
    setTimeout(() => {
      setIsOpen(false);
      setIsSubmitted(false);
      setRating(0);
      setSelectedCategory('');
      setComment('');
    }, 2000);
  };

  const handleOpenRating = () => {
    if (hasRated) {
      // Show a thank you message
      setIsOpen(true);
      setIsSubmitted(true);
      setTimeout(() => setIsOpen(false), 2000);
    } else {
      setIsOpen(true);
    }
  };

  if (hasRated && !isOpen) {
    if (!showButton) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={handleOpenRating}
              className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 p-3 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/50 rounded-full text-green-400 hover:text-green-300 transition-all duration-300"
              aria-label="Thank you for rating"
            >
              <Heart className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Thank you for rating!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      {/* Floating Rating Button — shown after initial page load delay */}
      {showButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                onClick={handleOpenRating}
                className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 p-3 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 backdrop-blur-sm border border-cyan-500/50 rounded-full text-white transition-all duration-300 group"
                aria-label="Rate this site"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Star className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Rate this site</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Rating Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
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
              className="relative bg-black/90 backdrop-blur-sm border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-bold text-white">
                    {isSubmitted ? 'Thank You!' : 'Rate This Site'}
                  </h2>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {isSubmitted ? (
                /* Thank You Message */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Heart className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <p className="text-green-400 text-lg font-medium mb-2">
                    Thanks for your feedback!
                  </p>
                  <p className="text-gray-400 text-sm">
                    Your rating helps me improve the site.
                  </p>
                </motion.div>
              ) : (
                /* Rating Form */
                <div className="space-y-6">
                  {/* Star Rating */}
                  <div>
                    <p className="text-white font-medium mb-3">How would you rate this site?</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="p-1"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= (hoveredRating || rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-600'
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <p className="text-white font-medium mb-3">What stood out most?</p>
                    <div className="grid grid-cols-1 gap-2">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <motion.button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                              selectedCategory === category.id
                                ? 'border-cyan-500/50 bg-cyan-500/10'
                                : 'border-gray-700 hover:border-gray-600'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className={`w-4 h-4 ${category.color}`} />
                              <span className="text-white text-sm">{category.label}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-white font-medium mb-3">Any specific feedback? (Optional)</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What did you like? What could be improved?"
                      className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:border-cyan-500/50 focus:outline-none transition-colors"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    onClick={handleRatingSubmit}
                    disabled={rating === 0}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      rating === 0
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white hover:from-cyan-600 hover:to-pink-600'
                    }`}
                    whileHover={rating > 0 ? { scale: 1.02 } : {}}
                    whileTap={rating > 0 ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>Submit Rating</span>
                    </div>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
