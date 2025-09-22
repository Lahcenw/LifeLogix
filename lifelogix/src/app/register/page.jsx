"use client"; // This is required for client-side functionality

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Send a POST request to the backend's registration API
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName, lastName, username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Registration Successful! Redirecting to login...");
      setTimeout(() => {
        router.push('/login');
      }, 2000); // Redirect to login page after 2 seconds
    } else {
      setMessage(data.msg || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              id="firstName"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
          <div>
            <input
              type="text"
              id="lastName"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
          <div>
            <input
              type="text"
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
          <div>
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
          >
            Register
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-center ${message.includes('Successful') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}
        <p className="mt-6 text-gray-600 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 hover:underline font-semibold">
            Log In here
          </a>
        </p>
      </div>
    </div>
  );
}