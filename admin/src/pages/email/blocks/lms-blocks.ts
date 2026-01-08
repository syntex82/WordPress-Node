/**
 * LMS/Course Email Blocks
 * Course cards, progress tracking, certificates, achievements, instructor spotlights
 */

export const LMS_BLOCK_DEFAULTS = {
  courseCard: {
    content: {
      courseTitle: 'Introduction to Web Development',
      courseImage: '',
      instructor: 'John Smith',
      instructorAvatar: '',
      duration: '8 hours',
      lessons: 24,
      level: 'Beginner',
      rating: 4.8,
      students: 1250,
      price: '$49.99',
      originalPrice: '$99.99',
      description: 'Learn the fundamentals of web development with HTML, CSS, and JavaScript.',
      buttonText: 'Enroll Now',
      buttonLink: '#',
      tags: ['HTML', 'CSS', 'JavaScript']
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 24,
      borderRadius: 16,
      showRating: true,
      showInstructor: true,
      showTags: true,
      accentColor: '#8B5CF6',
      buttonColor: '#8B5CF6',
      cardStyle: 'elevated' // elevated, flat, bordered
    }
  },

  lessonProgress: {
    content: {
      courseTitle: 'Your Course Progress',
      courseName: 'Introduction to Web Development',
      completedLessons: 12,
      totalLessons: 24,
      percentComplete: 50,
      currentLesson: 'Working with CSS Grid',
      nextLesson: 'Responsive Design Basics',
      timeRemaining: '4 hours',
      buttonText: 'Continue Learning',
      buttonLink: '#',
      streak: 5,
      lastActivity: '2 hours ago'
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      progressColor: '#10B981',
      progressBgColor: '#E5E7EB',
      showStreak: true,
      showTimeRemaining: true,
      borderRadius: 12
    }
  },

  certificateAnnouncement: {
    content: {
      headline: 'Congratulations! 🎓',
      subheadline: 'You have successfully completed',
      courseName: 'Introduction to Web Development',
      studentName: '{{user.name}}',
      completionDate: '{{completion.date}}',
      certificateId: '{{certificate.id}}',
      skills: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design'],
      buttonText: 'View Certificate',
      buttonLink: '#',
      shareText: 'Share your achievement',
      linkedInShareUrl: '#'
    },
    styles: {
      backgroundColor: '#1F2937',
      textColor: '#ffffff',
      padding: 48,
      accentColor: '#F59E0B',
      certificateBorder: '#F59E0B',
      showBadge: true,
      showSkills: true,
      textAlign: 'center'
    }
  },

  achievement: {
    content: {
      badgeIcon: '🏆',
      badgeName: 'Fast Learner',
      description: 'Completed 5 lessons in one day',
      earnedDate: 'Just now',
      points: 100,
      level: 'Gold',
      shareText: 'Share this achievement'
    },
    styles: {
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
      textColor: '#92400E',
      padding: 24,
      borderRadius: 16,
      showPoints: true,
      animateOnView: true
    }
  },

  courseRecommendations: {
    content: {
      title: 'Continue Your Learning Journey',
      subtitle: 'Based on your interests',
      courses: [
        { title: 'Advanced JavaScript', image: '', duration: '12 hours', rating: 4.9, link: '#' },
        { title: 'React Fundamentals', image: '', duration: '10 hours', rating: 4.8, link: '#' },
        { title: 'Node.js Basics', image: '', duration: '8 hours', rating: 4.7, link: '#' }
      ]
    },
    styles: {
      backgroundColor: '#F3F4F6',
      padding: 32,
      columns: 3,
      cardStyle: 'compact',
      accentColor: '#8B5CF6'
    }
  },

  instructorSpotlight: {
    content: {
      name: 'Dr. Sarah Johnson',
      avatar: '',
      title: 'Senior Web Developer',
      company: 'Tech Corp',
      bio: '15+ years of experience in web development. Taught over 50,000 students worldwide.',
      courses: 12,
      students: 50000,
      rating: 4.9,
      socialLinks: {
        twitter: '',
        linkedin: '',
        website: ''
      },
      buttonText: 'View All Courses',
      buttonLink: '#'
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      avatarSize: 120,
      layout: 'centered', // centered, left, right
      showStats: true,
      showSocial: true,
      accentColor: '#8B5CF6'
    }
  }
};

