const StudentAuth = () => {
    const [isLogin, setIsLogin] = React.useState(true);
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
  
      const url = isLogin ? '/auth/student/login' : '/auth/student/signup';
      const body = isLogin ? { email, password } : { name, email, password };
  
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Something went wrong');
  
        // Save token and redirect
        localStorage.setItem('token', data.token);
        window.location.href = '/student-portal.html';
      } catch (err) {
        setError(err.message);
      }
    };
  
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900' },
      React.createElement('form', { onSubmit: handleSubmit, className: 'bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96 transition-colors duration-200' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white' }, isLogin ? 'Login' : 'Sign Up'),
        !isLogin && React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Name'),
          React.createElement('input', {
            type: 'text',
            value: name,
            onChange: (e) => setName(e.target.value),
            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
            required: true,
          })
        ),
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Email'),
          React.createElement('input', {
            type: 'email',
            value: email,
            onChange: (e) => setEmail(e.target.value),
            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
            required: true,
          })
        ),
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Password'),
          React.createElement('input', {
            type: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
            required: true,
          })
        ),
        error && React.createElement('div', { className: 'mb-4 text-red-600 dark:text-red-400 text-sm' }, error),
        React.createElement('button', {
          type: 'submit',
          className: 'w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200',
        }, isLogin ? 'Login' : 'Sign Up'),
        React.createElement('p', { className: 'mt-4 text-center text-sm text-gray-600 dark:text-gray-400' },
          isLogin ? "Don't have an account? " : 'Already have an account? ',
          React.createElement('button', {
            type: 'button',
            onClick: () => setIsLogin(!isLogin),
            className: 'text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300',
          }, isLogin ? 'Sign up' : 'Login')
        )
      )
    );
  };