export const userSchema = {
  name: {
    isLength: {
      options: {
        min: 2,
        max: 30,
      },
      errorMessage: 'Username must be at least 3 characters and max 30',
    },
    notEmpty: {
      errorMessage: 'Username is required',
    },
    isString: {
      errorMessage: 'Username must be a string',
    }
  },
  password: {
    isLength: {
      options: {
        min: 2,
        max: 30,
      },
      errorMessage: 'Password must be at least 3 characters and max 30',
    },
    notEmpty: {
      errorMessage: 'Password is required',
    },
  },
}
