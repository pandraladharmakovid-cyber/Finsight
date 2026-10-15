import api from './api.js';

const USER_ID =
  import.meta.env.VITE_FINSIGHT_USER_ID;

function requireUserId() {
  if (!USER_ID) {
    throw new Error(
      'VITE_FINSIGHT_USER_ID is not configured.',
    );
  }

  return USER_ID;
}

export async function getDashboard() {
  const userId = requireUserId();

  return api.get(
    `/dashboard/${userId}`,
  );
}

export async function getDashboardActivity() {
  const userId = requireUserId();

  return api.get(
    `/dashboard/${userId}/activity`,
  );
}

export async function getDashboardAnalytics() {
  const userId = requireUserId();

  return api.get(
    `/dashboard/${userId}/analytics`,
  );
}

export default {
  getDashboard,
  getDashboardActivity,
  getDashboardAnalytics,
};