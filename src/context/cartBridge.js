/**
 * A tiny bridge so CustomerAuthContext can tell StoreContext when the user
 * logs in or out, without creating a circular import.
 *
 * StoreContext registers its callbacks here once it mounts.
 * CustomerAuthContext calls them after login / logout.
 */

let _syncOnLogin = null;
let _clearOnLogout = null;

export function registerCartCallbacks({ syncOnLogin, clearOnLogout }) {
  _syncOnLogin = syncOnLogin;
  _clearOnLogout = clearOnLogout;
}

/** Called by CustomerAuthContext after a successful login. */
export async function notifyLogin(localCart) {
  if (_syncOnLogin) await _syncOnLogin(localCart);
}

/** Called by CustomerAuthContext after logout. */
export function notifyLogout() {
  if (_clearOnLogout) _clearOnLogout();
}
