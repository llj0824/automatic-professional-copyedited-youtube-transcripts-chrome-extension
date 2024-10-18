   // tests/setupJestMocks.js
   import { jest } from '@jest/globals';
   import nodeFetch from 'node-fetch';

   global.fetch = nodeFetch;

   global.chrome = {
     storage: {
       local: {
         get: jest.fn(),
         set: jest.fn(),
         // Add other methods if needed
       },
       sync: {
         get: jest.fn(),
         set: jest.fn(),
         // Add other methods like remove, clear if used
       },
     },
     runtime: {
       // Add runtime mocks if necessary
     },
     // Mock other chrome APIs as required
   };

   // Mock window.alert
   global.alert = jest.fn();
