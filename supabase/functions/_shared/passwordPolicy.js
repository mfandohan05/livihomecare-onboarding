// Shared password policy rules and validation logic.
// This is used in both the frontend and backend to ensure consistency.
export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 72

export const PASSWORD_RULES = [
  { id: 'length', label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (p) => p.length >= MIN_PASSWORD_LENGTH },
  { id: 'lower',  label: 'A lowercase letter (a-z)',  test: (p) => /[a-z]/.test(p) },
  { id: 'upper',  label: 'An uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'digit',  label: 'A number (0-9)',            test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'A symbol (e.g. ! @ # $)',   test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export const PASSWORD_REQUIREMENTS_MESSAGE =
  `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include an uppercase letter, a lowercase letter, a number, and a symbol.`

export const meetsPasswordRules = (password) =>
  typeof password === 'string' && PASSWORD_RULES.every((rule) => rule.test(password))
