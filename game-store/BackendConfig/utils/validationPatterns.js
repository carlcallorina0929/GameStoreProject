const usernameRegex = /^[A-Za-z0-9_]{6,20}$/;
const nameRegex = /^[A-Za-z]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,64}$/;

module.exports = {
  usernameRegex,
  nameRegex,
  emailRegex,
  passwordRegex,
};

