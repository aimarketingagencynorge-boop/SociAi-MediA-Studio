import { BrandProfile, SocialPost, Notification, Integration } from '../types';

/**
 * JedAi Database Service (Mock DB)
 * Symuluje architekturę backendową z izolacją danych per User.
 */

const DB_PREFIX = 'sociai_db_v1_';

export const dbService = {
  // --- AUTH & USERS ---
  saveUser: (email: string, profile: BrandProfile) => {
    localStorage.setItem(`${DB_PREFIX}user_${email}`, JSON.stringify(profile));
    console.debug(`[JedAi DB] User ${email} registered/updated.`);
  },

  getUser: (email: string): BrandProfile | null => {
    const data = localStorage.getItem(`${DB_PREFIX}user_${email}`);
    return data ? JSON.parse(data) : null;
  },

  // --- MISSIONS (Projects) ---
  saveMission: (userId: string, mission: BrandProfile) => {
    localStorage.setItem(`${DB_PREFIX}mission_${userId}`, JSON.stringify(mission));
  },

  getMission: (userId: string): BrandProfile | null => {
    const data = localStorage.getItem(`${DB_PREFIX}mission_${userId}`);
    return data ? JSON.parse(data) : null;
  },

  // --- TRANSMISSIONS (Posts) ---
  saveTransmissions: (userId: string, posts: SocialPost[]) => {
    localStorage.setItem(`${DB_PREFIX}posts_${userId}`, JSON.stringify(posts));
  },

  getTransmissions: (userId: string): SocialPost[] => {
    const data = localStorage.getItem(`${DB_PREFIX}posts_${userId}`);
    return data ? JSON.parse(data) : [];
  },

  // --- DOCKING BAY (Integrations) ---
  saveIntegrations: (userId: string, integrations: any[]) => {
    localStorage.setItem(`${DB_PREFIX}integrations_${userId}`, JSON.stringify(integrations));
  },

  getIntegrations: (userId: string): any[] => {
    const data = localStorage.getItem(`${DB_PREFIX}integrations_${userId}`);
    return data ? JSON.parse(data) : [];
  },

  // --- ASSETS & NOTIFICATIONS ---
  saveNotifications: (userId: string, notifications: Notification[]) => {
    localStorage.setItem(`${DB_PREFIX}notif_${userId}`, JSON.stringify(notifications));
  },

  getNotifications: (userId: string): Notification[] => {
    const data = localStorage.getItem(`${DB_PREFIX}notif_${userId}`);
    return data ? JSON.parse(data) : [];
  }
};