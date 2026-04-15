import { getAuthService } from '../../../app/container';

export function getStoredUserSafe() {
  return getAuthService().getCurrentUser();
}

export function isAuthenticated() {
  return getAuthService().isAuthenticated();
}

export function getRoleHomeRoute(role) {
  return getAuthService().getHomeRouteByRole(role);
}
