'use client';

import { logger } from '@younetmedia/libs/log';
import axios from 'axios';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { ChangeEvent, FormEvent, useState } from 'react';

export const AuthPage: NextPage = () => {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const changeUsername = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setUsername(event?.target.value);
  };

  const changePassword = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setPassword(event?.target.value);
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const url = '/api/auth';
    setLoading(true);
    try {
      const data = { username, password };
      const {
        data: { accessToken },
      } = await axios.post<{ accessToken: string }>(url, data);
      sessionStorage.setItem('accessToken', accessToken);
      router.push('/');
    } catch (error) {
      logger.error(error);
    }
    setLoading(false);
  };

  return (
    <main className="h-screen w-screen bg-white">
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full max-w-xs rounded border p-8 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-center text-xl uppercase">
              {loading ? 'Loging In' : 'Buzz Metrics'}
            </h1>
          </div>
          <form onSubmit={login}>
            <div className="mb-8">
              <input
                type="text"
                id="username"
                placeholder="Username"
                className="input input-bordered w-full"
                value={username}
                onChange={changeUsername}
                required
              />
            </div>
            <div className="mb-8">
              <input
                type="password"
                id="password"
                placeholder="Password"
                className="input input-bordered w-full"
                value={password}
                onChange={changePassword}
                required
              />
            </div>
            <button type="submit" className="btn w-full bg-blue-500 text-white">
              Log In
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default AuthPage;
