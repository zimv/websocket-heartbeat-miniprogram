module.exports = {
  testMatch: ['<rootDir>/test/test.js'],
  //coverageDirectory: '<rootDir>/lib/**/*.js',
  collectCoverageFrom: ['<rootDir>/lib/**/*.js'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/test/'],
  transform: {
    '.js': ['babel-jest', {
      'presets': [
        [
          '@babel/env'
        ],
      ],
      'plugins': [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
      ]
    }]
  }
};