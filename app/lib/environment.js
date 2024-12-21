// app/lib/environment.js

/**
 * Environment types
 */
export const ENV_TYPES = {
  Development: 'development',
  Staging: 'staging',
  Production: 'production'
};

/**
 * Check if current environment is development
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === ENV_TYPES.Development;
};

/**
 * Check if current environment is staging
 * @returns {boolean}
 */
export const isStaging = () => {
  return process.env.NODE_ENV === ENV_TYPES.Staging;
};

/**
 * Check if current environment is production
 * @returns {boolean}
 */
export const isProduction = () => {
  return process.env.NODE_ENV === ENV_TYPES.Production;
};