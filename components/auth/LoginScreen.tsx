
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { User, Role, ApprovalStatus, UserStatus, SalaryType, OperationType } from '../../types';
import { APP_NAME, ICONS } from '../../constants';

const FormWrapper = ({ title, children, onSubmit }: {
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}) => (
    <div className="w-full bg-white rounded-lg shadow-lg md:mt-0 sm:max-w-md xl:p-0">
      <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900 md:text-2xl">
          {title}
        </h1>
        <form className="space-y-4 md:space-y-6" onSubmit={onSubmit}>
          {children}
        </form>
      </div>
    </div>
);

const LoginScreen: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [jobProfile, setJobProfile] = useState('');
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [wipScope, setWipScope] = useState<OperationType[]>([]);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { state, dispatch } = useData();
  const { showNotification } = useNotification();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = state.users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.status === UserStatus.TERMINATED) {
        setError('Your account has been terminated.');
      } else if (user.approvalStatus === ApprovalStatus.PENDING) {
        setError('Your account is pending approval from an administrator.');
      } else {
        login(user);
      }
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleWipScopeChange = (scope: OperationType) => {
    setWipScope(prev => 
        prev.includes(scope) 
        ? prev.filter(s => s !== scope) 
        : [...prev, scope]
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (state.users.some(u => u.username === username)) {
      setError('Username already exists.');
      return;
    }
    
    if (wipScope.length === 0) {
        setError('Please select at least one scope of work.');
        return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password,
      role,
      approvalStatus: ApprovalStatus.PENDING,
      status: UserStatus.ACTIVE,
      details: {
        name,
        jobProfile,
        image: `https://picsum.photos/seed/${username}/100`,
        salaryType: SalaryType.DAILY,
        salaryAmount: 0,
        wipScope,
      },
    };

    dispatch({ type: 'ADD_USER', payload: newUser });
    showNotification("RECORDED SUCCESSFULLY");
    setIsRegistering(false);
    setUsername('');
    setPassword('');
    setName('');
    setJobProfile('');
    setRole(Role.EMPLOYEE);
    setWipScope([]);
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-slate-900">
        <span className="w-8 h-8 mr-2 text-primary-600">{ICONS.logo}</span>
        {APP_NAME}
      </a>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md w-full sm:max-w-md text-center">{error}</div>}
      
      {isRegistering ? (
        <FormWrapper title="Create an account" onSubmit={handleRegister}>
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-slate-900">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
          </div>
          <div>
            <label htmlFor="jobProfile" className="block mb-2 text-sm font-medium text-slate-900">Job Profile</label>
            <input type="text" id="jobProfile" value={jobProfile} onChange={(e) => setJobProfile(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
          </div>
          <div>
            <label htmlFor="role" className="block mb-2 text-sm font-medium text-slate-900">Register as</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-slate-50 border border-slate-300 text-slate-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
            >
              <option value={Role.EMPLOYEE}>Employee</option>
              <option value={Role.MANAGER}>Manager</option>
            </select>
          </div>
           <div>
            <label className="block mb-2 text-sm font-medium text-slate-900">Scope of Work (WIP)</label>
            <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center">
                    <input id="scope-cutting" type="checkbox" checked={wipScope.includes(OperationType.CUTTING)} onChange={() => handleWipScopeChange(OperationType.CUTTING)} className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500"/>
                    <label htmlFor="scope-cutting" className="ml-2 text-sm font-medium text-slate-900">Cutting</label>
                </div>
                <div className="flex items-center">
                    <input id="scope-sewing" type="checkbox" checked={wipScope.includes(OperationType.SEWING)} onChange={() => handleWipScopeChange(OperationType.SEWING)} className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500"/>
                    <label htmlFor="scope-sewing" className="ml-2 text-sm font-medium text-slate-900">Sewing</label>
                </div>
                <div className="flex items-center">
                    <input id="scope-finishing" type="checkbox" checked={wipScope.includes(OperationType.FINISHING)} onChange={() => handleWipScopeChange(OperationType.FINISHING)} className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500"/>
                    <label htmlFor="scope-finishing" className="ml-2 text-sm font-medium text-slate-900">Finishing</label>
                </div>
            </div>
          </div>
          <div>
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-slate-900">Username</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
          </div>
          <div>
            <label htmlFor="password"  className="block mb-2 text-sm font-medium text-slate-900">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
          </div>
          <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Register</button>
          <p className="text-sm font-light text-slate-500">
            Already have an account? <button type="button" onClick={() => setIsRegistering(false)} className="font-medium text-primary-600 hover:underline">Sign in</button>
          </p>
        </FormWrapper>
      ) : (
        <FormWrapper title="Sign in to your account" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-slate-900">Username</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-slate-900">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
          </div>
          <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Sign in</button>
          <p className="text-sm font-light text-slate-500">
            Don't have an account? <button type="button" onClick={() => setIsRegistering(true)} className="font-medium text-primary-600 hover:underline">Register here</button>
          </p>
        </FormWrapper>
      )}
    </div>
  );
};

export default LoginScreen;