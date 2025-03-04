const CourseViewer = () => {
  const [session, setSession] = React.useState(null);
  const [watchedVideos, setWatchedVideos] = React.useState({});
  const [darkMode, setDarkMode] = React.useState(() => {
    // Check for saved preference or use system preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) return savedMode === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [loading, setLoading] = React.useState(true);

  // Set theme class on document
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  React.useEffect(() => {
    const fetchSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('sessionId');
      
      if (!sessionId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/session/${sessionId}`);
        if (!response.ok) throw new Error('Failed to load session');
        const data = await response.json();
        setSession(data);
        
        // Load watched videos from localStorage
        const savedWatched = localStorage.getItem(`watched-${data._id}`);
        if (savedWatched) {
          setWatchedVideos(prev => ({
            ...prev,
            [data._id]: JSON.parse(savedWatched)
          }));
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
  }, []);

  const handleVideoWatch = (videoIndex) => {
    if (!session) return;
    
    const sessionVideos = watchedVideos[session._id] || [];
    if (!sessionVideos.includes(videoIndex) && (videoIndex === 0 || sessionVideos.includes(videoIndex - 1))) {
      const updatedVideos = [...sessionVideos, videoIndex];
      setWatchedVideos(prev => ({
        ...prev,
        [session._id]: updatedVideos
      }));
      
      // Save to localStorage
      localStorage.setItem(`watched-${session._id}`, JSON.stringify(updatedVideos));
    }
  };

  const canWatchVideo = (videoIndex) => {
    if (!session) return false;
    if (videoIndex === 0) return true;
    const sessionVideos = watchedVideos[session._id] || [];
    return sessionVideos.includes(videoIndex - 1);
  };

  const getProgress = () => {
    if (!session) return 0;
    const watched = watchedVideos[session._id]?.length || 0;
    return Math.round((watched / session.videos.length) * 100);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  if (loading) {
    return React.createElement('div', { 
      className: 'min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white transition-colors duration-300'
    },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4' }),
        React.createElement('p', { className: 'text-lg' }, 'Loading course...')
      )
    );
  }

  if (!session) {
    return React.createElement('div', { 
      className: 'min-h-screen p-6 flex items-center justify-center dark:bg-gray-900 dark:text-white transition-colors duration-300'
    },
      React.createElement('div', { className: 'text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Session Not Found'),
        React.createElement('p', { className: 'mb-6' }, 'The requested course session could not be loaded. Please check the URL or return to your courses.'),
        React.createElement('button', {
          className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
          onClick: () => window.location.href = '/student-portal.html'
        }, 'Return to Courses')
      )
    );
  }

  return React.createElement('div', { 
    className: 'min-h-screen pb-12 dark:bg-gray-900 dark:text-white transition-colors duration-300'
  },
    // Header with theme toggle
    React.createElement('header', { 
      className: 'sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md p-4 mb-6 transition-colors duration-300'
    },
      React.createElement('div', { className: 'max-w-6xl mx-auto flex justify-between items-center' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('button', {
            className: 'mr-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
            onClick: () => window.location.href = '/student-portal.html',
            'aria-label': 'Back to courses'
          }, 
            React.createElement('svg', { 
              xmlns: 'http://www.w3.org/2000/svg', 
              className: 'h-6 w-6', 
              fill: 'none', 
              viewBox: '0 0 24 24', 
              stroke: 'currentColor' 
            },
              React.createElement('path', { 
                strokeLinecap: 'round', 
                strokeLinejoin: 'round', 
                strokeWidth: 2, 
                d: 'M10 19l-7-7m0 0l7-7m-7 7h18' 
              })
            )
          ),
          React.createElement('h1', { className: 'text-xl font-bold truncate' }, session.subjectName)
        ),
        React.createElement('button', { 
          onClick: toggleDarkMode,
          className: 'p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors',
          'aria-label': darkMode ? 'Switch to light mode' : 'Switch to dark mode'
        },
          darkMode ? 
            React.createElement('svg', { 
              xmlns: 'http://www.w3.org/2000/svg', 
              className: 'h-5 w-5', 
              viewBox: '0 0 20 20', 
              fill: 'currentColor' 
            },
              React.createElement('path', { 
                fillRule: 'evenodd',
                d: 'M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z',
                clipRule: 'evenodd' 
              })
            ) :
            React.createElement('svg', { 
              xmlns: 'http://www.w3.org/2000/svg', 
              className: 'h-5 w-5', 
              viewBox: '0 0 20 20', 
              fill: 'currentColor' 
            },
              React.createElement('path', { 
                d: 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' 
              })
            )
        )
      )
    ),
    
    // Course info and progress
    React.createElement('div', { className: 'max-w-6xl mx-auto px-4' },
      React.createElement('div', { 
        className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8 transition-colors duration-300'
      },
        React.createElement('div', { className: 'p-6' },
          React.createElement('h1', { className: 'text-3xl font-bold mb-2' }, session.subjectName),
          React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 mb-1' }, 
            `Instructor: ${session.authorName}`
          ),
          React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 mb-4' }, 
            `${session.videos?.length || '0'} ${session.videos?.length === 1 ? 'Session' : 'Sessions'}`
        ),
          
          // Progress bar
          React.createElement('div', { className: 'mt-4' },
            React.createElement('div', { className: 'flex justify-between mb-1' },
              React.createElement('span', { className: 'text-sm font-medium' }, 'Course Progress'),
              React.createElement('span', { className: 'text-sm font-medium' }, `${getProgress()}%`)
            ),
            React.createElement('div', { className: 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5' },
              React.createElement('div', { 
                className: 'bg-blue-600 h-2.5 rounded-full transition-all duration-500',
                style: { width: `${getProgress()}%` }
              })
            )
          )
        )
      ),
      
      // Videos list
      React.createElement('div', { className: 'space-y-6' },
        session.videos.map((video, index) =>
          React.createElement('div', { 
            key: video.videoId,
            className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300'
          },
            React.createElement('div', { 
              className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'
            },
              React.createElement('h2', { className: 'text-xl font-semibold' },
                `Session ${index + 1}: ${video.sessionTitle}`
              ),
              watchedVideos[session._id]?.includes(index) &&
                React.createElement('span', { 
                  className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                },
                  React.createElement('svg', {
                    className: 'mr-1 h-4 w-4',
                    fill: 'currentColor',
                    viewBox: '0 0 20 20'
                  },
                    React.createElement('path', {
                      fillRule: 'evenodd',
                      d: 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z',
                      clipRule: 'evenodd'
                    })
                  ),
                  'Completed'
                )
            ),
            React.createElement('div', { className: 'p-6' },
              canWatchVideo(index) ?
                React.createElement('div', null,
                  React.createElement('video', {
                    className: 'w-full rounded-lg',
                    controls: true,
                    onEnded: () => handleVideoWatch(index),
                    poster: `/thumbnails/${video.videoId}.jpg`
                  },
                    React.createElement('source', {
                      src: `/video/${video.videoId}`,
                      type: 'video/mp4'
                    })
                  ),
                  React.createElement('div', { 
                    className: 'mt-4 text-sm text-gray-600 dark:text-gray-400'
                  }, video.description || 'Watch this session to continue your learning journey.')
                ) :
                React.createElement('div', { 
                  className: 'bg-gray-100 dark:bg-gray-700 p-8 text-center rounded-lg flex flex-col items-center transition-colors duration-300'
                },
                  React.createElement('svg', {
                    className: 'w-12 h-12 text-gray-400 dark:text-gray-500 mb-4',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24'
                  },
                    React.createElement('path', {
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      strokeWidth: 2,
                      d: 'M12 15v-3m0 0v-3m0 3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
                    })
                  ),
                  React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 
                    'Complete the previous session to unlock this video'
                  ),
                  React.createElement('button', {
                    className: 'mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
                    onClick: () => {
                      const previousVideo = document.querySelector(`[data-video-id="${session.videos[index-1].videoId}"]`);
                      if (previousVideo) {
                        previousVideo.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }, 'Go to Previous Session')
                )
            )
          )
        )
      )
    )
  );
};