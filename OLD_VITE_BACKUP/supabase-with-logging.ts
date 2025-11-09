// src/lib/supabase-with-logging.ts - Supabase client with automatic logging
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Create base client
const baseClient = createClient(supabaseUrl, supabaseAnonKey);

// Create logging wrapper
export const supabase = new Proxy(baseClient, {
  get(target, prop) {
    const original = target[prop as keyof typeof target];

    // Intercept .from() calls
    if (prop === 'from') {
      return (table: string) => {
        const endTimer = logger.startTimer(`Supabase query: ${table}`);
        logger.debug(`Supabase: from('${table}')`);

        const query = original.call(target, table);

        // Wrap query methods
        return new Proxy(query, {
          get(queryTarget, queryProp) {
            const queryOriginal = queryTarget[queryProp as keyof typeof queryTarget];

            if (typeof queryOriginal === 'function') {
              return async (...args: any[]) => {
                const operation = String(queryProp);
                logger.debug(`Supabase: ${table}.${operation}()`, args);

                const startTime = performance.now();
                
                try {
                  const result = await queryOriginal.apply(queryTarget, args);
                  const duration = performance.now() - startTime;
                  
                  endTimer();

                  if (result.error) {
                    logger.error(`Supabase error: ${table}.${operation}`, {
                      error: result.error,
                      table,
                      operation,
                      duration: `${duration.toFixed(2)}ms`,
                    });
                  } else {
                    logger.info(`Supabase success: ${table}.${operation}`, {
                      table,
                      operation,
                      duration: `${duration.toFixed(2)}ms`,
                      count: result.data?.length || (result.data ? 1 : 0),
                    });
                  }

                  return result;
                } catch (error) {
                  const duration = performance.now() - startTime;
                  endTimer();
                  
                  logger.error(`Supabase exception: ${table}.${operation}`, {
                    error,
                    table,
                    operation,
                    duration: `${duration.toFixed(2)}ms`,
                  });
                  
                  throw error;
                }
              };
            }

            return queryOriginal;
          },
        });
      };
    }

    // Intercept .auth calls
    if (prop === 'auth') {
      const auth = original;
      
      return new Proxy(auth, {
        get(authTarget, authProp) {
          const authOriginal = authTarget[authProp as keyof typeof authTarget];

          if (typeof authOriginal === 'function') {
            return async (...args: any[]) => {
              const operation = String(authProp);
              logger.debug(`Supabase auth: ${operation}()`);

              const startTime = performance.now();
              
              try {
                const result = await authOriginal.apply(authTarget, args);
                const duration = performance.now() - startTime;

                if (result.error) {
                  logger.error(`Supabase auth error: ${operation}`, {
                    error: result.error,
                    duration: `${duration.toFixed(2)}ms`,
                  });
                } else {
                  logger.info(`Supabase auth success: ${operation}`, {
                    duration: `${duration.toFixed(2)}ms`,
                    userId: result.data?.user?.id,
                  });

                  // Set userId in logger
                  if (result.data?.user?.id) {
                    logger.setUserId(result.data.user.id);
                  }
                }

                return result;
              } catch (error) {
                const duration = performance.now() - startTime;
                
                logger.error(`Supabase auth exception: ${operation}`, {
                  error,
                  duration: `${duration.toFixed(2)}ms`,
                });
                
                throw error;
              }
            };
          }

          return authOriginal;
        },
      });
    }

    return original;
  },
});

// Log initial connection
logger.info('Supabase client initialized', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
});