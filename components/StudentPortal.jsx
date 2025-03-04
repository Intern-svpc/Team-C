const StudentPortal = () => {
  const [sessions, setSessions] = React.useState([]);
  const [filteredSessions, setFilteredSessions] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [subjects, setSubjects] = React.useState([]);
  const [selectedSubject, setSelectedSubject] = React.useState('all');
  const [darkMode, setDarkMode] = React.useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedMode ? savedMode === 'true' : prefersDark;
  });
  const [studentName, setStudentName] = React.useState(''); // State to store student's name

  // Fetch student's profile data
  React.useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/student-auth.html'; // Redirect to login if no token
          return;
        }

        const response = await fetch('/auth/student/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();
        setStudentName(data.name); // Set student's name
      } catch (error) {
        console.error('Error fetching profile:', error);
        window.location.href = '/student-auth.html'; // Redirect to login on error
      }
    };

    fetchStudentProfile();
  }, []);

  // Fetch sessions
  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/sessions');
        if (!response.ok) throw new Error('Failed to fetch sessions');

        const data = await response.json();
        setSessions(data);
        setFilteredSessions(data);

        const uniqueSubjects = [...new Set(data.map(session => session.subjectName))];
        setSubjects(uniqueSubjects);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    window.location.href = '/student-auth.html'; // Redirect to login page
  };

  // Filter sessions based on search term and selected subject
  React.useEffect(() => {
    let filtered = sessions;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(session => session.subjectName === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  }, [searchTerm, selectedSubject, sessions]);

  // Navigate to session details
  const navigateToSession = (sessionId) => {
    window.location.href = `/course-viewer.html?sessionId=${sessionId}`;
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Apply dark mode class to body
  React.useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Empty state component
  const EmptyState = () => {
    return React.createElement('div', { className: 'flex flex-col items-center justify-center p-12 text-center' },
      React.createElement('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        className: 'h-24 w-24 text-gray-400 dark:text-gray-600 mb-6',
        fill: 'none',
        viewBox: '0 0 24 24',
        stroke: 'currentColor'
      },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 1.5,
          d: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
        })
      ),
      React.createElement('h3', { className: 'text-xl font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'No courses found'),
      React.createElement('p', { className: 'text-gray-500 dark:text-gray-400 mb-6' }, 'Try adjusting your search or filter criteria'),
      React.createElement('button', {
        className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition',
        onClick: () => {
          setSearchTerm('');
          setSelectedSubject('all');
        }
      }, 'Clear filters')
    );
  };

  return React.createElement('div', { className: `min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}` },
    // Header with welcome message and logout button
    React.createElement('header', { className: `${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md sticky top-0 z-10` },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center' },
        React.createElement('h1', { className: 'text-2xl font-bold flex items-center' },
          React.createElement('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            className: 'h-8 w-8 mr-2 text-blue-600',
            fill: 'none',
            viewBox: '0 0 24 24',
            stroke: 'currentColor'
          },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
            })
          ),
          'Student Portal'
        ),
        React.createElement('div', { className: 'flex items-center gap-4' },
          React.createElement('p', { className: 'text-lg font-medium' }, `Welcome, ${studentName}`), // Welcome message
          React.createElement('button', {
            onClick: handleLogout,
            className: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow transition'
          }, 'Logout') // Logout button
        )
      )
    ),
    // Main content
    React.createElement('main', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      React.createElement('div', { className: 'mb-8 text-center' },
        React.createElement('h2', { className: 'text-3xl font-bold mb-2' }, 'Available Courses'),
        React.createElement('p', { className: `${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto` },
          'Browse our collection of courses designed to help you succeed in your academic journey'
        )
      ),
      // Search and filter section
      React.createElement('div', { className: `flex flex-col md:flex-row gap-4 mb-8 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}` },
        React.createElement('div', { className: 'relative flex-1' },
          React.createElement('div', { className: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none' },
            React.createElement('svg', {
              xmlns: 'http://www.w3.org/2000/svg',
              className: `h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`,
              fill: 'none',
              viewBox: '0 0 24 24',
              stroke: 'currentColor'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              })
            )
          ),
          React.createElement('input', {
            type: 'text',
            placeholder: 'Search by subject or mentor...',
            className: `w-full pl-10 pr-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors`,
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value)
          })
        ),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('select', {
            className: `p-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors`,
            value: selectedSubject,
            onChange: (e) => setSelectedSubject(e.target.value)
          },
            React.createElement('option', { value: 'all' }, 'All Subjects'),
            subjects.map(subject =>
              React.createElement('option', { key: subject, value: subject }, subject)
            )
          )
        )
      ),
      // Course grid
      filteredSessions.length > 0 ?
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
          filteredSessions.map(session =>
            React.createElement('div', {
              key: session._id,
              className: `rounded-lg overflow-hidden cursor-pointer transform transition hover:scale-105 shadow-lg ${
                darkMode ? 'bg-gray-800 hover:shadow-blue-500/20' : 'bg-white hover:shadow-blue-500/40'
              }`,
              onClick: () => navigateToSession(session._id)
            },
              React.createElement('div', { className: `p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}` },
                React.createElement('div', { className: 'flex justify-between items-start' },
                  React.createElement('h2', { className: 'text-xl font-semibold' }, session.subjectName),
                  session.sessionType === 'paid' &&
                    React.createElement('span', {
                      className: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }, 'Premium')
                ),
                React.createElement('p', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1` },
                  `by ${session.authorName}`
                )
              ),
              React.createElement('div', { className: 'p-4' },
                React.createElement('div', { className: 'space-y-3' },
                  React.createElement('div', { className: `flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}` },
                    React.createElement('svg', {
                      xmlns: 'http://www.w3.org/2000/svg',
                      className: 'h-5 w-5 mr-2',
                      fill: 'none',
                      viewBox: '0 0 24 24',
                      stroke: 'currentColor'
                    },
                      React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
                      })
                    ),
                    `${session.videos?.length || '0'} Sessions`
                  ),
                  React.createElement('div', { className: `flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}` },
                    React.createElement('svg', {
                      xmlns: 'http://www.w3.org/2000/svg',
                      className: 'h-5 w-5 mr-2',
                      fill: 'none',
                      viewBox: '0 0 24 24',
                      stroke: 'currentColor'
                    },
                      React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      })
                    ),
                    session.sessionType === 'paid'
                      ? `₹${session.price}`
                      : 'Free'
                  ),
                  React.createElement('button', {
                    className: `mt-6 w-full py-2 px-4 rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-gray-900'
                        : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-white'
                    }`,
                    onClick: (e) => {
                      e.stopPropagation();
                      navigateToSession(session._id);
                    }
                  }, 'View Course')
                )
              )
            )
          )
        ) : React.createElement(EmptyState),
      // Load more button (placeholder)
      filteredSessions.length > 0 && React.createElement('div', { className: 'mt-12 flex justify-center' },
        React.createElement('button', {
          className: `px-4 py-2 rounded-lg border ${
            darkMode
              ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } transition-colors`
        }, 'Load More Courses')
      )
    ),
    // Footer
    React.createElement('footer', { className: `mt-12 py-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}` },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center' },
        React.createElement('p', { className: `${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, '© 2025 Student Portal. All rights reserved.')
      )
    )
  );
};