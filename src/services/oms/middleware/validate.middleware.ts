import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * @description Hermetic Input Validation Middleware.
 * Use Zod to ruthlessly sanitize and validate 100% of incoming request payloads.
 */
export const validateMiddleware = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ruthlessly sanitize and validate the request body
      const validatedBody = await schema.parseAsync(req.body);
      req.body = validatedBody;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'BAD_REQUEST: Payload validation failed',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR: Validation logic failed' });
    }
  };
};
