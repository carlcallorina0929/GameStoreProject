// Shared helpers for issuing / clearing JWT cookies.
// Tokens are stored in httpOnly cookies (not localStorage) to mitigate XSS.

const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24h, matches JWT expiresIn

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // The frontend and API are deployed on different origins, so production
  // requests need cross-site cookies. SameSite=None requires Secure.
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
});

const setAuthCookie = (res, cookieName, token) => {
  res.cookie(cookieName, token, cookieOptions());
};

const clearAuthCookie = (res, cookieName) => {
  res.clearCookie(cookieName, { path: "/" });
};

module.exports = {
  setAuthCookie,
  clearAuthCookie,
};
