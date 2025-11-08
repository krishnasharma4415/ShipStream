import { v4 as uuidv4 } from 'uuid';
import { Session, User } from '../types';
import { setItem, getItem, deleteItem } from './memory-store';

const SESSION_EXPIRY = 30 * 24 * 60 * 60;

export const createSession = async (user: User): Promise<Session> => {
  const sessionId = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY * 1000);

  const session: Session = {
    sessionId,
    userId: user.id,
    createdAt: now,
    expiresAt,
    lastAccessed: now
  };

  await setItem(`session:${sessionId}`, JSON.stringify(session), SESSION_EXPIRY);
  
  return session;
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
  try {
    const sessionData = await getItem(`session:${sessionId}`);
    if (!sessionData) return null;

    const session: Session = JSON.parse(sessionData);
    
    if (new Date() > new Date(session.expiresAt)) {
      await deleteSession(sessionId);
      return null;
    }

    session.lastAccessed = new Date();
    await setItem(`session:${sessionId}`, JSON.stringify(session), SESSION_EXPIRY);

    return session;
  } catch (error) {
    return null;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    await deleteItem(`session:${sessionId}`);
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
};

export const deleteUserSessions = async (userId: string): Promise<void> => {
  console.log('Session cleanup not implemented for memory store');
};