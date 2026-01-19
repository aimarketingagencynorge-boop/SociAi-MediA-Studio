import { BrandProfile, SocialPost, Notification } from '../types';

/**
 * JedAi Database Service
 * Obsługuje persystencję danych z izolacją per User ID.
 */

const DB_PREFIX = 'sociai_db_v2_'; // Nowa wersja bazy

// Prosta funkcja do obfuscacji klucza e-mail
const getUid = (email: string) => btoa(email).substring(0, 16);

export const dbService = {
  saveUser: (email: string, profile: BrandProfile) => {
    const uid = getUid(email);
    const data = JSON.stringify(profile);
    localStorage.setItem(`${DB_PREFIX}u_${uid}`, data);
    console.debug(`[JedAi Sync] User ${uid} saved. Payload: ${data.length} bytes.`);
  },

  getUser: (email: string): BrandProfile | null => {
    const uid = getUid(email);
    const data = localStorage.getItem(`${DB_PREFIX}u_${uid}`);
    return data ? JSON.parse(data) : null;
  },

  saveTransmissions: (email: string, posts: SocialPost[]) => {
    const uid = getUid(email);
    const data = JSON.stringify(posts);
    localStorage.setItem(`${DB_PREFIX}p_${uid}`, data);
    console.debug(`[JedAi Sync] Transmissions for ${uid} saved. Count: ${posts.length}.`);
  },

  getTransmissions: (email: string): SocialPost[] => {
    const uid = getUid(email);
    const data = localStorage.getItem(`${DB_PREFIX}p_${uid}`);
    return data ? JSON.parse(data) : [];
  },

  saveNotifications: (email: string, notifications: Notification[]) => {
    const uid = getUid(email);
    localStorage.setItem(`${DB_PREFIX}n_${uid}`, JSON.stringify(notifications));
  },

  getNotifications: (email: string): Notification[] => {
    const uid = getUid(email);
    const data = localStorage.getItem(`${DB_PREFIX}n_${uid}`);
    return data ? JSON.parse(data) : [];
  }
};