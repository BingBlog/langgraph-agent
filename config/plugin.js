'use strict';

module.exports = {
  // Static file serving is enabled by default
  static: {
    enable: true,
  },
  
  // CORS is enabled
  cors: {
    enable: true,
    package: 'egg-cors',
  },
}; 