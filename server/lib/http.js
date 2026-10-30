export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function withErrors(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.status).json({
          error: {
            code: err.code,
            message: err.message,
          },
        });
      }

      // Safe generic error - never leak internal stack, keys or tokens
      console.error('Unhandled server error:', err.message);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected internal error occurred. Please try again.',
        },
      });
    }
  };
}
