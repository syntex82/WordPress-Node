/**
 * Interactive Email Blocks
 * Countdown timers, progress bars, ratings, video embeds, galleries, accordions, stats
 */

export const INTERACTIVE_BLOCK_DEFAULTS = {
  countdown: {
    content: {
      headline: 'Sale Ends In',
      endDate: '', // ISO date string
      expiredText: 'This offer has expired',
      labels: { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' },
      buttonText: 'Shop Now',
      buttonLink: '#',
      showButton: true
    },
    styles: {
      backgroundColor: '#EF4444',
      textColor: '#ffffff',
      padding: 40,
      timerStyle: 'boxes', // boxes, inline, circles
      boxColor: '#ffffff',
      boxTextColor: '#EF4444',
      fontSize: 'large', // small, medium, large
      textAlign: 'center'
    }
  },

  progressBar: {
    content: {
      title: 'Campaign Progress',
      current: 75,
      goal: 100,
      unit: '%',
      description: '75% of our goal reached!',
      showPercentage: true,
      showNumbers: false,
      milestones: [
        { value: 25, label: 'Started' },
        { value: 50, label: 'Halfway' },
        { value: 75, label: 'Almost there' },
        { value: 100, label: 'Complete!' }
      ]
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      progressColor: '#10B981',
      trackColor: '#E5E7EB',
      height: 12,
      borderRadius: 6,
      showMilestones: false,
      animated: true
    }
  },

  rating: {
    content: {
      title: 'How would you rate your experience?',
      subtitle: 'Click a star to submit your rating',
      currentRating: 0,
      maxRating: 5,
      ratingLabels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
      showLabels: true,
      feedbackUrl: '#'
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      starColor: '#F59E0B',
      starEmptyColor: '#D1D5DB',
      starSize: 40,
      textAlign: 'center'
    }
  },

  videoEmbed: {
    content: {
      thumbnailUrl: '',
      videoUrl: '',
      title: 'Watch Our Latest Video',
      description: 'Click to play the video',
      duration: '3:45',
      playButtonText: 'Watch Now',
      platform: 'youtube' // youtube, vimeo, custom
    },
    styles: {
      backgroundColor: '#000000',
      padding: 0,
      borderRadius: 12,
      aspectRatio: '16:9',
      showPlayButton: true,
      playButtonColor: '#EF4444',
      overlayOpacity: 0.3
    }
  },

  imageGallery: {
    content: {
      title: 'Gallery',
      images: [
        { url: '', alt: 'Image 1', caption: '' },
        { url: '', alt: 'Image 2', caption: '' },
        { url: '', alt: 'Image 3', caption: '' },
        { url: '', alt: 'Image 4', caption: '' }
      ]
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 24,
      columns: 2,
      gap: 12,
      borderRadius: 8,
      showCaptions: false,
      aspectRatio: 'square' // square, landscape, portrait
    }
  },

  accordion: {
    content: {
      title: 'Frequently Asked Questions',
      items: [
        { question: 'How do I get started?', answer: 'Simply sign up for an account and follow our getting started guide.' },
        { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and bank transfers.' },
        { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time with no penalties.' }
      ],
      defaultOpen: 0 // Index of item to show open by default, -1 for none
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      itemBorderColor: '#E5E7EB',
      questionColor: '#1F2937',
      answerColor: '#6B7280',
      iconColor: '#4F46E5',
      borderRadius: 8
    }
  },

  iconList: {
    content: {
      title: "What's Included",
      items: [
        { icon: '✓', text: 'Unlimited access to all features', highlight: false },
        { icon: '✓', text: 'Priority customer support', highlight: false },
        { icon: '✓', text: 'Regular updates and improvements', highlight: false },
        { icon: '✓', text: '30-day money-back guarantee', highlight: true }
      ]
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      iconColor: '#10B981',
      iconBgColor: '#D1FAE5',
      textColor: '#374151',
      highlightColor: '#4F46E5',
      iconSize: 24,
      spacing: 16
    }
  },

  statsGrid: {
    content: {
      title: 'By The Numbers',
      stats: [
        { value: '10K+', label: 'Happy Customers', icon: '👥' },
        { value: '99%', label: 'Satisfaction Rate', icon: '⭐' },
        { value: '24/7', label: 'Support Available', icon: '💬' },
        { value: '50+', label: 'Countries Served', icon: '🌍' }
      ]
    },
    styles: {
      backgroundColor: '#4F46E5',
      textColor: '#ffffff',
      padding: 40,
      columns: 4,
      showIcons: true,
      statValueSize: 36,
      labelSize: 14
    }
  }
};

