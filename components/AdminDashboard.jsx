const AdminDashboard = () => {
  const [stats, setStats] = React.useState({
    mentors: 0,
    subjects: 0,
    paidSessions: 0,
    freeSessions: 0,
  });
  const [mentors, setMentors] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [subjects, setSubjects] = React.useState({ free: [], paid: [] });
  const [sessions, setSessions] = React.useState([]);
  const [activeView, setActiveView] = React.useState('dashboard');
  const [token, setToken] = React.useState('');
  const [userData, setUserData] = React.useState({
    name: '',
    isAdmin: false,
    accessLevel: null
  });
  
  React.useEffect(() => {
    // Get token from localStorage on component mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      
      // Fetch user data including admin status
      const fetchUserData = async () => {
        try {
          const response = await fetch('/auth/admin/check', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
          
          if (response.ok) {
            const data = await response.json();
            setUserData({
              name: data.admin.name || localStorage.getItem('userName') || 'Admin User',
              isAdmin: true, // If this endpoint responds successfully, user is an admin
              accessLevel: data.admin.accessLevel || localStorage.getItem('accessLevel') || 'basic'
            });
          } else {
            // If response is not OK, user might not be an admin
            alert('Authorization failed. Please login with an admin account.');
            handleLogout();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Optional: Handle session expiry or token issues
          if (error.message.includes('token') || error.message.includes('auth')) {
            handleLogout();
          }
        }
      };
      
      fetchUserData();
    } else {
      // Redirect to login page if no token
      alert('Please login first to access admin dashboard');
      window.location.href = '/admin-auth.html';
    }
    
    const fetchStats = async () => {
      try {
        const res = await fetch('/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Use mock data for development
        setStats({
          mentors: 10,
          subjects: 15,
          paidSessions: 45,
          freeSessions: 32,
          students: students.length
        });
      }
    };

    const fetchData = async () => {
      try {
        const [mentorsRes, studentsRes, subjectsRes, sessionsRes] = await Promise.all([
          fetch('/admin/mentors'),
          fetch('/admin/students'),
          fetch('/admin/subjects'),
          fetch('/sessions')
        ]);
    
        const mentorsData = await mentorsRes.json();
        const studentsData = await studentsRes.json();
        const subjectsData = await subjectsRes.json();
        const sessionsData = await sessionsRes.json();
    
        // Filter out the admin from the mentors list
        const filteredMentors = mentorsData.filter(mentor => !mentor.isAdmin);
    
        setMentors(filteredMentors);
        setStudents(studentsData);
        setSubjects(subjectsData);
        setSessions(sessionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Mock data for development
        setMentors([
          {_id: '1', name: 'John Doe', email: 'john@example.com', sessions: ['s1', 's2'], isAdmin: false},
          {_id: '2', name: 'Jane Smith', email: 'jane@example.com', sessions: ['s3'], isAdmin: false}
        ]);
        setStudents([
          {_id: '1', name: 'Student A', email: 'studenta@example.com', enrollments: 3},
          {_id: '2', name: 'Student B', email: 'studentb@example.com', enrollments: 2}
        ]);
        setSessions([
          {_id: 's1', subjectName: 'Math', sessionType: 'free', sessions: 10, authorName: 'John Doe'},
          {_id: 's2', subjectName: 'Science', sessionType: 'free', sessions: 8, authorName: 'Jane Smith'},
          {_id: 's3', subjectName: 'Advanced Coding', sessionType: 'paid', sessions: 12, price: 199, authorName: 'John Doe'}
        ]);
      }
    };

    fetchStats();
    fetchData();
  }, []);

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      // Check if token exists
      if (!token) {
        alert('Authentication required. Please login first.');
        window.location.href = '/admin-auth.html';
        return;
      }
      
      let endpoint;
      if (type === 'subject') {
        endpoint = `/admin/delete-subject/${id}`;
      } else if (type === 'mentor') {
        endpoint = `/admin/delete-mentor/${id}`;
      } else if (type === 'student') {
        endpoint = `/admin/delete-student/${id}`;
      }
      
      console.log(`Deleting ${type} with ID: ${id} using endpoint: ${endpoint}`);
      
      const res = await fetch(endpoint, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        alert(`${type} deleted successfully`);
        // Refresh data
        window.location.reload();
      } else {
        // Try to parse error response
        try {
          const errorData = await res.json();
          alert(`Failed to delete: ${errorData.message || 'Unknown error'}`);
        } catch (e) {
          // If parsing failed, show status text
          alert(`Failed to delete: Server returned ${res.status} ${res.statusText}`);
        }
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Error deleting ${type}: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('accessLevel');
    alert('Logged out successfully');
    window.location.href = '/admin-auth.html';
  };

  // Add this method to render admin info
  const renderAdminInfo = () => (
    <div className="bg-white p-4 shadow rounded mb-6">
      <h2 className="text-lg font-semibold mb-2">Admin Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Logged in as</p>
          <p className="font-medium">{userData.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Access Level</p>
          <p className="font-medium">
            {userData.isAdmin 
              ? (userData.accessLevel === 'full' ? 'Full Access' : 'Basic Access')
              : 'Limited Access'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Session Expires</p>
          <p className="font-medium">24 hours from login</p>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    // Calculate total sessions for percentage calculation
    const totalSessions = stats.paidSessions + stats.freeSessions;
    const paidPercentage = totalSessions > 0 ? (stats.paidSessions / totalSessions * 100).toFixed(1) : 0;
    const freePercentage = totalSessions > 0 ? (stats.freeSessions / totalSessions * 100).toFixed(1) : 0;
    
    return (
      <>
        <h1 className="text-2xl font-bold mb-6">Administration Dashboard</h1>
        
        {/* Add Admin Info Section */}
        {renderAdminInfo()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 shadow rounded">
            <h3 className="font-semibold text-gray-500 mb-2">Total Mentors</h3>
            <p className="text-3xl font-bold text-blue-700">{stats.mentors}</p>
          </div>
          <div className="bg-white p-6 shadow rounded">
            <h3 className="font-semibold text-gray-500 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-indigo-600">{students.length}</p>
          </div>
          <div className="bg-white p-6 shadow rounded">
            <h3 className="font-semibold text-gray-500 mb-2">Total Subjects</h3>
            <p className="text-3xl font-bold text-green-600">{stats.subjects}</p>
          </div>
          <div className="bg-white p-6 shadow rounded">
            <h3 className="font-semibold text-gray-500 mb-2">Paid Sessions</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.paidSessions}</p>
          </div>
          <div className="bg-white p-6 shadow rounded">
            <h3 className="font-semibold text-gray-500 mb-2">Free Sessions</h3>
            <p className="text-3xl font-bold text-amber-500">{stats.freeSessions}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white shadow rounded p-6">
            <h2 className="text-xl font-bold mb-4">Session Type Distribution</h2>
            <div className="flex flex-col items-center">
              {/* Pie chart visualization using simple SVG */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100">
                  {/* Background circle (Free sessions) */}
                  <circle cx="50" cy="50" r="40" fill="#F59E0B" />
                  
                  {/* Paid sessions slice */}
                  {paidPercentage > 0 && (
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="#8B5CF6"
                      stroke="none"
                      strokeWidth="0"
                      strokeDasharray={`${paidPercentage * 2.51} 251`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                      style={{ clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)" }}
                    />
                  )}
                  
                  {/* Inner circle (cutout for donut chart) */}
                  <circle cx="50" cy="50" r="25" fill="white" />
                  
                  {/* Total count in center */}
                  <text x="50" y="45" textAnchor="middle" fontSize="10" fontWeight="bold">
                    {totalSessions}
                  </text>
                  <text x="50" y="55" textAnchor="middle" fontSize="6">
                    Sessions
                  </text>
                </svg>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center mt-4 space-x-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-600 mr-2"></div>
                  <span>Paid ({paidPercentage}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-amber-500 mr-2"></div>
                  <span>Free ({freePercentage}%)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded p-6">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="overflow-hidden">
              <ul className="divide-y">
                {sessions.slice(0, 5).map(session => (
                  <li key={session._id} className="py-3">
                    <p className="font-medium">{session.subjectName}</p>
                    <p className="text-sm text-gray-500">by {session.authorName} • {session.sessionType === 'paid' ? `$${session.price}` : 'Free'}</p>
                  </li>
                ))}
                {sessions.length === 0 && <p className="text-gray-500 italic">No recent activity</p>}
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderFreeSubjects = () => {
    // Filter sessions to get only free ones
    const freeSubjectSessions = sessions.filter(session => session.sessionType === 'free');
    
    return (
      <>
        <h1 className="text-2xl font-bold mb-6">Free Subjects</h1>
        <div className="bg-white shadow rounded">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {freeSubjectSessions.map(session => (
                  <tr key={session._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.subjectName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{session.authorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{session.sessions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete('subject', session._id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
                {freeSubjectSessions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 italic">No free subjects available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderPaidSubjects = () => {
    // Filter sessions to get only paid ones
    const paidSubjectSessions = sessions.filter(session => session.sessionType === 'paid');
    
    return (
      <>
        <h1 className="text-2xl font-bold mb-6">Paid Subjects</h1>
        <div className="bg-white shadow rounded">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paidSubjectSessions.map(session => (
                  <tr key={session._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.subjectName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{session.authorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{session.sessions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">${session.price || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete('subject', session._id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
                {paidSubjectSessions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 italic">No paid subjects available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderAllMentors = () => (
    <>
      <h1 className="text-2xl font-bold mb-6">All Mentors</h1>
      <div className="bg-white shadow rounded">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Subjects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mentors.map(mentor => {
                // Count the number of sessions this mentor has
                const mentorSessions = sessions.filter(session => session.authorName === mentor.name);
                
                return (
                  <tr key={mentor._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mentor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{mentor.email || 'Not available'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{mentorSessions.length}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete('mentor', mentor._id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                );
              })}
              {mentors.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 italic">No mentors available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderAllStudents = () => (
    <>
      <h1 className="text-2xl font-bold mb-6">All Students ({students.length})</h1>
      <div className="bg-white shadow rounded">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled Courses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(student => (
                <tr key={student._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {student.profileImage ? (
                        <img src={student.profileImage} alt={student.name} className="h-10 w-10 rounded-full mr-3" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <span className="text-gray-500 font-medium">{student.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.email || 'Not available'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.phoneNumber || 'Not available'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {student.enrolledSessions ? student.enrolledSessions.length : (student.enrollments || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleDelete('student', student._id)} className="text-red-600 hover:text-red-900 mr-3">Delete</button>
                    <button className="text-blue-600 hover:text-blue-900">View Details</button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">No students available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'freeSubjects':
        return renderFreeSubjects();
      case 'paidSubjects':
        return renderPaidSubjects();
      case 'mentors':
        return renderAllMentors();
      case 'students':
        return renderAllStudents();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <div className="w-full md:w-64 bg-blue-900 text-white p-5">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <ul>
          <li className={`mb-3 py-2 px-3 rounded cursor-pointer transition-colors ${activeView === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-800'}`} 
              onClick={() => setActiveView('dashboard')}>
            Dashboard
          </li>
          <li className={`mb-3 py-2 px-3 rounded cursor-pointer transition-colors ${activeView === 'freeSubjects' ? 'bg-blue-700' : 'hover:bg-blue-800'}`}
              onClick={() => setActiveView('freeSubjects')}>
            Free Subjects
          </li>
          <li className={`mb-3 py-2 px-3 rounded cursor-pointer transition-colors ${activeView === 'paidSubjects' ? 'bg-blue-700' : 'hover:bg-blue-800'}`}
              onClick={() => setActiveView('paidSubjects')}>
            Paid Subjects
          </li>
          <li className={`mb-3 py-2 px-3 rounded cursor-pointer transition-colors ${activeView === 'mentors' ? 'bg-blue-700' : 'hover:bg-blue-800'}`}
              onClick={() => setActiveView('mentors')}>
            All Mentors
          </li>
          <li className={`mb-3 py-2 px-3 rounded cursor-pointer transition-colors ${activeView === 'students' ? 'bg-blue-700' : 'hover:bg-blue-800'}`}
              onClick={() => setActiveView('students')}>
            All Students
          </li>
        </ul>
        
        {token && (
          <div className="mt-auto pt-4 border-t border-blue-800">
            <button 
              onClick={handleLogout}
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 rounded text-white transition-colors">
              Logout
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 p-6">
        {token ? (
          renderContent()
        ) : (
          <div className="bg-white p-6 shadow rounded">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            <p className="mb-4">Please login to access the admin dashboard.</p>
            <a href="/login.html" className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// Make the component globally available
window.AdminDashboard = AdminDashboard;